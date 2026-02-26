# ADR-007: RAG Knowledge Base with pgvector + OpenAI Embeddings

**Date:** 2026-02-25
**Status:** Accepted
**Deciders:** Project Lead + Claude AI

---

## Context

The app has a 1.5GB knowledge base (276 PDFs across 17 therapeutic categories) plus 27 protocol markdown files that aren't connected to the 9 AI services. Currently, `huxleyKnowledgeBase.js` does keyword-based scenario detection for 22 predefined situations. This limits AI responses to only those 22 scenarios.

**Problem:** AI services can't reference the vast majority of clinical knowledge in the corpus. Responses lack evidence grounding for topics outside the 22 hardcoded scenarios.

**Goal:** Enable all 9 AI services to retrieve relevant clinical knowledge from the full document corpus via semantic vector search (RAG), making responses evidence-grounded.

## Decision

Implement a RAG pipeline using:
- **Embeddings:** OpenAI `text-embedding-3-small` (1536 dimensions)
- **Vector store:** Supabase pgvector (IVFFlat index, 100 lists)
- **Edge function:** Supabase Edge Function for search/embed/ingest
- **Client service:** `ragService.js` singleton with 5-min cache
- **Integration:** Prompt injection into all 9 AI services

## Alternatives Considered

### 1. Expand huxleyKnowledgeBase keyword detection
- **Rejected:** Doesn't scale. Adding scenarios one-by-one can't cover 276 documents.

### 2. Client-side embedding (on-device)
- **Rejected:** React Native lacks efficient ONNX runtime. Model size (~30MB) impacts app download. Battery drain on mobile.

### 3. OpenAI embeddings + Pinecone/Weaviate
- **Rejected:** Adds external dependency. Supabase pgvector keeps everything in one stack. ~14K vectors is well within pgvector's comfort zone.

### 4. Anthropic embeddings (Voyage AI)
- **Rejected at time of decision:** OpenAI text-embedding-3-small is cheaper ($0.02/1M tokens), well-tested, and sufficient quality for our use case.

## Rationale

- **pgvector in Supabase:** Zero new infrastructure. Same auth, same billing, same deployment. Perfect for ~14K vectors.
- **OpenAI embeddings:** Best price/performance for small embedding model. $0.20 for entire corpus.
- **Edge function pattern:** Follows existing `claude-proxy` pattern. Keeps OpenAI key server-side.
- **5-min cache:** Matches masterContextService TTL. First message pays cold-start cost, subsequent messages are fast.
- **Graceful degradation:** If RAG fails, AI services continue without it. No user-facing errors.
- **Category filtering:** Domain services scope searches to relevant categories (e.g., IFS service only searches IFS corpus).

## Consequences

**Positive:**
- All 9 AI services now have access to full 276-document knowledge base
- Responses grounded in evidence-based therapeutic literature
- ~$0.20 one-time cost for full corpus embedding
- Minimal latency impact with caching

**Negative:**
- Adds OpenAI as second AI vendor (embedding only)
- Edge function cold starts (1-3s) on first search
- buildEnhancedPrompt becomes async (low risk, caller already async)
- IVFFlat index needs REINDEX after full ingestion

**Risks:**
- Some PDFs are scanned images (no text extractable) - logged for future OCR
- Token budget for RAG context (1500 tokens) may need tuning per service

## Implementation

- Migration: `supabase/migrations/20260225000001_rag_knowledge_base.sql`
- Edge function: `supabase/functions/embeddings/index.ts`
- Client service: `lib/ragService.js`
- Pipeline scripts: `scripts/extract_all_pdfs.py`, `scripts/chunk_documents.py`, `scripts/ingest_to_supabase.py`
- Tests: `__tests__/lib/ragService.test.js`
