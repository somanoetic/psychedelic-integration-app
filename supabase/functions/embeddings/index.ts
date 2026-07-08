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

    if (!isServiceRole) {
      // Normal user auth via JWT
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return jsonResponse({ error: 'Invalid or expired token' }, 401);
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
        return await handleSearch(supabase, body as SearchRequest);
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
async function handleSearch(supabase: any, body: SearchRequest) {
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

  // Server-side stage timing — read in the function logs to confirm the embed
  // cache is landing (embedMs ≈ 0 on hit) and where the remaining time goes.
  console.log(
    `[embeddings] search embed=${embedMs}ms (cache ${embedCacheHit ? 'HIT' : 'MISS'}) ` +
    `rpc=${Date.now() - rpcStart}ms results=${data?.length || 0}`
  );

  return jsonResponse({
    results: data || [],
    query: body.query,
    match_count: data?.length || 0,
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

function jsonResponse(data: any, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
