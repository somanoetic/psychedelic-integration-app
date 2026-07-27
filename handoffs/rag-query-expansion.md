# RAG query expansion (DONE, committed be2f565) + latency thread CLOSED

Status: **DONE and COMMITTED (`be2f565`) on `feat/neurobiology-of-connection`,
corpus-verified across 4 modes at production threshold, device-verified on IFS.
NOT pushed. The latency thread is now CLOSED (proven, not just deferred).**

Resume line: **Read handoffs/rag-query-expansion.md and continue.**

## What this session did (1 commit: `be2f565`, 2 files)

Resumed `handoffs/ifs-rag-prefetch-reuse.md`, which offered "profile build=" vs
"retrieval quality." Did BOTH — the first ruled itself out, the second is the fix.

### 1. Latency: CLOSED, not deferred (`lib/huxleyService.js`)
The handoff said "build= is the new ttft bottleneck (650-813ms of synchronous
string assembly)." Reading the code, that framing was wrong: `_buildSystemPrompt`
is async and its ONLY await is `await ragPromise` at the tail. All string work is
memoized (`_getExerciseCatalog`) or trivial. So `build=` was DOUBLE-COUNTING the
RAG await.

Split the metric to prove it: added `asm=` (pure synchronous assembly) + `ragWait=`
(time BLOCKED awaiting RAG at the tail) to the `[Huxley PERF]` line, via instance
fields `_lastAsmMs`/`_lastRagWaitMs` set in `_buildSystemPrompt`. **Device result:
`asm=0-2ms` on every turn.** There is NO build optimization to do. ttft (~1.1-1.9s)
is first-token network + proxy, which streaming (`c3f8b0e`) already hides. Latency
is done — streaming + 900ms RAG cap + prefetch/reuse were the wins.

### 2. Retrieval quality: mode-specific query expansion (the real fix)
Root cause (confirmed by an Explore agent mapping the whole RAG path — NOT a model
mismatch; query + ingest both use `text-embedding-3-small` @1536 via one edge fn):
the corpus is dense clinical/academic prose, so raw everyday utterances embed too
far from it and score below the 0.30 threshold → 0 results. Evidence: IFS-jargon
queries hit 44-56%, plain-language ("I'm not happy at work") 33-36% or 0.

Fix — `_expandRagQuery(query, modeConfig)` in `lib/huxleyService.js`: appends a
small mode-specific `ragFraming` term list to the EMBED query only, nudging the
vector into the corpus register. Deterministic, zero-cost, zero-latency (pure
string concat — composes with prefetch). Wired into BOTH `getContextForPrompt`
call sites (`_startRagRetrieval` + `prefetchRag`) so prefetch/reuse stays valid.

**CRITICAL invariant:** expansion applies to the embed text ONLY. The reuse
closeness check (`_ragQueryIsClose`) still compares RAW user text on both sides
(the stored `_ragPrefetch.query` is raw). If it saw expanded text, every query
would carry identical framing and look falsely "close," corrupting reuse.

`lib/huxleyModeConfigs.js`: added `ragFraming` to all 15 modes next to
`ragCategories`. `null`-category modes (general, journal, therapeutic_integration)
get `ragFraming: null` (whole-corpus, no single register to bias toward).

## Verification (knowledge-base/rag/search.py, threshold 0.30 = production)

The CLI hits the identical edge function the app uses. Raw -> expanded:

| mode | query | raw | expanded |
|------|-------|-----|----------|
| ifs | "ER doctor anymore" | **0** | 42/42/41 |
| ifs | "not happy at work" | **0** | 48/43/40 |
| ifs | "angry when discounted" (emotional) | 33/32/32 | 46/42/39 |
| ifs | "face hot / gut tight" (somatic) | 45/39/38 | 55/46/44 |
| ifs | "pressure in my chest" (somatic) | — | 56/47/44 |
| ifs | "the part that wants to leave" (jargon) | 42/42/41 | 46/41/41 |
| nervous_system | "heart racing, can't calm" | 41/38/37 | 59/59/58 |
| nervous_system | "numb and shut down" | 38/38/36 | 57/54/53 |
| core_beliefs | "not good enough" | 39/33/32 | 53/52/50 |
| core_beliefs | "everyone always leaves me" | **0** | 51/46/44 |
| intention | "feel more connected" | 41/41/37 | 57/57/57 |

Four "0 -> solid hits" rescues. No degradation anywhere.

## Device finding that improved the design (IFS)
On-device, the ORIGINAL IFS blob (`a part of me, protector, feeling stuck or
trapped, wanting escape, felt sense in the body`) rescued the emotional query
("angry when discounted" -> 48-50%) but DRAGGED a pure somatic query ("my face
gets hot, gut tight and tingly") DOWN to 31% then 0 as it got longer — the
protector-heavy terms over-weighted parts content and pulled body-sensation
queries away from the somatic corpus.

Fixed: IFS framing is now felt-sense-led — `['a part of me', 'felt sense in the
body', 'sensation', "emotion I'm noticing"]` — which lifts BOTH registers
(emotional 33->46, somatic 45->55). **The committed IFS framing is the improved
one; the device run used the old blob, so the committed version strictly beats
what was seen on-device.** Worth one quick phone re-check of a somatic message to
close the loop, but the offline data is unambiguous.

## State / gotchas
- Branch `feat/neurobiology-of-connection`. Commits `cc04727` + `be2f565`
  **NOT pushed** — check before merging.
- **`enhanced-components/IFSPartsWorkChatWithContext.js` STILL holds the same
  UNRELATED uncommitted WIP** (experience-tier intro rework, 73 ins / 19 del).
  Untouched again this session. Do NOT sweep it into an unrelated commit.
- **11 of 15 modes' framing is PRINCIPLED, not golden-tested.** Corpus-verified:
  ifs, nervous_system (x2 + regulating_resources share the autonomic set),
  core_beliefs, intention. The rest (polyvagal_checkin, triggers_glimmers,
  active_imagination, experience_mapping, philosophical_talkthrough,
  adult_attachment_interview) use the same proven mechanism with mode-appropriate
  vocab but weren't score-tested. Same register-imbalance risk the IFS device test
  found could exist there — spot-check with search.py if a mode underperforms.
- Temporary `__DEV__` PERF logging still in `lib/huxleyService.js` (`ttft=`,
  ` REUSED`/` fresh`, and now `asm=`/`ragWait=`). Kept as the latency metrics;
  remove once dialed in — but note asm/ragWait has now served its purpose (latency
  is closed), so it's a candidate for removal.
- `search.py` harness lives at `knowledge-base/rag/search.py`; needs
  `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in `.env`. Golden-set format:
  `python knowledge-base/rag/search.py "<query>. <framing terms>" --category ifs --category somatic --threshold 0.30 --count 3 --json`

## Next options (not started — pick one)
- **Spot-check the 11 untested modes** with search.py; adjust any imbalanced
  framing (cheap, offline, same method as IFS).
- **Embed-cache MISS** (still every turn, 120-990ms): the server/client caches key
  on exact query text so conversational turns never hit. A cheap RAG-speed win
  independent of quality. See `handoffs/rag-speed-and-quality.md`.
- **Or call RAG quality done** — the plain-language 0-result problem (the actual
  user complaint) is fixed and verified.

## Sibling docs
- `handoffs/ifs-rag-prefetch-reuse.md` — immediate predecessor (its "build=" and
  "retrieval quality" next-options are what THIS resolved).
- `handoffs/rag-speed-and-quality.md` — RAG perf history + the golden-set evidence
  table this built on; embed-MISS analysis lives here.
- `handoffs/ifs-chat-streaming-and-rag-prefetch.md` — streaming + timeout-cut.
