# Handoff: Prompt-Caching Prefix Stability Audit

## Goal
Before enabling Anthropic prompt caching, determine whether each live AI service's
`system` string forms a byte-stable cacheable prefix. Audit only — no code changes
this session.

## What was done
- Read all live AI services and the proxy/RAG plumbing.
- Classified every dynamic value injected into each `system` string as STATIC
  (session-stable) vs VOLATILE (per-message).
- Produced a per-service verdict on prefix cache-stability.
- Identified that most `lib/*AIService.js` files are DEAD code (superseded by
  `huxleyService`) and not worth caching.

## Key files (where things live on disk)
- `lib/huxleyService.js` — primary service; prompt built in `_buildSystemPrompt`
  (~line 399). Layers: identity → shared context → exercise catalog → mode prompt
  → phase/mode-context → handoff → crisis/scenario protocols → RAG → structured-output.
- `lib/huxleyModeConfigs.js` — `HUXLEY_IDENTITY` constant + per-mode `systemPrompt`
  constants (all static).
- `lib/conversationalRoutingService.js` — `getSystemPrompt()` (~line 43) is fully
  static; `getEnhancedSystemPrompt()` (~line 200) appends per-message scenario protocols.
- `lib/ragService.js` — `getContextForPrompt()` returns per-message retrieved chunks
  (the main volatile injection in Huxley).
- `lib/claudeProxyService.js` — `sendMessage` passes `system` as a plain string
  (line ~38); no `cache_control` wiring yet.
- `lib/paperScanService.js` — vision calls; system prompts static per worksheet type,
  low caching value.

## Current state
- Branch: `master` (pre-existing uncommitted changes in working tree, unrelated to
  this audit). This session created only `LOG.md` and this handoff — no source edits.
- Findings summary:
  - **huxleyService**: NOT cache-stable. Volatile content (phase line, mode-context
    JSON, crisis/scenario protocols, per-message RAG chunks) is interleaved into the
    middle of `system`. Cacheable prefix would be identity + catalog + mode prompt +
    structured-output instructions, once volatile layers move to the user message.
  - **conversationalRoutingService**: base prompt is fully static, but per-message
    scenario protocols are appended to `system`. Move those to the user turn; cache
    the static base.
  - **paperScanService**: stable per call-type/worksheet but low value (one-shot,
    image-dominated). Optional.
  - All other `*AIService` / `claudeService` / `enhancedClaudeService` etc.: DEAD,
    skip. `voiceService`: no LLM chat.

## Known issues / gotchas
- In Huxley, `mode` is part of the prefix — switching modes mid-session changes the
  cached prefix (fine: one cache entry per mode, as long as each is internally stable).
- Layer 2 "shared context" is session-stable but rebuilds when the model writes new
  themes/parts; acceptable inside the cached prefix (rare invalidation) or move just
  after the breakpoint.
- Caching requires `cache_control` to be threaded through `claudeProxyService` AND the
  `claude-proxy` Supabase edge function — neither currently supports it.

## What's next
1. Refactor `_buildSystemPrompt` to emit (a) a stable cached prefix and (b) a volatile
   tail injected into the user message instead of `system`.
2. Do the same for `conversationalRoutingService`: cache `getSystemPrompt()`, move
   detected-scenario protocols into the user turn.
3. Wire `cache_control` breakpoints through `claudeProxyService.sendMessage` and the
   `claude-proxy` edge function.
4. Verify cache hit rate (the `/code-review` or a manual proxy-metadata check).

## Resume
Read handoffs/prompt-cache-audit.md and continue.
