/**
 * Whisper Transcription Proxy - Supabase Edge Function
 *
 * Securely proxies voice audio to OpenAI Whisper for speech-to-text.
 *
 * Request body (JSON):
 *   {
 *     audio_base64: string,  // base64-encoded audio file (m4a, mp3, wav, webm, ...)
 *     format:       string,  // file extension hint ('m4a' | 'mp3' | 'wav' | 'webm' | ...)
 *     language?:    string,  // optional ISO-639-1 hint (e.g. 'en'); Whisper auto-detects otherwise
 *   }
 *
 * Response (JSON):
 *   { text: string }
 *
 * SECURITY: OPENAI_API_KEY stored as a Supabase secret. Client only auths with Supabase JWT.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Generous per-day cap — voice turns are cheap (~$0.006/min) but we still want a ceiling
const RATE_LIMIT_PER_DAY = 500;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

// Whisper hard limit is 25 MB; we cap base64 payload at ~30 MB (base64 inflates ~33%)
const MAX_BASE64_BYTES = 30 * 1024 * 1024;

// Domain-vocabulary prompt for Whisper. Whisper accepts a `prompt` parameter
// that biases recognition toward expected vocabulary — it primes word
// probabilities without being included in the transcript output. This dramatically
// improves accuracy for terms that appear infrequently in general English
// training data.
//
// Real-device testing on 2026-05-18 surfaced specific failures:
//   "Process and Integrate" → "it's an integrated"
//   "a medicine session, ketamine" → "in session ketamine"
//
// These are domain terms a general model has limited exposure to. The prompt
// below is kept under ~150 tokens (well under Whisper's 224 soft limit) and
// written as natural prose because Whisper uses prompt *style* as bias too:
// formal prose biases toward formal transcripts, casual prose toward casual.
// We want casual, conversational, therapeutic tone — so the prompt is written
// the way users actually talk in this app.
const DOMAIN_PROMPT =
  "This is a conversation about psychedelic-assisted therapy and integration. " +
  "The user may say words like: ketamine, MDMA, psilocybin, mushrooms, ayahuasca, " +
  "LSD, microdose, integration, integrate, process, set and setting, journey, " +
  "trip, ceremony, medicine session, dosing, IFS, parts work, inner critic, " +
  "exile, manager, firefighter, Self, nervous system, polyvagal, ventral, " +
  "dorsal, sympathetic, dysregulation, regulation, glimmer, trigger, somatic, " +
  "embodied, trauma, attachment, schema, core belief, journaling, reflection, " +
  "preparation, post-session.";

interface TranscribeRequest {
  audio_base64: string;
  format?: string;
  language?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info',
      },
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    // 1. AUTH
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ error: 'Missing authorization header' }, 401);

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return jsonResponse({ error: 'Invalid or expired token' }, 401);

    // 2. RATE LIMIT
    const { data: rateLimitData } = await supabase
      .from('user_rate_limits')
      .select('request_count, window_start')
      .eq('user_id', user.id)
      .eq('service', 'whisper_api')
      .single();

    let requestCount = 0;
    let windowStart = new Date();

    if (rateLimitData) {
      const windowAge = Date.now() - new Date(rateLimitData.window_start).getTime();
      if (windowAge < RATE_LIMIT_WINDOW_MS) {
        requestCount = rateLimitData.request_count;
        if (requestCount >= RATE_LIMIT_PER_DAY) {
          return jsonResponse({
            error: 'Rate limit exceeded',
            limit: RATE_LIMIT_PER_DAY,
            window_reset: new Date(new Date(rateLimitData.window_start).getTime() + RATE_LIMIT_WINDOW_MS).toISOString(),
          }, 429);
        }
        windowStart = new Date(rateLimitData.window_start);
      }
    }

    // 3. PARSE
    const body: TranscribeRequest = await req.json();
    if (!body.audio_base64) {
      return jsonResponse({ error: 'Missing audio_base64' }, 400);
    }
    if (body.audio_base64.length > MAX_BASE64_BYTES) {
      return jsonResponse({ error: 'Audio file too large (max ~22 MB)' }, 413);
    }

    const format = (body.format || 'm4a').toLowerCase().replace(/^\./, '');

    // 4. DECODE base64 -> Uint8Array
    const audioBytes = base64ToBytes(body.audio_base64);

    // 5. POST to Whisper as multipart/form-data
    const mime = mimeForFormat(format);
    const audioBlob = new Blob([audioBytes], { type: mime });

    const formData = new FormData();
    formData.append('file', audioBlob, `audio.${format}`);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'json');
    formData.append('prompt', DOMAIN_PROMPT);
    if (body.language) formData.append('language', body.language);

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY!}` },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errText = await whisperResponse.text();
      console.error('Whisper API error:', errText);
      return jsonResponse({
        error: 'Transcription failed',
        status: whisperResponse.status,
        detail: errText,
      }, whisperResponse.status);
    }

    const whisperData = await whisperResponse.json();
    const text: string = whisperData.text || '';

    // 6. UPDATE rate-limit + log usage (best-effort)
    await supabase.from('user_rate_limits').upsert({
      user_id: user.id,
      service: 'whisper_api',
      request_count: requestCount + 1,
      window_start: windowStart.toISOString(),
      last_request_at: new Date().toISOString(),
    }, { onConflict: 'user_id,service' });

    // Audio bytes / 16000 bytes per sec (rough m4a estimate) — approximate duration logging only
    const approxDurationSec = audioBytes.length / 16000;
    await supabase.from('api_usage_logs').insert({
      user_id: user.id,
      service: 'whisper_api',
      model: 'whisper-1',
      input_tokens: 0,
      output_tokens: 0,
      cost_estimate: (approxDurationSec / 60) * 0.006,
      metadata: { format, transcript_chars: text.length, approx_duration_sec: Math.round(approxDurationSec) },
    });

    return jsonResponse({ text }, 200);

  } catch (error) {
    console.error('whisper-transcribe error:', error);
    return jsonResponse({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

function jsonResponse(data: any, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function mimeForFormat(format: string): string {
  switch (format) {
    case 'mp3': return 'audio/mpeg';
    case 'wav': return 'audio/wav';
    case 'webm': return 'audio/webm';
    case 'ogg': return 'audio/ogg';
    case 'mp4':
    case 'm4a':
    default: return 'audio/mp4';
  }
}
