# IFS chat response latency — wordiness trim + streaming (Huxley/Multitudes)

Status: **RAG auth-hop fix DONE & committed (`812ce2a`, device-verified). Two
follow-ups scoped but NOT started: (1) trim response wordiness, (2) stream the
Claude reply. Do (1) first, then decide if (2) is worth it.**

Resume line: **Read handoffs/chat-response-latency.md and continue.**

## What was done this session (committed `812ce2a`, on `feat/neurobiology-of-connection`)

Closed out the deferred RAG *speed* work from `handoffs/rag-speed-and-quality.md`:

- **Local HS256 JWT verify** replaces the ~1s `auth.getUser()` network hop in the
  embeddings edge function. Confirmed the project signs HS256 (legacy JWT secret).
  Device-verified: `auth` dropped ~1s → **2–4ms** (`auth=N(local)` in the PERF line).
  Gated on the `RAG_JWT_SECRET` function secret (now SET on the project + deployed);
  falls back to network `getUser()` if unset, so never runs unauthenticated.
- **Per-stage timing** now returns in the search response + shows on-device:
  `[Huxley PERF] … rag=NNNms [auth=NN(local) embed=NNM rpc=NN net=NN] …`
- Files in the commit: `supabase/functions/embeddings/index.ts`, `lib/ragService.js`,
  `lib/huxleyService.js`, `supabase/functions/embeddings/WARM_PING_AND_CACHE.md`
  (§3–4 document the secret + verify steps), `handoffs/rag-speed-and-quality.md`.
- `RAG_TIMEOUT_MS` **left at 2000** — device turn 1 hit `rag=2143ms`, proving a drop
  to 800 would time out cold turns. Do NOT lower it.

## The real finding (why the next work exists)

With the auth hop gone, the on-device PERF split showed RAG is NOT the bottleneck.
Representative turns:

```
rag=1135–2143ms [auth=2–4(local) embed=493–1294M rpc=399–519 net=240–321]
claude=6099–7217ms   in=538–866   out=423–490
```

- **Claude dominates** (6–7s) and it's **output-token generation** — `out=423–490`
  tokens, generated sequentially, non-streamed → user waits the full time for the
  whole message to appear at once.
- **Prompt caching is working** (`read=6723 created=0` on follow-ups) — not a factor.
- **RAG mostly overlaps** the prompt build (`rag ≈ build`), so it's largely hidden
  behind Claude anyway. Embed (OpenAI) is now the dominant RAG cost and is always a
  cache MISS on unique conversational text — but this matters little given Claude.
- User confirms responses are **occasionally too wordy**.

## Next — two tasks, do them IN ORDER (not parallel)

Sequential because task 1's result changes task 2's payoff: a shorter reply
(~250 tok ≈ ~3.5s) may make streaming unnecessary, or at least less urgent. They
don't conflict in code (prompt text vs. transport/UI), but do 1 first and
re-measure `out=` / `claude=` before committing to 2.

### Task 1 — Trim response wordiness (fast, low-risk, DO FIRST)

Ready-to-paste prompt is below. Gist:
- Edit the IFS mode systemPrompt / length guidance in `lib/huxleyService.js` and
  `lib/huxleyModeConfigs.js` (ifsMode) to encourage shorter, more spacious replies
  (e.g. "one reflection OR one question per turn, not both").
- **Clinical voice, not just perf** — show before/after examples; user signs off on
  tone. User is a therapist and tests as end-user.
- Do NOT touch: crisis-detection, cache-prefix structure, the 6 F's logic, the intro
  flow (settled — see `handoffs/ifs-chat-intro-and-6fs.md`).
- Length instruction must live in the STABLE cached prefix, not the volatile tail,
  or it busts prompt caching.
- Metric: `out=` tokens and `claude=` ms, before vs after, on device.
- NOTE: LOG.md's 2026-07-14 entry describes a *prior* wordiness pass ("15–70 words
  now", user signed off) — check whether that shipped or was reverted before
  re-doing it; the current on-device `out=423–490` suggests replies grew again or
  that pass didn't land on this branch. Reconcile first.

### Task 2 — Stream the Claude reply (bigger, only after Task 1)

Ready-to-paste prompt is below. The HARD part, flag early:
- **Huxley returns STRUCTURED output** (`---THERAPEUTIC_DATA---`, parsed JSON fields,
  see the file header in `lib/huxleyService.js`), not plain prose. You can't stream
  half-parsed JSON to the UI. Resolve this design fork BEFORE writing code (e.g.
  stream only a prose field; or a two-part response).
- Spans three layers: `supabase/functions/claude-proxy/index.ts` (proxy Anthropic
  SSE), `lib/huxleyService.js` (incremental instead of await-full-then-parse), and
  the chat UI (`components/chat/ChatConversation.js` / `HuxleyChatScreen.js`).
- Preserve: prompt caching, crisis-detection, RAG overlap, PERF logging (add
  time-to-first-token). Usage/cache metrics arrive in the final `message_delta`
  event when streaming, not a top-level body — handle that.
- Start with a written plan, not code.

## The two prompts (verbatim, ready to paste into fresh chats)

Both prompts were drafted this session; they live in the conversation that produced
`812ce2a`. Re-create from the task notes above, or ask the user — the key
constraints are captured in Tasks 1 & 2. The single most important carry-forwards:
**Task 1 = cached-prefix edit + tone sign-off; Task 2 = resolve structured-output-
vs-streaming BEFORE coding.**

## State / gotchas

- Branch `feat/neurobiology-of-connection` (still holds many unrelated uncommitted
  working-tree edits in `components/`, `screens/` — intentionally NOT part of the RAG
  commits; leave them alone).
- `RAG_JWT_SECRET` is set on the Supabase project and the embeddings function is
  deployed with the new code — `auth=N(local)` confirms it's live.
- Model is `claude-sonnet-4-6` (all services consolidated; import from
  `lib/aiModels.js`, never hardcode). Not a lever here — right tier for the clinical
  voice; Haiku would be faster but lose nuance.
- Separately noted but OUT of scope for this thread: somatic/emotional openers
  ("pit in my stomach", "it's always there") returned 0 RAG results — that's the
  *quality* thread in `handoffs/rag-speed-and-quality.md`, and those vague openers
  legitimately return 0. Not a defect to chase here.
