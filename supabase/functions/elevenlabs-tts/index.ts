/**
 * ElevenLabs TTS Proxy - Supabase Edge Function
 *
 * Securely proxies text to ElevenLabs for warm, therapist-like voice synthesis.
 *
 * Request body (JSON):
 *   {
 *     text:      string,   // required, <= 5000 chars per request
 *     voice_id?: string,   // optional override; defaults to ELEVENLABS_VOICE_ID secret
 *     model_id?: string,   // optional; defaults to eleven_turbo_v2_5 (low latency)
 *   }
 *
 * Response (JSON):
 *   { audio_base64: string, mime: 'audio/mpeg' }
 *
 * SECURITY: ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID stored as Supabase secrets.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
const DEFAULT_VOICE_ID = Deno.env.get('ELEVENLABS_VOICE_ID');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const RATE_LIMIT_PER_DAY = 500;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_TEXT_CHARS = 5000;
// Flash v2.5 is roughly half the latency of Turbo v2.5 with slightly less
// expressive prosody. For Huxley's brief conversational responses (always
// under 300 chars), the quality difference is hard to hear, but the latency
// savings are very noticeable in real-time voice exchange.
// Switched from eleven_turbo_v2_5 on 2026-05-27.
const DEFAULT_MODEL_ID = 'eleven_flash_v2_5';

interface TtsRequest {
  text: string;
  voice_id?: string;
  model_id?: string;
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
      .eq('service', 'elevenlabs_tts')
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
    const body: TtsRequest = await req.json();
    if (!body.text || !body.text.trim()) {
      return jsonResponse({ error: 'Missing text' }, 400);
    }
    if (body.text.length > MAX_TEXT_CHARS) {
      return jsonResponse({ error: `Text too long (max ${MAX_TEXT_CHARS} chars)` }, 413);
    }

    const voiceId = body.voice_id || DEFAULT_VOICE_ID;
    if (!voiceId) {
      return jsonResponse({ error: 'No voice configured. Set ELEVENLABS_VOICE_ID secret.' }, 500);
    }
    const modelId = body.model_id || DEFAULT_MODEL_ID;

    // 4. CALL ELEVENLABS
    const ttsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY!,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: body.text,
          model_id: modelId,
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.75,
            style: 0.15,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!ttsResponse.ok) {
      const errText = await ttsResponse.text();
      console.error('ElevenLabs API error:', errText);
      return jsonResponse({
        error: 'TTS failed',
        status: ttsResponse.status,
        detail: errText,
      }, ttsResponse.status);
    }

    // 5. ENCODE audio -> base64
    const arrayBuffer = await ttsResponse.arrayBuffer();
    const audioBase64 = bytesToBase64(new Uint8Array(arrayBuffer));

    // 6. UPDATE rate-limit + log usage
    await supabase.from('user_rate_limits').upsert({
      user_id: user.id,
      service: 'elevenlabs_tts',
      request_count: requestCount + 1,
      window_start: windowStart.toISOString(),
      last_request_at: new Date().toISOString(),
    }, { onConflict: 'user_id,service' });

    await supabase.from('api_usage_logs').insert({
      user_id: user.id,
      service: 'elevenlabs_tts',
      model: modelId,
      input_tokens: 0,
      output_tokens: 0,
      cost_estimate: (body.text.length / 1000) * 0.30, // ~$0.30/1k chars on turbo
      metadata: {
        voice_id: voiceId,
        text_chars: body.text.length,
        audio_bytes: arrayBuffer.byteLength,
      },
    });

    return jsonResponse({
      audio_base64: audioBase64,
      mime: 'audio/mpeg',
    }, 200);

  } catch (error) {
    console.error('elevenlabs-tts error:', error);
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

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  // Chunk to avoid call-stack issues on large buffers
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK) as unknown as number[]);
  }
  return btoa(binary);
}
