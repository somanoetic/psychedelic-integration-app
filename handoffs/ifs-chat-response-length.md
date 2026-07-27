# Handoff: IFS chat response length (brevity) + extraction-JSON size

## Task
IFS chat replies were too wordy — real-device turns generated out=423–490 tokens,
driving claude=6–7s/turn (non-streamed, user waits the full time). Goal: tighten
reply LENGTH for both latency and clinical voice (spacious IFS pacing), WITHOUT
touching crisis detection, cache-prefix structure, the 6 F's logic, or the intro
flow. See `handoffs/ifs-chat-intro-and-6fs.md` for the 6 F's work (settled, do not undo).

## What was done (NOT committed — awaiting final piece + on-device re-test)
Branch: `feat/neurobiology-of-connection`

1. **Brevity instruction** — `lib/huxleyModeConfigs.js`, `ifsMode.systemPrompt`,
   RESPONSE STYLE block (~line 199). Rewrote from soft "2-4 sentences typically" to
   "1-3 short sentences, one reflection OR one question not both, trust silence,
   don't stack." Added a WHEN A LONGER REPLY IS RIGHT exception block (first-time
   teaching / crisis grounding / session close), exception-shaped so it doesn't
   become the default. Lives in the STABLE cached prefix (assembled at
   `lib/huxleyService.js` `_buildSystemPrompt` ~line 600) — cache-safe by design.
   **VERIFIED on-device: voice is good, user signed off.** Replies dropped to
   73–292 chars (~15–70 words).

2. **maxTokens 500 → 700** — same file, `ifsMode.maxTokens` (~line 115). The 500
   cap was a SHARED budget for reply + the appended `---THERAPEUTIC_DATA---` JSON.
   The JSON accumulates across a session ("include all themes/parts") and was
   truncating mid-object on later turns → `JSON Parse error: Unexpected end of
   input` + silent extraction data-loss. 700 gives headroom. **VERIFIED: no parse
   warnings after the change.**

3. **Temporary PERF instrumentation** — `lib/huxleyService.js` in the `__DEV__`
   `[Huxley PERF]` log (~line 372). Splits the raw response on the marker and logs
   `reply=<chars> json=<chars>`. This exists because `out=` conflates reply + JSON
   and can't measure prose brevity. **Marked temporary — remove once length work is
   done.**

## Key finding (this is the important part for next session)
The extraction JSON (`---THERAPEUTIC_DATA---` block, appended to every reply) is
~1800 chars / ~450 tokens EVERY turn — 6–13× the size of the actual reply — and it
GROWS across the session (1791→1893c observed). THIS, not the reply, is what holds
claude= at ~7s. Root cause: `_getStructuredOutputInstructions()` in
`lib/huxleyService.js` (~line 795) tells the model to "Accumulate across the
conversation / Include all themes/parts" — so it re-transmits the entire growing
state every turn. But this is REDUNDANT: the app already accumulates + dedups
model output in `_updateTherapeuticState` (~line 870), persists it to Supabase
`therapeutic_context` (save ~line 431, load ~line 174), and re-injects it into the
next prompt via `_buildSharedContext` (~line 711). The model re-sending it updates
nothing. Anthropic stores NOTHING server-side — all "memory" is app-side (in-memory
`therapeuticState`, Supabase table, and the prompt's shared-context block).

## On-device metrics (2026-07-14 session, feat/neurobiology-of-connection)
reply=73–292c | json=1791–1893c | out≈494–556 | claude≈6.5–7.6s | cache read=6998 held.
(One turn showed claude=144787ms — that was Metro/network dropping, NOT the model.)

## What's next (AGREED, not started)
**Option A — delta-only extraction (do this first).** Edit the two rules in
`_getStructuredOutputInstructions()` (`lib/huxleyService.js` ~line 811-812):
change themes/parts from "accumulate all / include all" → "only NEW or CHANGED
this turn." Keep JSON SHAPE identical (parser at ~line 836 and merge at ~line 870
are untouched — merge already handles push-new / spread-update). Expected: json=
~450 tokens → ~30-100 active / ~10 quiet turns; claude= drops with it. Cache-safe
(prefix unchanged). This likely makes decoupling unnecessary.

Then RE-TEST on-device, compare json= and claude= vs. the numbers above, and only
THEN decide whether to also decouple (background extraction call) — probably moot
if json= is small.

## Follow-up filed / to file (do NOT scope-creep into this pass)
Scaling issue the user surfaced: as a user's parts/themes "file" grows, the
`_buildSharedContext` block (parts re-injected into every prompt, ~line 717-737)
grows too — re-sent as INPUT every turn. Themes are capped at 20 (~line 881) but
PARTS are NOT capped. Impact is mainly COST (input is cheap + barely affects
latency; output drives the 7s), and only for heavy long-term users. Right fix:
inject active-part + a few recent parts, not ALL parts; keep full roster in
Supabase. File as `context/features/` or a bug; tackle when real user files get big.

## Housekeeping before commit
- Remove (or gate) the temporary `reply=/json=` PERF instrumentation once length is
  dialed in — OR keep it if useful; decide with user.
- Nothing committed this session. All changes on working tree only.

Read handoffs/ifs-chat-response-length.md and continue.
