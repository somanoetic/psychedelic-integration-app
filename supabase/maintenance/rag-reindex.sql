-- RAG IVFFlat reindex — run in Supabase Dashboard → SQL Editor after any bulk
-- knowledge-base ingest.
--
-- WHY THIS EXISTS
-- IVFFlat centroids are computed at index-build/REINDEX time from the rows that
-- exist THEN. Ingesting new documents does NOT update them, so the clustering
-- drifts from the real data distribution → the vector scan probes the wrong
-- lists, gets slower, and recall degrades.
--
-- HISTORY
-- - 2026-06-16 (BUG-317): index rebuilt at lists=150 on 21,648 chunks; probes=10.
--   Vector scan was fast then (~sub-100ms); latency was dominated by the OpenAI
--   embedding call.
-- - 2026-06-22: Neurobiology of Connection book ingested (+~1,800 chunks) with NO
--   post-ingest reindex. Centroids went stale.
-- - 2026-07-08: device logs showed rpc=700-1187ms (regressed). Re-ran this on
--   23,454 chunks. suggested_lists = round(sqrt(23454)) = 153 ≈ 150, so lists
--   sizing stayed correct — only the centroids needed rebuilding.
--
-- RULE: run this (or at minimum steps 1,3,4) after every bulk ingest. If step 2
-- shows suggested_lists drifting far from 150 (corpus grew a lot), also bump the
-- index's lists via DROP/CREATE (see BUG-317 resolution) and update the migration.

-- 1. Bigger memory for the index build. BUG-317 hit "memory required is 68 MB"
--    at the default 32MB. Session-scoped; resets when the editor tab closes.
SET maintenance_work_mem = '128MB';

-- 2. Row count + suggested lists (lists ≈ sqrt(rows)). 22K→150, 40K→200, 90K→300.
SELECT count(*) AS row_count,
       round(sqrt(count(*))) AS suggested_lists
FROM document_chunks
WHERE embedding IS NOT NULL;

-- 3. Rebuild the index on current data (recomputes centroids; keeps name/opts).
REINDEX INDEX idx_document_chunks_embedding;

-- 4. Refresh planner statistics so the planner costs the index correctly.
ANALYZE document_chunks;

-- 5. Sanity: confirm the index definition (expect lists=150).
SELECT indexname, indexdef
FROM pg_indexes
WHERE indexname = 'idx_document_chunks_embedding';
