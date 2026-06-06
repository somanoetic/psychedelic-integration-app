# Implementation Prompts — Prompt Caching

**Created:** 2026-06-02
**Companion to:** `context/features/prompt-caching-plan.md`
**Use:** Paste these prompts (in order) to an implementation agent. Each is self-contained,
references exact files/lines, and ends with a verification step. Do them in sequence —
later prompts assume earlier ones landed.

> Real code referenced: `supabase/functions/claude-proxy/index.ts`,
> `lib/claudeProxyService.js`, `lib/metricsService.js`.
> Anthropic pricing: Sonnet 4.6 = $3/M input, $15/M output; cache write ≈ 1.25× input,
> cache read ≈ 0.10× input.

---

## Prompt 0 — Audit prefix stability (do FIRST, no code change)

```
Before adding prompt caching, audit whether our system prompts form a byte-stable cacheable
prefix. Read lib/huxleyService.js (and the other AI services it resembles) and identify
every dynamic value injected into the `system` string passed to claudeProxyService:
timestamps, user names, random IDs, per-message RAG chunks, dates.

For each, classify: (a) STATIC across a session (safe to cache), (b) VOLATILE per message
(must NOT be inside the cached block). Produce a short report listing each AI service, what
its system prompt contains, and whether its prefix is cache-stable as written. Flag any
service that injects volatile data into the system prompt — those need the volatile part
moved into the user message before caching helps. Do not change code yet; just report.
```

---

## Prompt 1 — Add caching in the edge function (the core change)

```
Add Anthropic prompt caching to supabase/functions/claude-proxy/index.ts. The goal: cache
the stable system prompt so repeated calls in a conversation bill the system tokens at the
cache-read rate (~10% of input) instead of full price.

Requirements:
1. In the fetch to https://api.anthropic.com/v1/messages (around line 127), add the beta
   header for prompt caching alongside the existing headers. Verify the current correct
   header value for the Messages API at build time (it has been
   `anthropic-beta: prompt-caching-2024-07-31`; confirm it is still current — caching may now
   be GA and not require the header. If GA, omit the header).
2. The incoming requestBody.system is a plain string (see the ClaudeRequest interface, line
   37-47). Before sending to Claude, transform it into a structured system blocks array and
   mark it cacheable:
     system: [{ type: "text", text: <the incoming system string>,
                cache_control: { type: "ephemeral" } }]
   Only do this when requestBody.system is a non-empty string. If absent, send nothing.
3. Do NOT add cache_control to the `messages` array — those rotate every turn.
4. Keep the existing `...requestBody` spread but override `system` with the structured
   version so you don't double-send the string form. Be careful: the spread currently
   includes the raw `system`; replace it explicitly.
5. Preserve all existing behavior (max_tokens clamp at line 124, rate limiting, logging).

After implementing, show me the diff and explain how a caller passing a plain `system`
string now gets a cached prefix without any client change.
```

---

## Prompt 2 — Capture cache token usage in logging

```
Anthropic's response now returns usage.cache_creation_input_tokens and
usage.cache_read_input_tokens in addition to input_tokens/output_tokens. Update
supabase/functions/claude-proxy/index.ts so cost tracking is accurate:

1. In the api_usage_logs insert (around line 165), add columns for cache_creation_tokens and
   cache_read_tokens from claudeData.usage (default 0). If the table lacks these columns,
   write the migration to add them (nullable integers) and note it.
2. Fix calculateCost() (line 208): it currently (a) has no entry for our real model
   'claude-sonnet-4-6' (only 'claude-sonnet-4'), and (b) ignores cached tokens. Update it to:
   - price claude-sonnet-4-6 at input $0.003/1K, output $0.015/1K
   - charge cache_creation_input_tokens at 1.25× the input rate
   - charge cache_read_input_tokens at 0.10× the input rate
   - charge the remaining (non-cached) input_tokens at the normal input rate
   Note: Anthropic's `input_tokens` field EXCLUDES cached tokens, so total input cost =
   input_tokens×rate + cache_creation×1.25×rate + cache_read×0.10×rate. Verify this against
   current Anthropic docs and adjust if their accounting differs.
3. Pass cache_creation/cache_read through in _proxy_metadata (line 183) so the client and
   dashboard can see cache effectiveness.

Show the diff and a worked example: a 5,000-token system prompt, first call vs. a warm-cache
call, with the dollar cost of each.
```

---

## Prompt 3 — Mirror cost fix in the client metrics service

```
Update lib/metricsService.js so client-side cost estimates match the new server-side cached
pricing:
1. CLAUDE_PRICING (line 74) only has MODELS.PRIMARY input/output. Add cached-read and
   cache-write multipliers (read = 0.10× input, write = 1.25× input).
2. estimateCost() (around line 574) and any token-pricing helper must account for
   cache_creation and cache_read tokens when present in the usage object, mirroring the edge
   function's calculateCost. If usage lacks cache fields, behave exactly as today (no
   regression).
3. Keep the existing public API shape; only extend it.

Run the existing metrics tests and show they still pass.
```

---

## Prompt 4 — (Optional) second cache breakpoint for session RAG

```
ONLY if the Prompt 0 audit found that RAG context is retrieved once per session and reused
across turns (not re-fetched every message): add a SECOND cache breakpoint so the RAG block
is cached separately from the static identity.

In the relevant AI service, structure the system content as ordered blocks:
  [ { static system + HUXLEY_IDENTITY, cache_control: ephemeral },
    { per-session RAG context,         cache_control: ephemeral } ]
placed before the conversation messages. Anthropic allows up to 4 cache breakpoints; we use
2. This requires the edge function to accept system as either a string OR a pre-structured
blocks array — extend the transform from Prompt 1 to pass through an already-array system
unchanged (just ensure cache_control is present on the intended blocks).

If the audit found RAG is re-fetched every message (volatile), SKIP this prompt — caching it
would never hit. Report which case applies.
```

---

## Prompt 5 — Verify end to end

```
Verify prompt caching works and saves money:
1. Run a single Huxley conversation of 5 messages (use the persona matrix harness or a manual
   script). Capture _proxy_metadata for each turn.
   - Expect: turn 1 has high cache_creation_input_tokens, ~0 cache_read.
   - Turns 2-5: high cache_read_input_tokens, low creation.
2. Compute total cost with the updated calculateCost for the 5-turn conversation, and compare
   against what it WOULD have cost with no caching (input_tokens at full rate every turn).
   Report the % savings — expect roughly 60-70% off input cost on a multi-turn conversation.
3. Run __tests__/e2e/personaMatrix.test.js (or a representative subset) and confirm RESPONSES
   are unchanged — caching is billing-only and must not alter output.
4. Confirm api_usage_logs rows now contain cache token columns with sensible values.

Report: per-turn cache hit pattern, measured % savings, and confirmation that outputs and
tests are unaffected.
```

---

## Notes / gotchas to watch

- **Header may be unnecessary if caching is GA** — check current Anthropic docs first.
- **Minimum cacheable length:** Anthropic enforces a minimum prefix size (historically ~1024
  tokens for Sonnet). Tiny system prompts won't cache — that's fine, they're cheap anyway.
- **Prefix must be byte-identical** — Prompt 0 exists to guarantee this. A single injected
  timestamp silently kills the cache hit (no error, just full price). Watch for it.
- **5-min TTL** — a user who sends messages minutes apart still benefits; a user returning
  hours later re-pays the write once. Expected and fine.
```
