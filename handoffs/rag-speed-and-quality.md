# RAG speed + retrieval-quality investigation (Huxley)

Status: **speed work (Task A) implemented AND DEPLOYED; scheduler + device re-measure
still pending.** Investigation complete (see `context/features/rag-perf-investigation.md`).
Quality tuning deferred. Owner: TBD. Separate thread; the IFS latency/intro work it came
from is settled.

## Session update (2026-07-06) — deployed state confirmed + warm-ping auth bug fixed

Probed the live function (`hxpyeudklnqtwspmdsuz`): the embed-cache + warm-ping code
is **already deployed** — `GET` with the anon key returns `{"ok":true,"warm":true}`.
The earlier "NOT yet deployed" was stale.

**Bug found & fixed:** the warm-ping was documented/wired as *credential-free*, but
Supabase's platform `verify_jwt` gateway 401s a no-Authorization request BEFORE our
handler runs (no header → `401 UNAUTHORIZED_NO_AUTH_HEADER`; anon key → `200 warm`).
The GitHub Actions workflow would have failed every run. Fixed to send the anon key
(apikey + bearer); it's a public client key so it lives in repo **variables**, not
secrets. Corrected: the workflow, the function comment, and WARM_PING_AND_CACHE.md.

**Still pending (needs the user / a machine with the Supabase CLI + device):**
- Set repo variables `EMBEDDINGS_FUNCTION_URL` + `SUPABASE_ANON_KEY`, then confirm the
  warm-ping workflow goes green (`workflow_dispatch` for a manual test run).
- Redeploy `embeddings` to pick up the comment/doc-only corrections (no behavior change).
- Device re-measure of `[Huxley PERF] rag=` on a multi-turn IFS session, THEN drop
  `RAG_TIMEOUT_MS` 2000→800.
- **Auth-hop removal remains deliberately NOT done** (higher risk, smaller win) — see below.

## Session update (2026-07-05) — Task A: safe speed wins IMPLEMENTED

Landed in `supabase/functions/embeddings/index.ts`:
- **Per-instance query-embedding cache** (`embedCache`, LRU-ish, max 500). Identical
  search queries skip the ~330ms OpenAI embedding call. `search` only; `embed`/`ingest`
  bypass. Server log line added: `[embeddings] search embed=…ms (cache HIT|MISS) rpc=…ms`.
- **Warm-ping endpoint** — `GET` or `x-warm-ping: 1` returns instantly BEFORE auth/OpenAI/DB.
  Pinging every ~5 min kills the cold-start spike (the 0.7–1.4s that blew the timeout on
  turn 1). **Needs a scheduler wired up** — see `supabase/functions/embeddings/WARM_PING_AND_CACHE.md`
  (recommend an external uptime pinger, Option A; pg_net not currently used in this project).

**Deliberately NOT done this session:**
- **Auth-hop removal** — dropping the `auth.getUser()` network round-trip needs a *new*
  local-JWT-verify path (the whole codebase, incl. claude-proxy, uses network `getUser()`;
  the search RPC runs via the service-role client which bypasses RLS, so `getUser` is the
  ONLY auth gate today — can't just delete it). Higher risk, smaller win than cache/ping.
  Left as an optional follow-up, not bundled into this perf diff.
- **`RAG_TIMEOUT_MS` drop 2000→800** — GATED on device re-measure. Dropping it before the
  warm-ping is live would make cold first-turns always time out. Sequence in the WARM_PING doc.

**Next:** deploy `embeddings`, wire the warm-ping scheduler, re-measure `[Huxley PERF] rag=`
on a multi-turn IFS session, THEN drop the timeout. Quality tuning (threshold nudge) is a
separate pass — and per the update below, the turn-1 zeros are largely EXPECTED, not a bug.

## Why this exists

Profiling the Huxley IFS chat showed each turn ≈ 6s, split roughly as **~1.5s RAG (in series, ahead of Claude) + ~4s Claude**. The prompt cache was verified working (`cache read=6936, created=0` on follow-up turns — not the problem). The two remaining levers are RAG speed and the volatile-tail size; this doc covers **RAG**.

Measured PERF lines (real 2-turn IFS session):
```
Turn 1:  rag=1470ms  claude=3903ms  total=5374ms | cache read=6936 created=0  in=308   | RAG 0 results
Turn 2:  rag=1553ms  claude=4820ms  total=6373ms | cache read=6936 created=0  in=1536  | RAG 1 result
```

Two distinct problems:
1. **Speed:** ~1.5s per turn, consistent (NOT cold-start).
2. **Quality:** turn 1 (opening message) returned **0 results**; turn 2 returned only **1** of a 3-result budget.

## What's already been done (don't redo)

- **Parallelized RAG** so it overlaps synchronous prompt assembly (`_startRagRetrieval` launched early in `chat()`, awaited at tail). Fully working — `rag ≈ build` every turn because build is pure RAG-wait.
- **Fixed a turn-1 bug:** the user message is now pushed to history *before* RAG runs, so RAG queries the CURRENT message (previously it saw the prior turn and skipped turn 1 entirely).
- **Added a safety-net timeout:** `RAG_TIMEOUT_MS = 2000` in `lib/huxleyService.js`. Set ABOVE the measured ~1.5s deliberately — it's a safety net for pathological slowness, NOT a kill switch. **When RAG speed is fixed, drop this to ~800ms.** On timeout, the turn proceeds with no RAG (empty string); the underlying fetch is not cancelled and may still warm the RAG cache. PERF log appends `(TIMED OUT, no RAG this turn)` when it fires.
- **Level-1 retrieval logging** in `lib/ragService.js` (`__DEV__` only): each search now logs the query, categories, threshold, and per-result `[score%] source / section — "snippet"`, plus an explainer line on 0 results. **Use this to diagnose quality — it shows exactly what Huxley is fed.**

## Key facts already established (from the schema migration `supabase/migrations/20260225000001_rag_knowledge_base.sql`)

- **IVFFlat index EXISTS** on the embedding column (`lists = 150`, `SET ivfflat.probes = 10`). So the pgvector search is NOT a full scan → **the 1.5s is almost certainly the OpenAI embedding HTTP call, not the DB query.** Focus speed work there.
- **Category filter is EXACT-match:** `kd.category = ANY(filter_categories)` (case-sensitive). IFS mode filters `categories: ['ifs']`. If IFS chunks are labeled anything else (`IFS`, `ifs-parts`, etc.), the filter silently returns nothing. **Prime suspect for low result count.** This codebase has prior history of RAG category typos matching 0 docs (`'consciousness'`/`'attachment'` fixed earlier in `huxleyModeConfigs.js`).
- **`ivfflat.probes = 10`** — low probes = faster but can miss relevant chunks in unprobed lists. A third candidate for low recall. Worth testing higher probes vs. latency.
- RPC returns: `content, section_title, chunk_type, page_numbers, token_count, similarity, source_document (= kd.filename), category`.

## The pipeline (files)

- `lib/huxleyService.js` — `_startRagRetrieval()` sets query/threshold/categories (`maxResults: 3, threshold: 0.4, categories: modeConfig.ragCategories`); `RAG_TIMEOUT_MS`.
- `lib/ragService.js` — client: fetch to edge fn, 5-min result cache, Level-1 logging, `formatForPromptInjection`.
- `supabase/functions/embeddings/index.ts` — `handleSearch`: `auth.getUser()` → `generateEmbedding()` (OpenAI `text-embedding-3-small`, 1536 dims) → `match_document_chunks` RPC.
- `supabase/migrations/20260225000001_rag_knowledge_base.sql` — tables, IVFFlat index, RPC.

## Task 1 — Speed (~1.5s → target <500ms)

Instrument each stage inside `handleSearch` (edge fn) with timing:
- (a) `supabase.auth.getUser(token)` — network round-trip; client already authenticated to call the function, so evaluate whether this hop can be trimmed/trusted.
- (b) OpenAI embedding call — **most likely dominant.** Options: keep the function warm (cron ping) to remove TLS/cold overhead; cache query embeddings (identical queries recur); evaluate a faster/local embedding path.
- (c) `match_document_chunks` RPC — should be fast given the index; confirm with timing.

Deliver a profiled breakdown of where the 1.5s goes before proposing fixes.

## IMPORTANT update — the "0 results" is largely EXPECTED, not a bug

A later real session (Level-1 logs) showed a clean pattern as the conversation moved from abstract to concrete:

```
"I'm struggling with my career"                         → 0 results
"I just don't want to do that job anymore..."           → 0 results
"...conflict. There some anger..."                      → 1 result  @ 44%
"The anger"                                             → 3 results @ 52/49/49%
```

The corpus matches **emotional / parts language** ("anger"), NOT **life-circumstance language** ("career", "job", "identity"). This is inherent: the knowledge base is *about* parts and emotions, and early trailhead-style openers are *about* life situations. So zero results on a vague/circumstantial opener is **correct behavior — there is genuinely no IFS knowledge to inject** for "I'm struggling with my career." When a relevant emotion query arrives, it clears the 0.4 threshold fine (44–52%).

**Do NOT chase turn-1 zero-results as a defect.** The remaining quality questions are narrower: (a) is 0.4 slightly too strict at the margin — the good "anger" hits are only 49–52%, not comfortably above cutoff, so a corpus/threshold nudge might help recall; (b) confirm `'ifs'` category labels match (still worth a one-time check); (c) `ivfflat.probes = 10` recall. Speed (Task 1) remains the bigger prize.

## Task 2 — Quality (why 0–1 results)

Diagnose with DATA, not guesses. Use the Level-1 logs + direct DB inspection:
- How many chunks in `document_chunks` are categorized exactly `'ifs'`? (`SELECT category, count(*) FROM knowledge_documents GROUP BY category` and join to chunks.) Confirm the label matches the filter.
- What similarity scores do representative IFS queries actually produce? Try a **vague opener** ("I feel stuck") vs a **concrete one** ("tightness in my chest, part that wants to hide") and read the scores. If real matches cluster at 0.3–0.4, the `threshold: 0.4` is too strict for `text-embedding-3-small` on this corpus.
- Is `ivfflat.probes = 10` hurting recall? Test higher probes.
- Is the corpus simply thin on IFS content?

## Testing ladder (build these as needed)

- **Level 1 (DONE):** log returned chunks + scores in `ragService.search`.
- **Level 2:** standalone query harness (script or dev screen) — type an arbitrary query, see ranked results + scores, WITHOUT running a chat session. This is the right tool for diagnosing 0-results and sweeping the threshold (0.3 / 0.4 / 0.5).
- **Level 3:** golden-set eval — ~15–20 representative IFS queries paired with expected chunks; measure hit rate and rank of the relevant chunk. The real "is the corpus any good" test; repeatable.
- **Level 4:** corpus inspection — chunks per category, source documents, label correctness.

## Constraints

- RAG is **best-effort grounding** — mode prompts are self-contained. Do NOT make it a hard dependency.
- Preserve graceful degradation: failures/timeouts → empty context, never a thrown error.
- Keep `[Huxley PERF]` and `[RAG]` dev logs working.
- Do NOT touch crisis-detection, cache-prefix, or IFS intro logic — settled.

## Deliverable

Profiled breakdown of the 1.5s + data-backed diagnosis of the low result count + specific recommended changes, split into "safe speed wins" and "quality tuning needing clinical judgment." When speed is fixed, lower `RAG_TIMEOUT_MS` to ~800ms.
