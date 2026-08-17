# Handoff: Huxley cross-session memory (events + session summary + main-chat wiring)

**Status: `a83aa29` COMMITTED but was INCOMPLETE — device testing on 2026-08-17 found main
chat could read memory but never write it. Write-side fix built same day (below),
tests green (61/61 across the two affected suites, 419/419 full lib suite), and
device-verified working 2026-08-17 ✅. Ready to commit — UNCOMMITTED.**

Supersedes earlier revisions of this doc, which described the work as uncommitted and the
denylist test as deferred.

## 2026-08-17: main chat had no write path at all

Device testing (per "What's next" #1 below) surfaced the expected symptom: user
mentioned a breakup and work frustration in main chat, came back, asked what Huxley
remembered — it had no record, and surfaced attachment-reflection material instead.

Root cause was narrower than a bug in the `a83aa29` wiring: that commit built the READ
side for main chat (`buildUserContextBlock`, loading on login) but never built a WRITE
side. `conversationalRoutingService.getAIResponse()` called `callClaude` with a plain
300-token budget and no structured-output request at all — nothing was ever extracted
from what was said in main chat, only from the specialized modes (IFS, attachment,
etc.) via `huxleyService`. The two chat systems described at the top of this doc are
still two systems; only one of them wrote memory, same as the original bug, just one
layer further in.

Fixed in `lib/conversationalRoutingService.js`:
- Added `_getMemoryExtractionInstructions()` — a scoped-down version of
  huxleyService's structured-output block (`majorEvents` + `sessionSummary` only, no
  themes/parts/NS state — those stay the specialized modes' job), appended to
  `getSystemPrompt()`.
- Raised `max_tokens` 300 → 500 so the JSON tail has room without risking truncation.
- Added `_parseMemoryExtraction()` (mirrors `huxleyService._parseResponse`), called
  before the existing `ROUTE:` regex so route parsing only ever sees clean text.
- Added `_updateAndSaveUserContext()` — merge logic (dedup on label, FIFO cap 15,
  summary cap 600 chars, coarse-grain enforced by rebuilding fields rather than
  spreading) mirrors `huxleyService._updateTherapeuticState` exactly, since both now
  write the same table.
- `loadUserContext` now stores `this.userId` and tracks its own promise
  (`this._loadPromise`); `_updateAndSaveUserContext` awaits it before merging, so a
  message sent in the small window before the login-time load resolves can't merge
  against `{}` and clobber already-saved events.
- The write deliberately **omits** `themes`/`parts` from the row entirely, relying on
  Supabase `upsert`'s partial-`SET` behavior on conflict to leave those columns
  untouched (they fall back to their column defaults only on a genuine first-ever
  insert). Uses `upsert(row, { onConflict: 'user_id' })`, not `insert`, since
  `therapeutic_context` has `UNIQUE(user_id)` and main chat may now create the row
  before any specialized mode does.
- `jest.setup.js`: added `upsert` to the global Supabase mock (was missing; every
  other verb was mocked).
- Test coverage added: 6 new cases in `conversationalRoutingService.test.js` (strip
  tail from visible message, ROUTE: still parses alongside a memory tail, merge +
  persist, dedup, no-userId no-op) plus a new denylist case in
  `crossModeMemoryDenylist.test.js` covering this write path specifically — the
  existing denylist file predates this write path and only covered huxleyService's.

## Task
User logged in, asked Huxley to continue "what we discussed last time", and was told there
was no memory of previous conversations. Expected memory to exist.

## Root cause
There are **two independent chat systems**, and only one had memory:

- `lib/huxleyService.js` — the specialized modes (IFS, NS mapping, attachment, etc.).
  Already loaded/saved `therapeutic_context` per user and injected themes/parts/NS state
  into the prompt. Memory worked here.
- `lib/conversationalRoutingService.js` — the **main chat screen** the user actually lands
  on after login (`components/HuxleyChatScreen.js`). Static system prompt, in-memory
  history capped at 20 turns, nothing loaded from Supabase, nothing persisted. **No memory
  at all.** Its own comment at `_trimHistory` claimed long-term context "lives in
  masterContext + therapeutic_context" — an intent that was never wired up.

The reply was therefore honest: in that screen Huxley genuinely had zero user context.

## Decisions made by user (asked explicitly)
1. **Event grain: coarse label only** — `{label, surfaced_at, mode}`, no verbatim detail,
   no clinical interpretation. Not a clinical record (ADR-009 wellness posture).
2. **Surfacing: "may gently reference"** — Huxley can mention an event briefly, then must
   follow the user's lead and drop it. Not "never unprompted".
3. **Scope: main chat + all modes.**

Note the interaction: because only a coarse label is stored, a "gentle reference" is
gentle by construction — there is no detail available to elaborate with.

## What shipped in `a83aa29` (7 files, +583)

All six steps of the original plan, including step 6 (the denylist test) that earlier
revisions had deferred.

1. **Migration** — `supabase/migrations/20260814000001_therapeutic_context_events_summary.sql`
   **APPLIED 2026-08-16** (all three columns verified present on the live schema).
   Adds `major_events` JSONB, `session_summary` TEXT, `last_session_at` TIMESTAMPTZ.
   Existing RLS policies are table-scoped and already cover the new columns.
   `increment_session_count()` counts event changes but deliberately **not** summary
   changes — the summary rewrites nearly every turn, so counting it would turn
   `session_count` into a turn counter.
2. **Extraction schema** — `huxleyService._getStructuredOutputInstructions()`. The event
   bar is "would it be jarring to open breezily next session without knowing this?" so it
   doesn't swallow ordinary difficult feelings (themes already cover those).
   `sessionSummary` is explicitly **not** delta — full rewrite each turn.
3. **Persistence** — `huxleyService` `therapeuticState` + `_updateTherapeuticState`,
   `_loadPersistedContext`, `_savePersistedContext`. Events dedup on lowercased label,
   FIFO cap 15 (mirrors the 20-theme cap); summary capped 600 chars.
4. **Prompt surfacing** — `huxleyService._buildSharedContext()`: `SIGNIFICANT EVENTS` and
   `WHERE YOU LEFT OFF` blocks plus surfacing rules, with `_describeRecency()` rendering
   "yesterday" / "3 weeks ago".
5. **Main chat wiring** — `conversationalRoutingService` (`loadUserContext`,
   `clearUserContext`, `buildUserContextBlock`, `_describeRecency`) + **both** login paths
   in `App.js`, with `clearUserContext()` on logout so a second account on the same device
   can't see the first user's context. Also added a `## MEMORY ACROSS SESSIONS` section to
   that service's system prompt — without it the model doesn't know it has memory, and the
   reported symptom would likely have persisted even with data loaded.
6. **Denylist test** — `__tests__/lib/crossModeMemoryDenylist.test.js` (7 tests, green).

### Two placement/enforcement details worth not breaking
- **Memory goes in the USER turn, not the `system` block.** The routing service's system
  block carries `cache_control: ephemeral`; per-user content there busts the cached prefix
  every turn. Same reasoning as huxleyService's volatile tail, same pattern already used
  for `protocols`.
- **Coarse-grain is enforced in code, not just the prompt.** `_updateTherapeuticState`
  rebuilds each event field-by-field rather than spreading the model's object, so an
  invented `detail`/`quote`/interpretation key is dropped rather than persisted.

## The denylist test — what it guards and why

`major_events` and `session_summary` are read by **every mode and the front door**, making
them the widest surface in the app for AAI practitioner-only material (`backendPattern`,
`_patternSignals`) to leak. The pre-existing guardrail test in
`attachmentInterviewHandler.test.js` only covers AAI's *own* model-facing context, which
does not help if the pattern escapes via shared memory into an IFS conversation instead.

The test drives a real AAI reflection to completion so the denied values are genuine
handler output, then asserts three surfaces: `_updateTherapeuticState` (in-memory), the
`_savePersistedContext` payload (durable, survives logout), and `buildUserContextBlock`
(front door). It also denies the pattern *vocabulary*, so a leak that renamed the key still
fails, and includes a "guards the guard" case asserting the fixture really produces the
material — without it, every other assertion would pass vacuously if AAI stopped emitting it.

**Verified to actually fail:** reverting the field-by-field rebuild to a naive spread turns
3 of the 7 red, including the durable-write case. The two front-door cases stay green by
design — they inject an already-contaminated row, so they are independent of that path.

Note the limit: this covers **code paths only**. What the model chooses to write into
`sessionSummary` while in AAI mode is prompt-governed and no unit test can reach it —
hence the manual cross-mode check below.

Test needs `expo-constants` mocked (huxleyService reaches it transitively via `config`);
Supabase is already mocked globally in `jest.setup.js`.

## Current state
- Branch `master`, commit `a83aa29` on top of that (READ side only). **Not pushed** —
  hold still in force, see `WHERE-WE-ARE.md`.
- The 2026-08-17 WRITE-side fix (above) is **UNCOMMITTED** — new changes in
  `lib/conversationalRoutingService.js`, `jest.setup.js`,
  `__tests__/lib/conversationalRoutingService.test.js`,
  `__tests__/lib/crossModeMemoryDenylist.test.js`.
- Working tree still holds other unrelated in-flight threads (`CravingTracker.js`,
  `.claude/settings.json`, context docs). **Do not assume those are part of this change.**
  The attachment/AAI resume thread is now its own separate, ready-to-commit unit — see
  `handoffs/attachment-reflection-resume.md`.
- Tests: `npx jest __tests__/lib/` → **419/419 pass, 13/13 suites green** (re-run
  2026-08-17 after the write-side fix; the previously-flaky `intentionGuidanceAIService`
  timeouts did not recur this run).
- **`git stash pop` does not fully apply in this repo** — it restored untracked files and
  left tracked ones behind. Recovery in `WHERE-WE-ARE.md` §5. Prefer copying files aside
  over stashing.

## What's next
1. **Commit the write-side fix — START HERE.** Suggested:
   `fix(huxley): give main chat a write path for cross-session memory`. Stage only the
   four files listed under "Current state" above.
2. ~~**Device-verify in main chat**~~ — ✅ done 2026-08-17: a main-chat-only event
   (breakup + work frustration) was correctly surfaced back in a later session.
3. **Read the row directly, don't trust the chat output** (still worth doing once, not
   yet confirmed this way). `select major_events, session_summary, last_session_at,
   session_count from therapeutic_context where user_id = auth.uid();` — entries must
   be `{label, surfaced_at, mode}` only, and the main-chat-surfaced event should show
   `mode: "main_chat"`. Three or more after one conversation means the bar is too low
   and the extraction prompt needs tightening.
4. **Second account, same device.** The unit test covers `clearUserContext()`; this covers
   the `App.js` wiring.
5. **Cross-mode by hand.** Run an attachment reflection, then open main chat and ask what
   it remembers — the prompt-governed leak vector the test cannot reach. Also try the
   reverse now that main chat writes too: mention something in main chat, then open a
   specialized mode and ask what it remembers.
6. **Confirm the cache didn't regress.** `[Claude Proxy] Cache` dev log, `read>0` on
   follow-up turns — see the prompt-caching memory note. Note main chat's `system` block
   is unchanged in content shape (just longer, plus `max_tokens` 300→500), so this should
   be low-risk, but worth a glance.
7. **No "forget this" UI.** Durably stored personal events with no user-facing way to see
   or delete them. More pressing now than it was for themes.
8. **Known lost-update race, accepted for now:** two rapid-fire main-chat messages could
   both read the same in-memory `userContext` snapshot and the second write could
   overwrite the first's newly-added event. Same shape of risk already accepted in
   huxleyService's own checkpointing (merge from in-memory state, no read-before-write
   each turn) — not a new risk class introduced here, just worth knowing about if events
   ever seem to go missing after fast back-to-back turns.

## Related
- `handoffs/WHERE-WE-ARE.md` — cross-thread snapshot; the hold decision and OTA facts.
- `context/features/cross-modality-memory.md` — the mode↔mode sharing spec. **Different
  problem**; that one is attachment→IFS carry-forward. The denylist test is where they meet.
- ADR-009 (non-HIPAA wellness posture) drove the coarse-grain decision.

---
Read handoffs/huxley-cross-session-memory.md and continue.
