/**
 * Embeddings Edge Function - RAG Knowledge Base
 *
 * Three actions in one function (follows claude-proxy pattern):
 * - search: embed query → cosine similarity search via match_document_chunks()
 * - embed: generate embeddings for a text array (utility)
 * - ingest: generate embeddings + store chunks atomically (bulk pipeline)
 *
 * Auth: Supabase JWT (same as claude-proxy)
 * OpenAI key stored as Supabase secret: OPENAI_API_KEY
 *
 * Prerequisites:
 *   supabase secrets set OPENAI_API_KEY=sk-...
 *   supabase functions deploy embeddings
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
// Project (legacy) JWT secret — this project signs access tokens with HS256
// (verified: the anon key's JWT header is {alg:'HS256'}; Dashboard → Settings →
// JWT Keys still shows "using the legacy JWT secret"). When present, we verify
// the user's token locally (HMAC, sub-ms) instead of the ~1s auth.getUser()
// network hop. Falls back to getUser() if unset, so auth never silently weakens.
//
// NOTE the env name is NOT prefixed SUPABASE_ — the Supabase CLI refuses to set
// secrets starting with SUPABASE_ (reserved for platform-injected vars). Set via:
//   npx supabase secrets set RAG_JWT_SECRET=<legacy JWT secret>
// See the auth block below and handoffs/rag-speed-and-quality.md.
const RAG_JWT_SECRET = Deno.env.get('RAG_JWT_SECRET');

const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

// ---------------------------------------------------------------------------
// Query-embedding cache (per warm instance)
//
// text-embedding-3-small is deterministic for identical input, and RAG search
// queries repeat heavily — short openers ("The anger", greetings) and identical
// follow-ups recur across turns and across users. Caching the query→vector
// mapping in-memory removes the ~330ms OpenAI round-trip on a hit, which is the
// dominant warm-path cost of a search (pgvector itself is ~50-90ms).
//
// Scope: this Map lives only as long as the warm function instance. It is NOT a
// correctness cache (the search RPC re-runs every time); a cold start just
// repopulates it. Only SEARCH queries are cached — ingest/embed utility calls
// bypass it, since those are unique bulk content, not recurring queries.
//
// Bounded LRU-ish: on overflow we drop the oldest insertion (Map preserves
// insertion order). MAX kept modest — query diversity is low and each 1536-float
// vector is ~6KB, so 500 entries ≈ 3MB, comfortably within the function's memory.
const EMBED_CACHE_MAX = 500;
const embedCache = new Map<string, number[]>();

function embedCacheGet(text: string): number[] | undefined {
  const hit = embedCache.get(text);
  if (hit) {
    // Refresh recency: re-insert so it moves to the newest position.
    embedCache.delete(text);
    embedCache.set(text, hit);
  }
  return hit;
}

function embedCacheSet(text: string, vec: number[]): void {
  if (embedCache.size >= EMBED_CACHE_MAX) {
    // Evict oldest (first key in insertion order).
    const oldest = embedCache.keys().next().value;
    if (oldest !== undefined) embedCache.delete(oldest);
  }
  embedCache.set(text, vec);
}

interface SearchRequest {
  action: 'search';
  query: string;
  match_count?: number;
  match_threshold?: number;
  categories?: string[] | null;
}

interface EmbedRequest {
  action: 'embed';
  texts: string[];
}

interface IngestRequest {
  action: 'ingest';
  document_id: string;
  chunks: Array<{
    content: string;
    chunk_index: number;
    section_title?: string;
    chunk_type?: string;
    page_numbers?: number[];
    token_count?: number;
    metadata?: Record<string, unknown>;
  }>;
}

type RequestBody = SearchRequest | EmbedRequest | IngestRequest;

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
    // Warm-ping: a scheduled no-op that keeps at least one instance hot so real
    // searches don't pay the 0.7-1.4s cold-start spike (which was blowing the
    // RAG timeout on the first turn of a session). Handled as the FIRST thing in
    // the handler — before secrets/OpenAI/DB — so the ping is cheap: it touches
    // no secrets, no OpenAI, no DB, and skips our own getUser() auth hop below.
    //
    // NOTE: this does NOT mean the ping is credential-free. Supabase's platform
    // gateway enforces verify_jwt on this function and rejects a request with no
    // Authorization header with a 401 BEFORE our code ever runs. The pinger must
    // still send the project ANON key (a public client key) as apikey + bearer;
    // it just doesn't need a real user session. See the warm-ping workflow.
    if (req.method === 'GET' || req.headers.get('x-warm-ping') === '1') {
      return jsonResponse({ ok: true, warm: true }, 200);
    }

    // Validate secrets
    if (!OPENAI_API_KEY) {
      return jsonResponse({ error: 'OPENAI_API_KEY not configured' }, 500);
    }

    // Authenticate: accept either user JWT or service role key
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Service role key = server-side pipeline (ingestion scripts)
    const isServiceRole = token === SUPABASE_SERVICE_ROLE_KEY;

    // Time the auth hop separately — for a normal user JWT this is a network
    // round-trip to Supabase Auth (getUser), which the perf investigation flags
    // as ~1s and the single biggest lever after the OpenAI embed call. We thread
    // authMs into handleSearch so the search response can report the full
    // auth/embed/rpc split back to the device (see handoffs/rag-speed-and-quality.md).
    let authMs = 0;
    let authPath = 'service-role';
    if (!isServiceRole) {
      const authStart = Date.now();
      if (RAG_JWT_SECRET) {
        // Fast path: verify the HS256 signature locally (<1ms), no network hop.
        const payload = await verifyJwtLocal(token, RAG_JWT_SECRET);
        authMs = Date.now() - authStart;
        authPath = 'local';
        if (!payload) {
          return jsonResponse({ error: 'Invalid or expired token' }, 401);
        }
      } else {
        // Fallback: no JWT secret configured — validate via Supabase Auth so we
        // never run UNAUTHENTICATED. Deploy-time misconfig degrades to the old
        // ~1s behavior, not to an open endpoint.
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        authMs = Date.now() - authStart;
        authPath = 'network';
        if (authError || !user) {
          return jsonResponse({ error: 'Invalid or expired token' }, 401);
        }
      }
    }

    // Parse request
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    const body: RequestBody = await req.json();

    if (!body.action) {
      return jsonResponse({ error: 'Missing action parameter' }, 400);
    }

    // Route to handler
    switch (body.action) {
      case 'search':
        return await handleSearch(supabase, body as SearchRequest, authMs, authPath);
      case 'embed':
        return await handleEmbed(body as EmbedRequest);
      case 'ingest':
        return await handleIngest(supabase, body as IngestRequest);
      default:
        return jsonResponse({ error: `Unknown action: ${body.action}` }, 400);
    }

  } catch (error) {
    console.error('Embeddings function error:', error);
    return jsonResponse({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * Search: embed query → cosine similarity search
 */
async function handleSearch(supabase: any, body: SearchRequest, authMs = 0, authPath = 'unknown') {
  if (!body.query) {
    return jsonResponse({ error: 'Missing query parameter' }, 400);
  }

  // Generate embedding for query — served from the per-instance cache when the
  // exact query text has been embedded before on this warm instance (see
  // embedCache). On a hit we skip the ~330ms OpenAI call entirely.
  const embedStart = Date.now();
  let queryEmbedding = embedCacheGet(body.query);
  const embedCacheHit = queryEmbedding !== undefined;
  if (!queryEmbedding) {
    queryEmbedding = await generateEmbedding(body.query);
    embedCacheSet(body.query, queryEmbedding);
  }
  const embedMs = Date.now() - embedStart;

  const rpcStart = Date.now();

  // Call match_document_chunks RPC
  const { data, error } = await supabase.rpc('match_document_chunks', {
    query_embedding: queryEmbedding,
    match_count: body.match_count || 5,
    match_threshold: body.match_threshold || 0.3,
    filter_categories: body.categories || null,
  });

  if (error) {
    console.error('Search RPC error:', error);
    return jsonResponse({ error: 'Search failed', details: error.message }, 500);
  }

  const rpcMs = Date.now() - rpcStart;

  // Server-side stage timing — read in the function logs to confirm the embed
  // cache is landing (embedMs ≈ 0 on hit) and where the remaining time goes.
  console.log(
    `[embeddings] search auth=${authMs}ms(${authPath}) embed=${embedMs}ms (cache ${embedCacheHit ? 'HIT' : 'MISS'}) ` +
    `rpc=${rpcMs}ms results=${data?.length || 0}`
  );

  return jsonResponse({
    results: data || [],
    query: body.query,
    match_count: data?.length || 0,
    // Per-stage server timing, so a device turn can see the real split directly
    // (Supabase edge logs aren't easily readable from a device). authMs is the
    // token-validation hop (authPath: 'local' HMAC verify, 'network' getUser
    // fallback, or 'service-role'); embedMs is the OpenAI embedding call (0 on
    // cache hit); rpcMs is the pgvector search. See handoffs/rag-speed-and-quality.md.
    timing: { authMs, authPath, embedMs, embedCacheHit, rpcMs },
  }, 200);
}

/**
 * Embed: generate embeddings for a text array
 */
async function handleEmbed(body: EmbedRequest) {
  if (!body.texts || !Array.isArray(body.texts) || body.texts.length === 0) {
    return jsonResponse({ error: 'Missing or empty texts array' }, 400);
  }

  if (body.texts.length > 100) {
    return jsonResponse({ error: 'Maximum 100 texts per request' }, 400);
  }

  const embeddings = await generateEmbeddings(body.texts);

  return jsonResponse({
    embeddings,
    model: EMBEDDING_MODEL,
    dimensions: EMBEDDING_DIMENSIONS,
    count: embeddings.length,
  }, 200);
}

/**
 * Ingest: generate embeddings + store chunks atomically
 */
async function handleIngest(supabase: any, body: IngestRequest) {
  if (!body.document_id) {
    return jsonResponse({ error: 'Missing document_id' }, 400);
  }
  if (!body.chunks || !Array.isArray(body.chunks) || body.chunks.length === 0) {
    return jsonResponse({ error: 'Missing or empty chunks array' }, 400);
  }
  if (body.chunks.length > 50) {
    return jsonResponse({ error: 'Maximum 50 chunks per ingest request' }, 400);
  }

  // Generate embeddings for all chunk contents
  const texts = body.chunks.map(c => c.content);
  const embeddings = await generateEmbeddings(texts);

  // Build rows for insertion
  const rows = body.chunks.map((chunk, i) => ({
    document_id: body.document_id,
    chunk_index: chunk.chunk_index,
    content: chunk.content,
    section_title: chunk.section_title || '',
    chunk_type: chunk.chunk_type || 'text',
    page_numbers: chunk.page_numbers || [],
    token_count: chunk.token_count || 0,
    embedding: embeddings[i],
    metadata: chunk.metadata || {},
  }));

  // Insert into document_chunks
  const { error } = await supabase
    .from('document_chunks')
    .insert(rows);

  if (error) {
    console.error('Ingest insert error:', error);
    return jsonResponse({ error: 'Ingest failed', details: error.message }, 500);
  }

  // Update total_chunks count on the document
  await supabase
    .from('knowledge_documents')
    .update({
      total_chunks: supabase.rpc ? undefined : body.chunks.length,
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.document_id);

  return jsonResponse({
    ingested: body.chunks.length,
    document_id: body.document_id,
  }, 200);
}

/**
 * Generate a single embedding via OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const embeddings = await generateEmbeddings([text]);
  return embeddings[0];
}

/**
 * Generate embeddings for multiple texts via OpenAI batch API
 */
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', errorText);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();

  // Sort by index to maintain order
  const sorted = data.data.sort((a: any, b: any) => a.index - b.index);
  return sorted.map((item: any) => item.embedding);
}

// ---------------------------------------------------------------------------
// Local JWT verification (HS256)
//
// The search RPC runs on the service-role client (bypasses RLS), so token
// validation is the ONLY auth gate. We previously validated via a network call
// to Supabase Auth (auth.getUser), ~1s on the RAG critical path. This project
// signs access tokens with HS256 (the anon key JWT header is {alg:'HS256'}), so
// we can verify the signature locally with the project JWT secret in <1ms and
// skip the round-trip.
//
// Tradeoff vs getUser(): local verify trusts the token until it EXPIRES — a user
// signed out / disabled server-side still passes until `exp` (Supabase access
// tokens are short-lived, ~1h). For a read-only search over published clinical
// corpus (no user data returned), that stale-token window is an acceptable risk.
// If real-time revocation ever matters here, revert to getUser().
//
// Returns the decoded payload on success, or null on any failure (bad alg,
// signature mismatch, expired, wrong role) — caller treats null as 401. Uses
// only Web Crypto + atob; no external dependency.
function b64urlToBytes(s: string): Uint8Array {
  // JWT uses base64url without padding; convert to standard base64 for atob.
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function verifyJwtLocal(token: string, secret: string): Promise<Record<string, any> | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;

    // Only HS256 is accepted — reject anything else (incl. 'none') to avoid
    // algorithm-confusion attacks.
    const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(headerB64)));
    if (header.alg !== 'HS256') return null;

    // Verify HMAC-SHA256 over `header.payload` with the project JWT secret.
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      b64urlToBytes(sigB64),
      new TextEncoder().encode(`${headerB64}.${payloadB64}`),
    );
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(payloadB64)));

    // Expiry (required). exp is seconds since epoch.
    if (typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) return null;

    // Must be a signed-in user, not the anon role. getUser() implicitly rejected
    // anon tokens (no user); mirror that here.
    if (payload.role !== 'authenticated' || !payload.sub) return null;

    return payload;
  } catch {
    return null;
  }
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
