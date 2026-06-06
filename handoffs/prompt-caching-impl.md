# Handoff: Prompt-Caching Implementation

## Goal
Enable Anthropic prompt caching end-to-end. Split each live AI prompt into a
stable cached prefix (one `cache_control: {type:'ephemeral'}` block) and a
per-message volatile tail that rides in the user message instead of `system`,
so the cached prefix stays byte-stable across turns. Follows the audit in
`handoffs/prompt-cache-audit.md`. This session: full refactor + wiring (the
audit's "What's next" list, all four items).

## What was done
- **Plumbing**: `claudeProxyService.sendMessage` now accepts `system` as either a
  string (unchanged) OR an array of content blocks carrying `cache_control`.
  Guard widened from truthy to `!= null`. Added a `__DEV__` cache log
  (read / created / uncached input tokens).
- **Edge function**: widened the `system?` type to `string | text-block[]` with
  `cache_control`; added `systemPromptLength()` helper for the length log; added
  `cache_read_input_tokens` / `cache_creation_input_tokens` into the
  `api_usage_logs.metadata` row for server-side hit-rate auditing. Body was
  already spread verbatim to Anthropic, so structured `system` flows through.
- **Huxley**: `_buildSystemPrompt` now returns `{ systemBlocks, volatileTail }`.
  Prefix block = identity + shared context + exercise catalog + mode prompt +
  structured-output instructions. Volatile tail (phase, mode-context, handoff,
  crisis/scenario protocols, RAG) is appended to the LAST user message at the
  call site. Build-vs-push order intentionally NOT changed (preserves the
  existing quirk where scenario/RAG detection reads the prior user turn).
- **Routing**: added `getDetectedProtocols()` (volatile protocols only).
  `getAIResponse` sends static base as a cached block + appends protocols to the
  user turn. `getEnhancedSystemPrompt` left intact (its test asserts the string).

## Key files (where things live on disk)
- `lib/claudeProxyService.js` — `sendMessage` (~line 24); cache log (~line 68).
- `supabase/functions/claude-proxy/index.ts` — `SystemPrompt` type (~line 38);
  usage-log metadata (~line 170); `systemPromptLength()` helper (near bottom).
- `lib/huxleyService.js` — `_buildSystemPrompt` (~line 423, now returns object);
  call site that splices tail + sends `systemBlocks` (~line 227 and ~290).
- `lib/conversationalRoutingService.js` — `getDetectedProtocols()` (~line 226);
  `getAIResponse` (~line 393) builds cached `system` + apiMessages.
- `lib/claudeAPI.js` — thin `callClaude` wrapper; unchanged, forwards `system` through.
- `__tests__/lib/conversationalRoutingService.test.js` — updated one assertion
  (now imports `MODELS`, asserts `system` is a cache_control block array).

## Current state
- Branch: `master` (pre-existing unrelated uncommitted changes in working tree).
  This session edited the 5 lib/edge files above + the one test + LOG.md + this
  handoff. NOTHING COMMITTED — user had not asked to commit at wrap time.
- Tests: routing suite 48/48 pass. All edited JS files pass `node --check`.
  Edge function is `tsc`-clean except the expected `Deno` global (deploy-time).

## Known issues / gotchas
- **Edge function not yet deployed.** The `index.ts` changes only take effect
  after `supabase functions deploy claude-proxy`. Until then, structured `system`
  still passes through (body is spread), but the cache-token metadata logging is
  not live.
- **Cache TTL is 5 min.** Hits only land on turns within that window.
- **conversationBot e2e suite is unrunnable** — dies importing a `.png` via
  `lib/uiIcons.js` before any test runs (pre-existing jest asset-transform gap,
  not caused by this work). So the full chat path has no automated coverage right
  now; the `__DEV__` cache log is the fastest real signal.
- Shared-context block rebuilds when the model writes new themes/parts — kept
  inside the cached prefix per the audit (rare invalidation, acceptable).

## What's next
1. Deploy the edge function: `supabase functions deploy claude-proxy`.
2. Device check: send two Huxley messages in the same mode within 5 min; confirm
   `cache_read > 0` on the second in the dev log. Repeat for the routing chat.
3. (Optional) `paperScanService` — stable per worksheet but low value; skip unless
   cost data says otherwise.
4. Commit once verified.

## Resume
Read handoffs/prompt-caching-impl.md and continue.
