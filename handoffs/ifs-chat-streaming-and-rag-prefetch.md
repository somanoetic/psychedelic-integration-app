# IFS chat streaming (DONE) + RAG-timeout cut (DONE) + prefetch-while-typing (NEXT)

Status: **Two wins committed & device-verified on `feat/neurobiology-of-connection`.
Streaming the reply is live; RAG block budget lowered. Next step is the real
ttft fix: prefetch RAG while the user types. Not started.**

Resume line: **Read handoffs/ifs-chat-streaming-and-rag-prefetch.md and continue.**

## What was done this session (2 commits)

### 1. `c3f8b0e` — perf(ifs): stream the Claude reply
The IFS chat generated the full reply non-streamed, so the user waited the whole
`claude=` turn (6–7s) on a spinner before any text appeared. Now the reply
streams token-by-token; text starts rendering at time-to-first-token (~1.3–2s on
device) while the rest writes in live.

**The design fork (resolved):** Huxley emits user-facing prose THEN a
`---THERAPEUTIC_DATA---` JSON tail. We stream only the prose — a marker gate in
`chat()` forwards deltas until the marker appears, buffers the JSON tail (never
shown), and the full buffer is parsed exactly as before once the stream ends.
`chat()`'s return shape is UNCHANGED, so the other 21 `huxleyService.chat()`
callers are untouched; streaming is opt-in via a new `options.onToken`.

Layers touched (all in the commit):
- `supabase/functions/claude-proxy/index.ts` — `stream:true` tees Anthropic's SSE
  to the client and meters a copy to pull `usage` from the terminal
  `message_delta`, so rate-limit + cost logging survive (`recordTurn` shared with
  the non-stream path). Guarded by `EdgeRuntime.waitUntil` so the isolate isn't
  reclaimed mid-meter. **This function was redeployed** (`supabase functions
  deploy claude-proxy`) — streaming only works because it's live.
- `lib/claudeProxyService.js` — new `sendMessageStream()`, XHR-based (RN `fetch`
  has no incremental body reader), parses `content_block_delta`, returns the same
  `{content, usage}` shape as `sendMessage`.
- `lib/huxleyService.js` — `chat()` gains optional `onToken`; marker-gated prose
  forwarding + a post-stream flush for the no-marker case; PERF line now logs
  `ttft=` (time-to-first-token).
- `enhanced-components/IFSPartsWorkChatWithContext.js` — reply streams into a live
  bubble; spinner shows only until first token; all branch logic
  (exile/duplicate/summary/error) preserved via a `landReply()` helper.

### 2. `e41fa4e` — perf(ifs): RAG block budget 2000ms → 900ms
RAG output rides IN the prompt (volatile tail), so first token can't appear until
RAG resolves OR its timeout fires — making `RAG_TIMEOUT_MS` the primary lever on
ttft. Lowered `2000 → 900` in `lib/huxleyService.js`. Slow/cold turns now proceed
WITHOUT RAG (logged `(TIMED OUT, no RAG this turn)`) instead of stalling; the
fetch still runs and warms the cache. **Supersedes the old "do NOT drop below
2000" note** in `handoffs/chat-response-latency.md` — that predated streaming.

## Device-verified numbers (iPhone, ifs mode)

Before streaming: ttft = full turn, 6–7s of silence.
After streaming: `ttft=1.6–2.2s`. After 900ms cap: slow turns that were ~2.2s
now land ~1.3s. Cache holds across the stream (`read=7097 created=0` on
follow-ups). Replies stay short (`out=64–124`). User confirms it feels faster.

## THE finding that drives the next step

Every turn logs `embed=...(MISS)`. RAG never hits its client cache in a live
conversation because each message is unique text, so the embed (0.15–1.4s
against OpenAI) is paid on EVERY turn that stays under the cap. That embed is the
dominant remaining ttft cost. The cap avoids *waiting* on the slow ones; it
doesn't avoid *paying* for them.

## Next — prefetch RAG while the user types (NOT started)

Goal: turn the send-turn's RAG from a MISS into a HIT by running the embed+search
DURING the seconds the user spends typing (dead time today).

Sketch:
- In `enhanced-components/IFSPartsWorkChatWithContext.js`, debounce
  `onInputTextChange` (~400–600ms after they stop typing) and fire
  `ragService.getContextForPrompt(draftText, {...same opts as _startRagRetrieval})`
  in the background (fire-and-forget, swallow errors).
- Rely on `ragService`'s existing client cache so the send-turn's real call is a
  hit. Confirm the cache keys on the query text (check `lib/ragService.js`) — the
  draft won't be byte-identical to the final message, so decide: reuse the draft
  embedding if "close enough," or accept that prefetch warms the pipeline/cache
  even when the final query differs slightly.
- Keep the 900ms cap as the safety net; prefetch should make it rarely fire.

Gotchas / decisions to make BEFORE coding:
- Draft ≠ final message. The cache hit is only guaranteed if the query string
  matches. Options: (a) prefetch on the draft AND still fire on send — pipeline is
  warm even if not a literal hit; (b) embed the draft and reuse for send if edit
  distance is small. Start simple: (a).
- Cost: a few extra OpenAI embed calls per message. Cheap, but note it.
- Don't prefetch on every keystroke — debounce hard, and skip very short drafts
  (< ~15 chars) that will return 0 anyway.

## State / gotchas

- Branch `feat/neurobiology-of-connection`. Both commits are on it, NOT pushed
  (check before merging).
- **`IFSPartsWorkChatWithContext.js` still holds UNRELATED uncommitted WIP** — an
  "experience-tier intro" rework (`isExperienced`, `hasPriorSessions`,
  `inPreSessionMenu`, `getCheckInMessage` refactor). This session carefully
  committed ONLY the streaming hunks and left that WIP in the working tree. Do
  NOT sweep it into an unrelated commit; it's someone's in-progress work.
- The temporary `[Huxley PERF] reply=/json=` dev-logging split is still in
  `lib/huxleyService.js` (guarded by `__DEV__`). Left in on purpose — `ttft=` and
  `reply=`/`json=` are the metrics for the prefetch work. Remove once latency is
  dialed in.
- Model is `claude-sonnet-4-6` (import from `lib/aiModels.js`). Deliberate
  clinical-voice choice; NOT a latency lever — leave it. Generation speed was
  explicitly declined this session because streaming hides it behind reading.
- Sibling docs: `handoffs/chat-response-latency.md` (the thread this continues —
  its "trim wordiness" task shipped in `a17c915`; its "stream the reply" task is
  now DONE here), `handoffs/rag-speed-and-quality.md` (RAG quality/perf history).
