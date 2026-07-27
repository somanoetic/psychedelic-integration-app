# IFS chat — latency tuning + intro rework (session addendum)

Status: **done this session, NOT yet device-verified across a full multi-turn session.**
Sibling doc: `handoffs/rag-speed-and-quality.md` (the RAG-specific follow-up spun off from here).
Started as "IFS responses are slow" + "Huxley assumes the user knows what a part is."

## TL;DR of what shipped

1. Parallelized RAG so it overlaps prompt assembly.
2. Fixed a bug where RAG queried the PRIOR turn and skipped turn 1 entirely.
3. Added `[Huxley PERF]` timing instrumentation + Level-1 RAG result logging.
4. Added a RAG safety-net timeout (2000ms).
5. **Moved shared therapeutic context OUT of the cached prefix** (it was intermittently busting the prompt cache mid-session) → into the volatile tail.
6. Compacted the modeContext JSON in the tail (no pretty-print).
7. Reworked the IFS check-in to teach the two on-ramps (notice / trailhead), adaptive to user experience.
8. Fixed the text input box disappearing after the first check-in answer (phase-name collision).

Everything is in `lib/huxleyService.js`, `lib/ragService.js`, and
`enhanced-components/IFSPartsWorkChatWithContext.js`.

---

## The latency investigation (what the data said)

Real 2-turn IFS PERF lines (each turn ≈ 6s):
```
Turn 1:  rag=1470ms  claude=3903ms  total=5374ms | cache read=6936 created=0  in=308
Turn 2:  rag=1553ms  claude=4820ms  total=6373ms | cache read=6936 created=0  in=1536
```
A later session showed Claude CLIMBING across turns (3.4s→5.0s→5.3s→6.2s) as `in=`
grew (305→351→797→3289), and on the last turn **the cache broke**:
`cache read=0, created=6983`.

Conclusions:
- **Prompt cache DOES work** — but broke intermittently mid-session (see fix #5).
- **RAG ≈ 1.5s steady-state**, in series ahead of Claude; highly variable (695ms–2900ms).
  The pgvector IVFFlat index EXISTS, so the cost is the OpenAI embedding call, not the DB.
- **Claude is the dominant + growing cost**, driven by growing `in=` (volatile tail).
- Streaming would mask the Claude wait perceptually but is the biggest-effort item;
  deferred in favor of the cheaper wins below.

---

## Changes in detail

### `lib/huxleyService.js`

- **Parallelized RAG** — `_startRagRetrieval(modeConfig)` launches the retrieval at the
  top of `chat()` so it overlaps synchronous prompt assembly; `_buildSystemPrompt`
  awaits it only at the tail. `rag ≈ build` in logs confirms build is pure RAG-wait.
- **Turn-order fix** — the user message is now pushed to `conversationHistory` BEFORE
  RAG launch + prompt build, so RAG queries the CURRENT turn. Previously the push
  happened after, so RAG/scenario-detection saw the PRIOR message and skipped turn 1
  (empty history → empty query). Crisis-latch detection was already correct (runs on
  `message`) and is unchanged.
- **`[Huxley PERF]` log** (`__DEV__`) — per-turn breakdown: `rag / build / claude / total`
  ms + `cache read/created/in/out`. RAG time is recorded on `this._lastRagMs` inside the
  helper (true wall-time, independent of when it's awaited).
- **RAG safety-net timeout** — `RAG_TIMEOUT_MS = 2000` + `_withTimeout()` helper. On
  timeout the turn proceeds with no RAG (empty string); the underlying fetch is NOT
  cancelled and may warm the RAG cache. PERF log appends `(TIMED OUT, no RAG this turn)`.
  Set ABOVE the ~1.5s steady-state deliberately — safety net, not kill switch.
  **When RAG speed is fixed (see sibling doc), drop this to ~800ms.**
- **CACHE FIX (highest-value):** `_buildSharedContext()` (themes, parts, NS state, master
  context) was inside the cached `systemBlocks` prefix. It MUTATES as the session
  extracts new parts/themes, so any change tore down and rewrote the entire ~6,900-token
  prefix (`read=0, created=~6900`). Moved it to the volatile tail. The cached prefix now
  holds only stable content (identity, exercise catalog, mode prompt, structured-output
  instructions) and should read every turn. Guard added so an empty shared-context (bare
  header only) is not injected.
- **Tail trim:** modeContext is now `JSON.stringify(modeContext)` (compact) instead of
  pretty-printed with `null, 2`. Same data, ~30–40% fewer tokens on the piece that grows.
- **NOT done (deliberately):** capping the accumulating arrays inside the IFS handler's
  `getModeContext()` (askedQuestions, phaseSummaries). Risks changing what Huxley
  remembers mid-session. Next lever if `in=` still creeps after the above.

### `lib/ragService.js`

- **Level-1 retrieval logging** (`__DEV__`) — each search logs query, categories,
  threshold, and per-result `[score%] source / section — "snippet"`, plus an explainer
  on 0 results. This is how RAG quality is now observable. (Fed the corpus-language
  insight now recorded in the sibling RAG doc.)

### `enhanced-components/IFSPartsWorkChatWithContext.js`

- **Adaptive check-in** — `getCheckInMessage(parts, isExperienced)` now teaches two
  on-ramps: (1) notice a feeling/thought/pattern, (2) start at a *trailhead* (a life
  problem that's a doorway to the part behind it). Experience tier derived from app
  history (saved parts OR prior sessions, loaded in parallel in `beginSession`), no
  question asked: NEW users get the full teaching version; EXPERIENCED users get a
  one-line reminder then the invitation. Biases to "new" when signal is ambiguous.
- **Trailhead-aware AI seed** — `handlePartSelection`'s prompt now tells Huxley the input
  may be a trailhead (problem) rather than a named part, and to bridge problem → part.
- **"Explain it to me & discuss" path** — seed prompt in `handleLearningQuestion`
  broadened to give an unhurried, question-friendly overview of the IFS model (general
  mode, maxTokens 1000), while keeping the hard guard against slipping into a session.
- **INPUT-BOX BUG FIX** — the box vanished after the first check-in answer. Root cause:
  a phase-name collision. The screen used `'intro'` to mean "pre-session menu, hide
  input," but the IFS mode handler ALSO uses `'intro'` as its first *working* phase.
  After the check-in answer, `sessionProgress.phase === 'intro'` flowed back and
  `showInput` hid the box. Fix: (a) `handleSendMessage` now sets `sessionType='discovery'`
  when answering the check-in by typing (a free-text answer IS the session starting);
  (b) `showInput` keys the menu-hide on `!sessionType` so the handler's 'intro' working
  phase no longer hides the box; `'learning'` kept visible (types questions).

---

## What to verify on device (not yet done)

1. **Cache holds mid-session (the key one):** run a multi-turn IFS session until a part is
   extracted, and confirm `cache read` STAYS > 0 (no `created=~6900` rewrite). If it still
   rewrites on a part-extraction turn, fix #5 didn't fully land — investigate.
2. `in=` lower per turn than the 3289 previously seen; `claude=` stops climbing steeply.
3. RAG timeout fires cleanly on slow turns (`(TIMED OUT...)`), turn still completes.
4. New vs. returning check-in feels right; trailhead answer bridges to a part.
5. **Input box stays visible** through Huxley's reply after a typed trailhead/check-in
   answer and into parts work.

## Deferred / open

- **Streaming** — biggest perceived-latency win for the ~4–6s Claude wait, but biggest
  effort (proxy edge fn hardcodes `stream:false`, needs SSE end-to-end + UI). Revisit
  after confirming the cache/tail fixes landed. Note the `---THERAPEUTIC_DATA---` marker
  must be buffered so machinery never streams to screen; consider NOT streaming while the
  crisis latch is active (preserves ability to vet output).
- **Crisis-detection hardening** — separate thread. Current detection is keyword-based
  (`detectScenarios`), with real gaps (e.g. "I don't see the point anymore" may not
  trigger). Orthogonal to all the above.
- **RAG speed + quality** — see `handoffs/rag-speed-and-quality.md`.
- **IFS handler modeContext array caps** — next tail-trim lever if needed (see above).
