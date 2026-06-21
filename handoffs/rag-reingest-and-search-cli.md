# Handoff — RAG re-ingest (page citations + categorization) + standalone search CLI

## Task
User wanted the knowledge/content source files reorganized into a searchable,
portable format, and asked whether a RAG was useful. Discovered a complete RAG
already exists (ADR-007). Pivoted to: (1) make it queryable from chats / for
article drafting, (2) make it portable, (3) fix two data-quality issues via a
re-ingest.

## Status: DONE — verified end-to-end. Re-ingest complete, REINDEX done, search confirmed healthy.
Tracked code changes are in the working tree, **not committed** (user hasn't asked to commit).

## What was done

### Existing RAG (pre-existing, untouched at runtime)
- Supabase pgvector: tables `knowledge_documents` + `document_chunks`, RPC
  `match_document_chunks()` — see `supabase/migrations/20260225000001_rag_knowledge_base.sql`.
- Edge function `supabase/functions/embeddings/index.ts` (search/embed/ingest;
  accepts service-role key as Bearer → `isServiceRole` path).
- App client `lib/ragService.js` wires it into the 9 AI services. Not modified.

### Fix 1 — per-chunk page tracking (`scripts/chunk_documents.py`)
- Old bug: `split_into_sections()` accumulated `page_numbers` at the section
  level, so chunks cited the whole doc (e.g. `p.2–266`).
- New: `--- PAGE N ---` markers kept inline through sectioning, then
  `extract_and_strip_pages()` pulls per-chunk pages and strips markers.
- **Gotcha fixed:** `"--- PAGE 4 ---".isupper()` is True, so the ALL-CAPS
  header check was eating every page marker. Added a PAGE_MARKER_RE passthrough
  BEFORE that check. Result: median 1 page/chunk (was up to 249).

### Fix 2 — folder-based categorization (`scripts/chunk_documents.py`)
- Old bug: `detect_category_from_filename()` keyword-guessing dumped 41% of
  chunks into `miscellaneous`.
- New: `detect_category_from_folder()` derives category from the
  source-materials domain subfolder (exact-stem map, then fuzzy prefix match),
  keyword guesser only as last resort. `miscellaneous` → ~7%.
- **Companion fix (`scripts/ingest_to_supabase.py`):** `create_document()` used
  to leave an existing doc's `category` unchanged on conflict. Because
  `match_document_chunks` filters on `knowledge_documents.category` (JOIN, not
  the chunk's), stale doc categories silently broke `--category` search even
  after chunks re-ingested. Now PATCHes category/title/total_chunks on conflict.

### Re-ingest (live DB cutover)
- Deleted old 21,648 chunks per-document (bulk DELETE hit PostgREST statement
  timeout; batched per doc_id instead). Kept `knowledge_documents` records.
- Re-ran ingest: 23,210 chunks, 0 errors, 0 missing embeddings, ~$0.27, ~37 min.
- One-time category sync on existing doc records (they survived the chunk delete
  with stale categories) — PATCHed all 289 docs to match new jsonl categories.
- REINDEX via `npx supabase db query --linked "SET maintenance_work_mem='128MB';
  REINDEX INDEX idx_document_chunks_embedding;"` — needed the mem bump (68MB
  required vs 32MB default). **`--linked` runs SQL with no DB password.**

### "Mojibake" — investigated, dismissed (NOT a real issue)
- The `�` seen in terminal were correct Unicode (curly quotes, en/em dashes,
  bullets, ellipses) the Git Bash code page can't render. Scan = 0 U+FFFD across
  277 files. No re-extract needed.
- CLI now forces UTF-8 stdout; removed a `clean()` fn that was corrupting good
  text (replacing em-dashes/bullets with `'`).

### Portable search module (on disk, **gitignored** — `knowledge-base/` is in .gitignore by design)
- `knowledge-base/rag/search.py` — standalone CLI, calls the edge function with
  service-role key from `.env`. Flags: `--count --threshold --category --json`.
  Usage: `python knowledge-base/rag/search.py "window of tolerance"`.
- `knowledge-base/rag/KNOWLEDGE-BASE.md` — manifest: corpus stats (289 docs /
  23,210 chunks / 15 categories), how to query/re-ingest, portability guide
  (Model A shared-Supabase = current; B dedicated project; C sqlite-vec export),
  copyright/scope note, known-issues log.
- Pointer added to `knowledge-base/README.md`.

## Current state
- Branch: `master`. Tracked changes (uncommitted): `scripts/chunk_documents.py`,
  `scripts/ingest_to_supabase.py`. Plus pre-existing unrelated dirty files
  (`.claude/settings.json`, `LOG.md`, etc.).
- `knowledge-base/rag/*` and the regenerated `scripts/chunked_documents.jsonl`
  exist on disk but are gitignored.
- Live DB: 23,210 chunks, reindexed, search verified (good similarity, clean
  single-page citations, correct Unicode, `--category` works incl. jungian/mind-body).

## Known issues / watch-outs
- Nothing open on the knowledge base itself.
- `scripts/__pycache__/` is now present (untracked) — ignore or gitignore.
- The portable module is intentionally untracked (user chose "leave gitignored").
  To port: copy the `knowledge-base/rag/` folder by hand. No git history for it.
- If you ever re-extract PDFs: `extract_all_pdfs.py` uses PyPDF2; `pymupdf`/`fitz`
  is NOT installed but `pdfplumber` is, if better extraction is ever wanted
  (not currently needed).

## What's next (optional, user not committed to any)
- Commit the two tracked script fixes if desired (no commit requested yet).
- User was offered `/log` (declined in favor of `/wrap`).
- Future: Model C (sqlite-vec offline export) — ~30-line script, build on demand.

## Resume
Read handoffs/rag-reingest-and-search-cli.md and continue.
