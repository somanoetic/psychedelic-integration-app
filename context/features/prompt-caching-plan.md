# Implementation Plan — Prompt Caching for the Claude Proxy

**Status:** Planned (plan only — no code changes yet)
**Created:** 2026-06-02
**Priority:** High (≈3× AI margin improvement; biggest single cost lever)
**Effort:** Small (1 chokepoint: proxy client + edge function)
**Parent:** `context/business/cost-model.md`

---

## 1. Problem

Codebase grep (2026-06-02) found **no prompt caching** anywhere — `cache_control`,
`ephemeral`, the `prompt-caching` beta header: zero matches across all 35 AI services.

Every Huxley message therefore pays the full **$3.00/M input** rate for a prefix that barely
changes between turns (system prompt + `HUXLEY_IDENTITY` + retrieved RAG chunks). With
prompt caching, repeated reads of that prefix cost **$0.30/M** (10× cheaper).

**Impact:** typical message cost drops **~$0.022 → ~$0.008**. Roughly triples per-user
margin and pulls heavy users back toward profitable (see cost-model.md §3).

---

## 2. How Anthropic prompt caching works (mechanics)

- You mark a content block with `cache_control: { type: "ephemeral" }`.
- Anthropic caches everything **up to and including** that block (the prefix).
- Next call with an identical prefix → those tokens billed at the **cache-read** rate
  (~10% of input price); cache **writes** cost ~25% more than base input (one-time per
  prefix). Net win whenever the prefix is reused ≥2×.
- Default TTL ~5 min (refreshed on each hit). Fine for a live conversation; a user sending
  several messages in a session reuses the warm cache repeatedly.
- Cache key = exact prefix bytes. **Order matters:** put the MOST static content first
  (identity), then semi-static (RAG context for this session), then the volatile turns.

---

## 3. Where the change goes (single chokepoint)

All AI traffic funnels through:
`lib/claudeProxyService.js` → Supabase Edge Function `claude-proxy` → Anthropic API.

So the change is centralized:

### 3a. `claudeProxyService.js` (client)
Currently passes `system` as a plain string (line ~38). Allow callers to pass a
**structured** system prompt (array of blocks) OR keep the string and let the edge function
wrap it. Recommended: keep the client API string-based for callers, and do the block-wrapping
server-side so no caller has to change.

### 3b. `claude-proxy` edge function (server) — the real work
1. Add the beta header to the Anthropic request:
   `anthropic-beta: prompt-caching-2024-07-31` (verify current header string at build time).
2. Convert the incoming `system` string into a blocks array and tag the stable tail with
   `cache_control`:
   ```
   system: [
     { type: "text", text: <static system + HUXLEY_IDENTITY>,
       cache_control: { type: "ephemeral" } }
   ]
   ```
3. If RAG context is sent per-session and reused across turns, make it its own cached block
   placed BEFORE the conversation messages (a 2nd breakpoint is allowed; Anthropic permits up
   to 4 cache breakpoints).
4. Leave the rolling conversation `messages` UNcached (they change every turn).
5. Capture `usage.cache_creation_input_tokens` and `usage.cache_read_input_tokens` from the
   response and pass them back in `_proxy_metadata` so metrics can price them correctly.

### 3c. `metricsService.js` (cost accuracy)
Extend `CLAUDE_PRICING` and `estimateCost()` to account for cached reads/writes:
- cache write ≈ 1.25 × input rate (one-time)
- cache read ≈ 0.10 × input rate
Without this, the dashboard will OVER-state cost after caching ships (it'll bill cached
tokens at full rate). Needed for the cost-per-user dashboard to be truthful.

---

## 4. Prerequisite: stabilize the prefix

Caching only pays off if the cached prefix is **byte-identical** across calls. Audit for
prefix-busters:
- Timestamps, random IDs, or user names injected into the system prompt → move them OUT of
  the cached block (into the volatile messages) or remove.
- Per-message RAG that changes every turn → either cache per-session (retrieve once, reuse)
  or accept it's uncacheable and only cache the static system+identity portion.
- The legacy `lib/claudeService.js` passes system as a `user` message (line ~101) — if that
  path is still live, it can't benefit from `system`-block caching. Confirm dead/alive;
  migrate or delete.

---

## 5. Verification

1. Single conversation, 5 messages. Inspect `_proxy_metadata`:
   - Message 1: high `cache_creation_input_tokens`, ~0 read.
   - Messages 2–5: high `cache_read_input_tokens`, low creation.
2. Compare `estimateCost()` before/after on the same persona transcript — expect ~3× drop on
   input cost.
3. Run the persona matrix (`__tests__/e2e/personaMatrix.test.js`) — responses must be
   unchanged (caching is purely a billing optimization; output is identical).
4. Confirm cost dashboard reflects cached vs uncached split.

---

## 6. Out of scope

- Streaming (separate concern; proxy currently `stream: false`).
- Switching models (stay on Sonnet 4.6 per `project_model_consolidated_sonnet_4_6`).

---

## Links

- Cost model (impact figures): `context/business/cost-model.md`
- Proxy client: `lib/claudeProxyService.js`
- Pricing: `lib/metricsService.js`
- Model constants: `lib/aiModels.js`
