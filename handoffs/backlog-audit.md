# Handoff — Backlog audit & RAG deployment verification

## Task
User suspected many "open" items in the trackers were already done. Audited every
open bug/feature against the actual code (trackers last updated mid-May, now
2026-06-16 and stale). Special focus landed on the RAG knowledge base, which the
tracker listed as "code complete, deploying this week" — it is actually fully
deployed and live.

## What was done
- Ran three parallel read-only audits across bugs + production-readiness + features.
- Verified RAG end-to-end against live Supabase (used service-role key from `.env`):
  - `knowledge_documents` = 281 rows, `document_chunks` = 21,648 rows, embeddings populated (1536-dim).
  - `embeddings` edge function `search` action returns 200 with semantically correct results.
  - `OPENAI_API_KEY` is a Supabase **secret** (works in prod); it is NOT in local `.env`.
- Updated trackers (see "Files touched").

## Audit verdicts (summary)
- **Already done, were marked open:** BUG-213 (Glimmer faces bundled locally), BUG-316
  (routing test already uses `MODELS.PRIMARY`), FEAT-405 (crisis safety — FindSupportScreen live).
- **Code complete, only external/ops/device work left:** BUG-307 (Sentry DSN — needs `.env` + prod
  verify), FEAT-401 (env separation — needs prod Supabase/keys/EAS secrets), RAG (deployed ✅),
  Voice (built but PAUSED — pivoted to narration-only).
- **Genuinely open:** BUG-309 (metrics materialized views never promoted from migrations-archive →
  migrations — only purely-codeable one), BUG-311 (no applicant emails / no Resend), BUG-308 (legal
  review pending + **policies still say "Huxley"/"Alleviation Therapeutics" post-Multitudes rebrand**),
  BUG-306 (iOS rebuild), FEAT-403 (Play Store assets), BUG-301 (perf monitoring).
- **New issue filed:** BUG-317 — RAG IVFFlat index under-tuned (`lists=20` for 21.6K vectors; target
  ~150; REINDEX-after-ingest unconfirmable from outside DB).

## Current state
- Branch: `master` (no commits made — only context/tracker `.md` edits, uncommitted).
- The RAG knowledge base is live and returning good results. The ONLY caveat is the index tuning.
- Voice tracker entry corrected to PAUSED to match the existing memory note.

## Files touched (all docs, uncommitted)
- `LOG.md` — added human entry (top).
- `context/features/in-progress.md` — RAG marked DEPLOYED + verification evidence + follow-ups;
  Voice entry corrected to PAUSED; date stamped.
- `context/bugs/medium-low.md` — BUG-213 + BUG-316 marked resolved; BUG-317 added; counts fixed.

## What's next (suggested, not started)
1. **BUG-317 (30s, your action):** in Supabase SQL editor, `DROP INDEX idx_document_chunks_embedding;`
   then recreate `WITH (lists = 150);` — rebuilds centroids on real data + right-sizes. Then update
   the `lists` value in `supabase/migrations/20260225000001_rag_knowledge_base.sql` so fresh deploys
   start correct.
2. **BUG-309** is the one clean codeable bug left — extract the two materialized views
   (`mv_service_performance_last_7d`, `mv_top_errors_last_24h`) from
   `supabase/migrations-archive/20260209000000_ai_monitoring_schema.sql` into a new forward migration.
3. **Multitudes branding fix** in `screens/PrivacyPolicyScreen.js` + `screens/TermsOfServiceScreen.js`
   (still say "Huxley"/"Alleviation Therapeutics") — worth doing regardless of formal legal review.
4. Optionally add `OPENAI_API_KEY` to local `.env` so `scripts/ingest_to_supabase.py` can re-run.

## Resume
Read handoffs/backlog-audit.md and continue.
