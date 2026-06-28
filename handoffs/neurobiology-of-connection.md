# Handoff: Neurobiology of Connection — article, RAG ingest, autonomics rename

**Date:** 2026-06-22
**Branch:** `feat/neurobiology-of-connection` (NOT merged to master; not pushed)
**Resume line:** `Read handoffs/neurobiology-of-connection.md and continue.`

---

## What was done

### 1. New Learn article (committed `cac5cfb`)
- `neurobiology_of_connection` added to `content/education.js`, in the `body_and_brain`
  category, wired into `components/ConversationalEducation.js` (icon `compassion`, topics
  array, `topicDetails`, render card). Ships with a `tryThis` companion practice.
- Classic Porges/Dana spine + Hearth flip-chart metaphors. Deliberately does NOT duplicate
  existing `nervous_system_safety` / `mind_brain_relationships` articles.
- Also fixed 2 RAG category typos in `lib/huxleyModeConfigs.js`: `'consciousness'` →
  `consciousness-neuroscience`, `'attachment'` → `attachment-theory` (had matched 0 docs).

### 2. Source pipeline — book ingested + category rename (committed `319c292`)
The book **"The Neurobiology of Connection"** (Natureza Gabriel / Hearth Science, 2025) was in
`source-materials/` but never chunked. Now ingested. Also renamed RAG category
`polyvagal` → `autonomics`.

- **Tracked code (committed):** `scripts/chunk_documents.py` (mapping), `lib/huxleyModeConfigs.js`
  (6 filters), `lib/nervousSystemMappingAIService.js`, `lib/polyvagalAIService.js`,
  `lib/triggersGlimmersAIService.js` (ragService filters). Exercise-tag `'polyvagal'` in
  `therapeuticIntegrationService`/`contributedExerciseService`/`intentionGuidanceService` left
  intact (different vocabulary, not a KB category).
- **Out-of-tree (knowledge-base/ is gitignored — done but uncommittable):**
  folder `source-materials/polyvagal/` → `autonomics/`; book PDF moved there; cleaned text at
  `source-materials/extracted-text/Neurobiology of Connection.txt` (~130k words, OCR garble +
  `NNN/1000]` tail stripped, `[CATEGORY: autonomics]` header); chunked = 244 chunks; ingested.
  `knowledge-base/rag/KNOWLEDGE-BASE.md` manifest updated.
- **Supabase DB migrated:** `knowledge_documents` 57 docs now `autonomics` (0 `polyvagal`);
  `document_chunks` metadata.category 1664 → `autonomics` (0 stale). Book doc present, 244/244
  chunks. Verified retrievable via `python knowledge-base/rag/search.py "..." --category autonomics`.

### 3. Specs written (not built)
- `context/features/neurobiology-of-connection-exercise-inventory.md` — ~80 practices cataloged
  from the book (committed with `319c292`).
- `context/features/personal-connection-plan-exercise.md` — build-spec for a Deb Dana Personal
  Connection Plan interactive exercise (committed earlier).

---

## Current state / known issues

- **PENDING (USER action): IVFFlat REINDEX.** Run in the Supabase SQL editor so the 244 new
  chunks retrieve at full recall:
  ```sql
  SET maintenance_work_mem = '128MB';   -- default 32MB errored: "memory required 68MB"
  REINDEX INDEX idx_document_chunks_embedding;
  ```
  Until then the book is retrievable but ranks mid-list (e.g. "storycatchers" query). Index def
  is `lists = 150` in `supabase/migrations/20260225000001_rag_knowledge_base.sql` (still correct
  for ~23.5k rows).
- Branch `feat/neurobiology-of-connection` has 3 commits total, not pushed, not PR'd.
- Working tree has unrelated in-progress work (App.js, CravingTracker, philosophical
  talkthroughs, migrations, handoffs) — left untouched; NOT mine.
- A stale tracked `.pyc` (`scripts/__pycache__/chunk_documents.cpython-313.pyc`) updates on every
  py edit — left out of commits; could be `git rm --cached` + gitignored someday.

---

## What's next (options, not started)

1. **Run the REINDEX** (above) — finishes the pipeline.
2. **Build a feature from the book** — leading candidate is a "Portals to Connection"
   micro-practice library (browseable 1–3 min embodied cards). See the exercise inventory spec.
3. **Build the Personal Connection Plan** interactive exercise — see its spec (note: it's
   generic Deb Dana, not from this book).
4. **Merge / PR** `feat/neurobiology-of-connection` to master when ready.

---

## Where things live
- Article + wiring: `content/education.js`, `components/ConversationalEducation.js`
- RAG pipeline: `scripts/chunk_documents.py`, `scripts/ingest_to_supabase.py`,
  `knowledge-base/rag/` (search.py + manifest, gitignored)
- Mode RAG filters: `lib/huxleyModeConfigs.js`
- Specs: `context/features/neurobiology-of-connection-exercise-inventory.md`,
  `context/features/personal-connection-plan-exercise.md`
- Memory: `project_feature_neurobiology_of_connection.md` (update with the autonomics rename)
