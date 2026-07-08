-- RAG diagnosis: why do cats=[ifs] searches return 0 results + run slow?
-- Run in Supabase Dashboard → SQL Editor. Read-only (SELECTs only).

-- 1. What categories actually exist, and how many chunks each? The app filters
--    cats=['ifs'] (exact, case-sensitive). If there's no exactly-'ifs' category
--    (e.g. it's 'IFS', 'ifs-parts', 'internal_family_systems'), the filter matches
--    ZERO rows and every IFS search returns 0 — which is ALSO the slowest path.
SELECT kd.category, count(*) AS chunks, count(DISTINCT kd.id) AS docs
FROM document_chunks dc
JOIN knowledge_documents kd ON kd.id = dc.document_id
WHERE dc.embedding IS NOT NULL
GROUP BY kd.category
ORDER BY chunks DESC;

-- 2. Is there ANY 'ifs' chunk at all (exact match)?
SELECT count(*) AS exact_ifs_chunks
FROM document_chunks dc
JOIN knowledge_documents kd ON kd.id = dc.document_id
WHERE kd.category = 'ifs' AND dc.embedding IS NOT NULL;

-- 3. Case-insensitive / fuzzy check — catches label drift like 'IFS' or 'ifs-parts'.
SELECT DISTINCT kd.category
FROM knowledge_documents kd
WHERE lower(kd.category) LIKE '%ifs%'
   OR lower(kd.title)    LIKE '%internal family%';
