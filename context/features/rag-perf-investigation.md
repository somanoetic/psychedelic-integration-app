# RAG Performance + Retrieval-Quality Investigation (Huxley IFS chat)

**Date:** 2026-07-03
**Scope:** `lib/ragService.js`, `supabase/functions/embeddings/index.ts`, `match_document_chunks` RPC, `lib/huxleyService.js` `_startRagRetrieval`, `lib/huxleyModeConfigs.js` `ragCategories`.
**Method:** Live queries against the production Supabase (`hxpyeudklnqtwspmdsuz`) using the service-role key — real category counts, real chunk counts, real similarity scores, and isolated timing of each pipeline stage. Findings below are measured, not inferred.

---

## TL;DR

1. **The pgvector query is NOT the bottleneck.** Pure `match_document_chunks` RPC runs **54–89ms warm**. The IVFFlat index is present and working (a full scan of 23,454 vectors would be far slower and wouldn't stay flat as `match_count` scales 3→50). The ~1.5s the user measured is **the OpenAI embedding HTTP call + edge-function invocation/network overhead**, not the search.
2. **The 0–1 result count is a threshold problem, not a category typo.** `'ifs'` is a real, correctly-populated slug (67 docs / 2,256 chunks). But real IFS-query similarities top out at **0.44–0.50**, and the live threshold is **0.4** — so 2 of a 3-budget get cut, and short openers ("Hi", "I don't know where to start") return **0** because nothing clears 0.4. This is expected behavior for `text-embedding-3-small` on this corpus, not a bug.

---

## Part 1 — Speed: where the ~1.5s goes

Measured, warm, back-to-back (ms), each stage isolated:

| Stage | What it isolates | Warm latency | First-call (cold) |
|---|---|---|---|
| `embed` action only | OpenAI embedding HTTP + fn invoke + `getUser` auth | **314–355ms** | 639ms |
| `search` action (full) | embed + `getUser` + pgvector RPC | **313–430ms** | 674–1139ms |
| `match_document_chunks` RPC direct (PostgREST) | **pure pgvector**, no OpenAI in path | **54–89ms** | 1348ms |

**Interpretation:**
- **OpenAI embedding call dominates**: ~300–350ms of the warm path is the embedding round-trip. Everything else (auth `getUser`, pgvector) is small on top of it.
- **pgvector is ~30–80ms** — subtract `search` (≈360ms) minus `embed` (≈330ms) ≈ 30ms marginal; direct RPC confirms 54–89ms. The index is fine.
- **The variance/cold-start is real**: first-call-after-idle spikes to 0.7–1.4s repeatedly across every stage (edge function cold start + PostgREST connection warmup). The user's "consistent ~1.5s from the device" is almost certainly **warm-path embedding (~350ms) + real mobile→edge network RTT + occasional cold starts**, i.e. the network/invocation envelope around a fast query — not a slow search.

**Conclusion:** To hit <500ms and safely drop `RAG_TIMEOUT_MS` to ~800ms, target the **embedding call and cold starts**, not the SQL.

### Safe speed wins (no clinical judgment needed)

1. **Cache query embeddings in the edge function (biggest win).** `text-embedding-3-small` on identical text is deterministic; opener/short messages repeat across users and turns. An in-memory LRU (per warm instance) or a `query_embeddings(text_hash → vector)` table keyed on a hash of the normalized query removes the ~330ms OpenAI call on cache hits. `ragService` already caches *results* client-side (5-min TTL), but that cache is per-device and misses cross-user/cold-launch. Server-side embedding cache is the highest-leverage change.
2. **Trust the already-authenticated client — drop `supabase.auth.getUser(token)` on the hot path.** The client only calls the edge function *after* `supabase.auth.getSession()` succeeded (`ragService.js:54`). The edge function then does a **second** network `getUser(token)` round-trip (`index.ts:89`) purely to re-validate a JWT we just minted. For best-effort, read-only grounding against a corpus that's already world-readable to any authenticated user (RLS `USING (true)`), this round-trip is pure latency. Options, cheapest-first: (a) **verify the JWT locally** (decode + check `exp` + signature against the project JWT secret) instead of the network call; (b) accept the JWT's presence and let RLS enforce access. This shaves a network hop off *every* search. (Keep the service-role bypass for ingestion.)
3. **Keep the function warm.** Cold starts are the 0.7–1.4s outliers. A lightweight cron ping (every ~5 min) to an OPTIONS/no-op keeps at least one instance hot and collapses the tail. Low effort, removes the worst-case spikes that force the timeout to stay high.
4. **Lower `SET ivfflat.probes` if you want — but don't bother.** Probes=10 already yields 54–89ms. Not worth touching; recall matters more here than the ~20ms it might save.

With (1)+(2)+(3), warm search drops toward ~60–150ms (pgvector + local auth, embedding cached), and cold starts stop happening mid-session. **Dropping `RAG_TIMEOUT_MS` to 800ms becomes safe** — with graceful degradation still intact, the rare cold miss just yields empty context for that one turn (already the current, correct behavior).

---

## Part 2 — Retrieval quality: why 0–1 results

### Category data is healthy — `['ifs']` is correct

Live `knowledge_documents` (290 docs) and per-category chunk counts:

| category | docs | chunks |
|---|---|---|
| ifs | 67 | **2,256** |
| autonomics | 57 | 1,664 |
| spirituality | 28 | 5,510 |
| cbt-act | 26 | 1,342 |
| **scenarios** | 22 | — (protocol md) |
| jungian | 21 | 661 |
| habits | 13 | 1,262 |
| miscellaneous | 13 | 1,544 |
| trauma-informed | 7 | 1,677 |
| attachment-theory | 6 | 1,337 |
| consciousness-neuroscience | 6 | 2,655 |
| **general** | 5 | — |
| beliefs | 4 | 185 |
| ipnb | 4 | 986 |
| mind-body | 4 | 653 |
| somatic | 4 | 1,152 |
| psychedelic-integration | 2 | 394 |
| harm-reduction | 1 | 53 |

Total: **23,454 chunks, 0 with NULL embedding.** `'ifs'` has a healthy 2,256 chunks. **The IFS category filter is not the problem** — unlike the prior 'consciousness'/'attachment' typos ([[project_feature_neurobiology_of_connection]]), `['ifs']` matches the ingested slug exactly.

### The threshold is too strict — this is the real cause

Real IFS-only similarities (threshold 0.0, top-8) for representative session openers:

| Query | IFS-only top sims | # ≥ 0.4 (current threshold) |
|---|---|---|
| "a part of me wants to run away" | 0.448, 0.430, 0.421, 0.412, 0.381… | 4 |
| "a part of me that's really angry" | 0.501, 0.452, 0.425, 0.408, 0.392… | 4 |
| "I feel numb and shut down inside" | 0.417, 0.394, 0.392, 0.391… | **1** |
| "I don't know where to start" | (nothing above ~0.35) | **0** |
| "Hi" | (nothing above ~0.33) | **0** |

**This exactly reproduces the reported symptom:** turn-1 openers ("I don't know where to start"-style) → 0 results; a substantive part-laden message → 1–4 results, of which the 0.4 cut often leaves just 1. `text-embedding-3-small` on this corpus simply produces cosine similarities in the **0.35–0.50** band for good matches — 0.4 sits right in the meat of the distribution and discards genuinely relevant chunks.

Two contributing factors:
- **Short/opening messages have no semantic content to match** ("Hi", "I don't know where to start"). No threshold fixes these — there's nothing clinical to ground. That's fine; the mode prompt is self-contained.
- **For substantive messages, 0.4 is ~0.05–0.10 too high** for this embedding model + corpus.

### Notable side-findings

- **Cross-category leakage into `general`/`scenarios`/`miscellaneous`:** with no category filter, top hits for IFS queries were often `[general]` and `[scenarios]` (e.g. 0.476 `general` beating the best `ifs` 0.448). The `general` (5 docs) and `scenarios` (22 docs) categories exist in the DB but are **not in `DIR_TO_CATEGORY`** (they came from protocol-markdown ingestion) and **no mode's `ragCategories` targets them** — so this content is unreachable by any scoped search. Worth a look separately: some of it out-scores the IFS corpus for IFS queries.
- **`somatic`: 4 docs → 1,152 chunks** (and `consciousness-neuroscience`: 6 → 2,655) — a handful of very large documents dominate those categories. Not a bug, but relevant if you later tune per-category budgets.

### Quality tuning (needs your clinical judgment)

These change *what content grounds the AI*, so they're yours to weigh — recommendations with tradeoffs:

1. **Lower the IFS threshold from 0.4 → ~0.32–0.35.** Evidence: real relevant chunks cluster at 0.38–0.50; 0.4 discards most of them. 0.33 would turn the "numb/shut down" case from 1→4 results and recover the mid-band matches. **Tradeoff:** below ~0.30 you start admitting weakly-related chunks — review a sample at your chosen cutoff to confirm they're clinically on-topic, not just lexically near. I'd start at **0.33** and eyeball the injected context in a few real sessions.
2. **Consider a small category *widening* for IFS, not just IFS-only.** IFS work overlaps heavily with `somatic`, `autonomics` (parts often show up as nervous-system states), and `jungian`. `['ifs', 'somatic', 'jungian']` would deepen grounding — but **only you can judge** whether pulling e.g. Jungian framing into an IFS turn is helpful or muddying. (The `parts_and_shadow`-style modes already blend `['jungian','ifs']`.) Tradeoff: more categories = more chances for off-framework grounding.
3. **Don't ground short openers at all — skip the call.** For messages under ~N tokens or matching greeting patterns, skip RAG (saves the whole round-trip and avoids the 0-result path being the common case). The mode prompt already handles greetings. Pure win once you accept openers don't need grounding.
4. **Optionally surface the `general`/`scenarios` corpus.** It's currently unreachable by scoped modes yet out-scores IFS on IFS queries. Either fold those docs into real categories at ingest, or add them to relevant modes' `ragCategories`. Needs judgment on what that content actually is.

---

## What NOT to touch (confirmed settled / out of scope)

- Crisis-detection latch, cache-prefix split, IFS intro logic — untouched per constraints.
- Graceful degradation (timeout/error → empty context, never throw) — preserve exactly; it's what makes dropping the timeout safe.
- `[Huxley PERF]` / `[RAG]` dev logs — keep; they already expose `_lastRagMs` and timeout flags.

## Suggested rollout order

1. **Ship the safe speed wins first** (embedding cache + local JWT verify + warm-ping). Re-measure `[Huxley PERF] rag=` on device.
2. Once warm latency is reliably <500ms, **drop `RAG_TIMEOUT_MS` 2000 → 800**.
3. **Then** tune quality (threshold 0.4→0.33, optional category widening) with a human reviewing injected context in real sessions — separately from the perf change so you can attribute any behavior shift.
