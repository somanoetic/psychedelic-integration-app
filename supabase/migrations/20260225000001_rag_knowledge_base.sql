-- Migration: RAG Knowledge Base Infrastructure
-- Created: 2026-02-25
-- Purpose: Vector search for therapeutic knowledge base (276 PDFs + 27 protocols)
-- Decision: ADR context/decisions/2026-02-25-rag-knowledge-base.md

-- =====================================================
-- EXTENSION: pgvector for vector similarity search
-- =====================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- TABLE: knowledge_documents
-- Master catalog of all ingested documents
-- =====================================================

CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  title TEXT,
  total_chunks INTEGER NOT NULL DEFAULT 0,
  source_type TEXT NOT NULL CHECK (source_type IN ('pdf_extract', 'protocol_markdown')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for category-based filtering
CREATE INDEX idx_knowledge_documents_category ON knowledge_documents(category);
CREATE INDEX idx_knowledge_documents_source_type ON knowledge_documents(source_type);

-- =====================================================
-- TABLE: document_chunks
-- Text chunks with vector embeddings for similarity search
-- =====================================================

CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  section_title TEXT DEFAULT '',
  chunk_type TEXT NOT NULL DEFAULT 'text' CHECK (chunk_type IN ('text', 'protocol', 'exercise', 'reference')),
  page_numbers INTEGER[] DEFAULT '{}',
  token_count INTEGER NOT NULL DEFAULT 0,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- IVFFlat index for fast cosine similarity search (~14K vectors, 20 lists)
-- Rule of thumb: lists = sqrt(row_count). 20 lists suits datasets up to ~50K rows.
-- Note: REINDEX after full ingestion for optimal performance
CREATE INDEX idx_document_chunks_embedding ON document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 20);

-- Index for document lookups and category-scoped search
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_chunk_type ON document_chunks(chunk_type);

-- =====================================================
-- FUNCTION: match_document_chunks
-- Cosine similarity search with optional category filtering
-- =====================================================

CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(1536),
  match_count INTEGER DEFAULT 5,
  match_threshold FLOAT DEFAULT 0.3,
  filter_categories TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  section_title TEXT,
  chunk_type TEXT,
  page_numbers INTEGER[],
  token_count INTEGER,
  similarity FLOAT,
  source_document TEXT,
  category TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.section_title,
    dc.chunk_type,
    dc.page_numbers,
    dc.token_count,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    kd.filename AS source_document,
    kd.category
  FROM document_chunks dc
  JOIN knowledge_documents kd ON kd.id = dc.document_id
  WHERE
    dc.embedding IS NOT NULL
    AND (filter_categories IS NULL OR kd.category = ANY(filter_categories))
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- =====================================================
-- RLS: All authenticated users can read (reference content)
-- Only service role can write (ingestion pipeline)
-- =====================================================

ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Read access for all authenticated users
CREATE POLICY "Authenticated users can read knowledge documents"
  ON knowledge_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read document chunks"
  ON document_chunks FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- GRANTS
-- =====================================================

GRANT SELECT ON knowledge_documents TO authenticated;
GRANT SELECT ON document_chunks TO authenticated;
GRANT EXECUTE ON FUNCTION match_document_chunks TO authenticated;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE knowledge_documents IS 'Master catalog of therapeutic knowledge base documents (PDFs + protocols)';
COMMENT ON TABLE document_chunks IS 'Text chunks with vector embeddings for RAG similarity search';
COMMENT ON FUNCTION match_document_chunks IS 'Cosine similarity search over document chunks with optional category filtering';
