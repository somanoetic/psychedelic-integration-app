-- RAG diagnosis: what similarity scores do IFS queries ACTUALLY produce?
-- The corpus is healthy (2,256 'ifs' chunks). Turns return 0 results, so the
-- queries aren't clearing threshold 0.4. This shows the TOP scores with NO
-- threshold, so we can see where relevant content lands and pick a real cutoff.
--
-- NOTE: this needs a query embedding. You can't easily paste a 1536-dim vector
-- by hand, so this uses an EXISTING chunk's embedding as a stand-in "query" —
-- pick a chunk whose text is somatic/parts-like (mirrors "pressure in my chest").
-- It answers: "for a query that IS on-topic, how high do the best matches score,
-- and does the top-N clear 0.4?"

-- 1. Find a good somatic/parts seed chunk to use as the query vector.
--    Eyeball the content; note the id of one that reads like a felt-sense line.
SELECT dc.id, kd.category, left(dc.content, 120) AS preview
FROM document_chunks dc
JOIN knowledge_documents kd ON kd.id = dc.document_id
WHERE kd.category = 'ifs'
  AND dc.embedding IS NOT NULL
  AND (dc.content ILIKE '%chest%' OR dc.content ILIKE '%body%'
       OR dc.content ILIKE '%feel%' OR dc.content ILIKE '%sensation%')
LIMIT 10;

-- 2. Using that seed's embedding as the query, show the top 15 IFS matches with
--    their similarity — NO threshold filter. Replace <SEED_ID> with an id above.
--    This reveals the real score distribution: if the best on-topic matches sit
--    at 0.30-0.45, then threshold 0.4 is throwing away good content.
WITH q AS (
  SELECT embedding FROM document_chunks WHERE id = '<SEED_ID>'
)
SELECT
  round((1 - (dc.embedding <=> q.embedding))::numeric, 3) AS similarity,
  kd.category,
  left(dc.content, 90) AS preview
FROM document_chunks dc
JOIN knowledge_documents kd ON kd.id = dc.document_id
CROSS JOIN q
WHERE dc.embedding IS NOT NULL
  AND kd.category = 'ifs'
ORDER BY dc.embedding <=> q.embedding
LIMIT 15;
