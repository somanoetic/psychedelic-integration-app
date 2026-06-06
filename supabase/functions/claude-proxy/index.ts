/**
 * Claude API Proxy - Supabase Edge Function
 *
 * Securely proxies requests to Anthropic Claude API with:
 * - Authentication via Supabase JWT
 * - Rate limiting per user
 * - Request/response logging
 * - Cost tracking
 *
 * SECURITY: API key stored as Supabase secret, never exposed to client
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Rate limit: 100 requests per user per day
const RATE_LIMIT_PER_DAY = 100;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

// A message content can be either a plain string (text-only conversations) or
// an array of typed content blocks (text + image, used by the paper-scan
// vision flow). The proxy is content-agnostic — it spreads the request body to
// Claude as-is — so this widened type just documents what callers may send.
type CacheControl = { type: 'ephemeral' };

type ContentBlock =
  | { type: 'text'; text: string; cache_control?: CacheControl }
  | {
      type: 'image';
      source:
        | { type: 'base64'; media_type: string; data: string }
        | { type: 'url'; url: string };
    };

// `system` may be a plain string OR an array of text blocks. The array form lets
// callers attach `cache_control: {type:'ephemeral'}` to a stable prefix block so
// Anthropic caches it across turns. The proxy spreads the body through verbatim,
// so both forms reach Claude untouched.
type SystemPrompt = string | Array<{ type: 'text'; text: string; cache_control?: CacheControl }>;

interface ClaudeRequest {
  model: string;
  max_tokens: number;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string | ContentBlock[];
  }>;
  temperature?: number;
  system?: SystemPrompt;
  stream?: boolean;
}

serve(async (req: Request) => {
  // CORS preflight
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

  try {
    // 1. AUTHENTICATE USER
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return jsonResponse({ error: 'Invalid or expired token' }, 401);
    }

    // 2. CHECK RATE LIMIT
    const rateLimitKey = `rate_limit:${user.id}`;
    const { data: rateLimitData } = await supabase
      .from('user_rate_limits')
      .select('request_count, window_start')
      .eq('user_id', user.id)
      .eq('service', 'claude_api')
      .single();

    let requestCount = 0;
    let windowStart = new Date();

    if (rateLimitData) {
      const windowAge = Date.now() - new Date(rateLimitData.window_start).getTime();

      if (windowAge < RATE_LIMIT_WINDOW_MS) {
        // Within current window
        requestCount = rateLimitData.request_count;

        if (requestCount >= RATE_LIMIT_PER_DAY) {
          return jsonResponse({
            error: 'Rate limit exceeded',
            limit: RATE_LIMIT_PER_DAY,
            window_reset: new Date(new Date(rateLimitData.window_start).getTime() + RATE_LIMIT_WINDOW_MS).toISOString(),
          }, 429);
        }
      } else {
        // Start new window
        requestCount = 0;
        windowStart = new Date();
      }
    }

    // 3. VALIDATE REQUEST
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const requestBody: ClaudeRequest = await req.json();

    if (!requestBody.model || !requestBody.messages) {
      return jsonResponse({ error: 'Invalid request: missing model or messages' }, 400);
    }

    // Enforce token limits to prevent abuse. Ceiling is generous enough for
    // multi-field paper-scan interpretations (worksheet transcription + per-
    // field extraction + thematic notes) while still bounding cost per call.
    const maxTokens = Math.min(requestBody.max_tokens || 1024, 8192);

    // 4. CALL CLAUDE API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        ...requestBody,
        max_tokens: maxTokens,
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', errorText);
      return jsonResponse({
        error: 'Claude API request failed',
        status: claudeResponse.status,
      }, claudeResponse.status);
    }

    const claudeData = await claudeResponse.json();

    // 5. UPDATE RATE LIMIT
    await supabase
      .from('user_rate_limits')
      .upsert({
        user_id: user.id,
        service: 'claude_api',
        request_count: requestCount + 1,
        window_start: windowStart.toISOString(),
        last_request_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,service',
      });

    // 6. LOG REQUEST (for cost tracking)
    await supabase
      .from('api_usage_logs')
      .insert({
        user_id: user.id,
        service: 'claude_api',
        model: requestBody.model,
        input_tokens: claudeData.usage?.input_tokens || 0,
        output_tokens: claudeData.usage?.output_tokens || 0,
        cost_estimate: calculateCost(requestBody.model, claudeData.usage),
        metadata: {
          endpoint: 'messages',
          system_prompt_length: systemPromptLength(requestBody.system),
          // Prompt-cache accounting (present once cache_control breakpoints are
          // used). Lets us audit hit rate from api_usage_logs without a client.
          cache_read_input_tokens: claudeData.usage?.cache_read_input_tokens || 0,
          cache_creation_input_tokens: claudeData.usage?.cache_creation_input_tokens || 0,
        },
      });

    // 7. RETURN RESPONSE
    return jsonResponse({
      ...claudeData,
      _proxy_metadata: {
        rate_limit_remaining: RATE_LIMIT_PER_DAY - requestCount - 1,
        rate_limit_reset: new Date(windowStart.getTime() + RATE_LIMIT_WINDOW_MS).toISOString(),
      },
    }, 200);

  } catch (error) {
    console.error('Proxy error:', error);
    return jsonResponse({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Character length of the system prompt regardless of whether it arrived as a
// plain string or as cache_control-tagged text blocks. Used only for logging.
function systemPromptLength(system: SystemPrompt | undefined): number {
  if (!system) return 0;
  if (typeof system === 'string') return system.length;
  return system.reduce((sum, block) => sum + (block.text?.length || 0), 0);
}

function jsonResponse(data: any, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function calculateCost(model: string, usage: any): number {
  if (!usage) return 0;

  // Claude pricing (as of 2026)
  const pricing: Record<string, { input: number; output: number }> = {
    'claude-opus-4': { input: 0.015, output: 0.075 }, // per 1K tokens
    'claude-sonnet-4': { input: 0.003, output: 0.015 },
    'claude-sonnet-3.5': { input: 0.003, output: 0.015 },
    'claude-haiku-3.5': { input: 0.00025, output: 0.00125 },
  };

  const modelKey = Object.keys(pricing).find(key => model.includes(key));
  if (!modelKey) return 0;

  const { input, output } = pricing[modelKey];
  const inputCost = (usage.input_tokens / 1000) * input;
  const outputCost = (usage.output_tokens / 1000) * output;

  return inputCost + outputCost;
}
