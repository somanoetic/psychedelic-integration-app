# IFS RAG prefetch-while-typing + reuse-if-close (DONE) — next: build= / retrieval quality

Status: **DONE and COMMITTED (`cc04727`) on `feat/neurobiology-of-connection`,
device-verified. Reuse mechanism works (REUSED turns land rag=31-36ms vs
500-2000ms fresh). Finding: this removes the inline embed cost + timeout risk
but does NOT move ttft much, because RAG already ran concurrently with build=.**

Resume line: **Read handoffs/ifs-rag-prefetch-reuse.md and continue.**

## What was done this session (1 commit: `cc04727`)

Continued `handoffs/ifs-chat-streaming-and-rag-prefetch.md`'s "NEXT" item:
prefetch RAG while the user types so the send turn isn't a cold embed MISS.

- `lib/huxleyService.js`
  - `prefetchRag(draft, opts)` — debounced background retrieval fired from the
    component. STORES the in-flight promise on `this._ragPrefetch = {query,
    formatted}` (not fire-and-forget) so the send turn can reuse it. Mirrors
    `_startRagRetrieval`'s exact options (maxResults:3, threshold:0.30, same
    `modeConfig.ragCategories`). Skips drafts < 15 chars.
  - `_startRagRetrieval` — REUSE-IF-CLOSE: consumes `_ragPrefetch`; if the sent
    message `_ragQueryIsClose` to the prefetched query, reuses that promise
    (no fresh embed). Otherwise fresh search as before. Both paths honor the
    900ms `RAG_TIMEOUT_MS` cap. Sets `_lastRagReused`.
  - `_ragQueryIsClose(sent, prefetched)` — normalizes (lowercase, strip
    punctuation, collapse whitespace) then prefix-matches on a word boundary,
    ≥15 shared chars. Robust to the trailing-punctuation break that was the
    real turn-2 bug (prefetch `"...to be."` vs sent `"...to be a doctor"`).
  - PERF line now tags each turn ` REUSED` or ` fresh` (the divergence-rate
    metric).
- `enhanced-components/IFSPartsWorkChatWithContext.js`
  - `onInputTextChange` → `handleInputChange` (useCallback): sets input + a
    500ms debounced `huxleyService.prefetchRag(draft)`. Skipped in `learning`
    phase. Timer cleared on send and on unmount. Added `useCallback, useRef`.

## Device-verified numbers (iPhone, ifs mode)

- REUSED turns: `rag=31ms` / `rag=36ms`, `build=30-35ms`.
- fresh turns: `rag=565-2001ms`.
- BUT ttft did NOT track that: a REUSED turn logged `ttft=1802ms` while a fresh
  turn logged `ttft=1238ms`. Because `rag≈build` on fresh turns, RAG was already
  fully hidden behind prompt assembly; eliminating it just exposes build= +
  first-token network as the real ttft floor.
- Divergence causes seen in real typing: typos fixed mid-word (`eork`→`work`),
  and typing past the 500ms pause. Reuse hit ~2/5 turns in casual testing.

## THE findings that drive the next step

1. **`build=` is the new ttft bottleneck, not RAG.** It runs 30-813ms and is the
   thing RAG now hides behind. Profile `_buildSystemPrompt` in
   `lib/huxleyService.js` — what costs 650-813ms of synchronous string assembly
   / context building? That's likely a bigger ttft win than anything RAG.
2. **Retrieval quality is thin on everyday topics.** Work/career/"doctor"
   queries returned 0-1 results at 30-34% similarity. The corpus is body- and
   parts-heavy; plain-life language matches little. Pre-existing thread — see
   `handoffs/rag-speed-and-quality.md`.

## Next options (not started — pick one)

- **Profile build=** (recommended for latency): instrument `_buildSystemPrompt`
  stages, find the 650-813ms, decide what can shrink or precompute.
- **Retrieval quality**: widen corpus or query-expansion for non-somatic
  language. See `handoffs/rag-speed-and-quality.md`.
- **Or call latency done**: streaming (`c3f8b0e`) + 900ms cap (`e41fa4e`) +
  this prefetch/reuse are the wins; ttft is ~1.2-1.8s and feels fast.

## State / gotchas

- Branch `feat/neurobiology-of-connection`. Commit `cc04727` is on it,
  **NOT pushed** — check before merging.
- **`IFSPartsWorkChatWithContext.js` STILL holds UNRELATED uncommitted WIP** —
  the "experience-tier intro" rework (`isExperienced`, `hasPriorSessions`,
  `inPreSessionMenu`, `getCheckInMessage` refactor, learning/trailhead prompt
  rewrites). This session again committed ONLY the prefetch hunks (via a
  hand-built patch applied with `git apply --cached --recount`) and left the
  WIP in the working tree — currently 73 insertions / 19 deletions unstaged.
  Do NOT sweep it into an unrelated commit.
- Temporary `__DEV__` PERF logging still in `lib/huxleyService.js`: `ttft=`,
  `reply=`/`json=`, and the new ` REUSED`/` fresh` tag. Kept on purpose as the
  latency metrics. Remove once latency is dialed in.
- `_ragQueryIsClose` gates REUSE of already-retrieved knowledge, NOT the query
  text sent to the embed — loosening it can't corrupt output, only decide
  reuse-vs-fresh. Validated against 6 real log cases (see this session's
  transcript); the node check-script lived in scratchpad, not committed.
- Model `claude-sonnet-4-6` (from `lib/aiModels.js`) — deliberate clinical voice,
  not a latency lever. Leave it.
- Sibling docs: `handoffs/ifs-chat-streaming-and-rag-prefetch.md` (immediate
  predecessor — its "prefetch NEXT" is what this DID), `handoffs/rag-speed-and-quality.md`
  (RAG quality/perf history), `handoffs/chat-response-latency.md` (older thread).
