# Handoff: IFS chat — channels of noticing (de-somaticising find/focus/fleshOut)

## Task
User device-tested the IFS chat and reported it "keeps pushing into 'where do you notice
that in the body' and other somatic terms too much." Their clinical framing: FIND should
work off problems, behaviors, emotions etc., but the chat only offered body/somatic ways
to notice and flesh out a part. Parts aren't always somatic — memories, thoughts, colors,
voices, visions are equally valid, and having multiple channels is key to identifying and
**differentiating** parts.

## Root cause — structural, not just tone (3 layers)
1. **Hard phase gate.** `IFSModeHandler._tryAdvancePhase()` advanced `find` → `focus` ONLY
   when `part.location` was set, and `focus` → `fleshOut` only on `appearance || description`.
   A part identified via a memory/voice/behavior never satisfied the gate, so the handler
   stayed in `find` and re-injected "help the user locate where this part lives in the body"
   into the prompt every single turn. That's the loop the user hit.
2. **Body-only phase guidance.** `_getPhaseGuidance()` strings for find/focus/fleshOut named
   only body location and sensations/images/colors/temperature/shape.
3. **systemPrompt.** `ifsMode.systemPrompt` defined FOCUS as "where is it in/around the body?"
   and a pacing guardrail explicitly elevated somatic noticing as "how the person actually
   contacts the part."

**Hidden 4th problem found while fixing:** the `---THERAPEUTIC_DATA---` extraction schema in
`huxleyService._getStructuredOutputInstructions()` only ever emitted `name`/`role`/`notes`.
No channel data (not even `location`) ever reached the handler — so the gates would have
stalled even after the logic fix. Had to extend the schema too.

## What was done (committed `4e24756` on `feat/neurobiology-of-connection`)
Three files, 150 insertions:

- **`lib/modeHandlers/IFSModeHandler.js`**
  - New channel helpers: `_channelFields()`, `_channelsPresent()`, `_channelsMissing()`,
    `_channelCount()`, `_hasAnyChannel()`. Ten channels mapped to part fields:
    body/location, sensation, behavior, emotion(feelings), thought(thoughts), voice,
    memory, image(appearance), age, urge. `description` counts as a catch-all in
    `_hasAnyChannel`.
  - Gates rewritten: `find` → `focus` on ANY channel; `focus` → `fleshOut` on a 2nd channel
    OR role/feelings.
  - `_getPhaseGuidance()` for find/focus/fleshOut now injects established vs unexplored
    channels and a "do NOT ask another body-location question" warning once body/sensation
    is covered; tells the model to switch channels on a thin answer and vary channel per turn.
  - Channels flow through `getModeContext().partsDiscovered[].channels`,
    `_summarizePartKnowledge` (knownSoFar), the find/focus `_generatePhaseSummary` strings,
    and `getSessionSummary().partsDiscovered[]`.
  - `_updateStateDocument` topic lists for find/focus de-somaticised.

- **`lib/huxleyModeConfigs.js`** (`ifsMode`)
  - New **CHANNELS OF NOTICING** block in `systemPrompt` naming the failure explicitly, listing
    all channels with example questions, and giving rules: offer several rather than
    interrogate one; follow the channel they answer in and don't translate it back into a body
    question; drop a channel that returns a thin answer; never ask body location twice in a
    row; vary channel across turns; channels are how parts get differentiated.
  - FOCUS/FLESH OUT lines in the 6 F's roadmap rewritten off body-only.
  - Removed the guardrail sentence elevating somatic noticing; added "a part is real and
    workable even if the person can never locate it in their body."
  - Three somatic-worded `fallbacks` (find/findLocation/focus) reworded to offer channels.

- **`lib/huxleyService.js`** — extraction schema gains a "parts CHANNEL FIELDS" rule listing
  the ten fields, with explicit "include only what the user actually revealed, never guess."

## Verification
Temporary Jest suite (written, run green, then deleted — was `__tests__/tmp/ifsChannels.test.js`):
5 tests covering thoughts-only part advancing, behavior-only part advancing, the somatic path
still working, guidance emitting the no-repeat-body warning + missing-channel list, and
channels surfacing in modeContext/getSessionSummary. Existing IFS suites (`ifsCheckIn`,
`huxleyKnowledgeBase`) still pass — 64 tests.

**User device-tested after the change and said "much better."** Then asked to commit.

## Current state
- Branch `feat/neurobiology-of-connection`, commit `4e24756`. **NOT pushed.**
- Note: the first commit attempt used a PowerShell `@'...'@` here-string inside the Bash tool,
  which put a literal `@` in the subject line; amended via `git commit --amend -F -` with a
  heredoc. Use heredocs, not PS here-strings, in the Bash tool.
- Deliberately left uncommitted (pre-existing, from the earlier TestFlight session, NOT this
  work): `LOG.md` 2026-08-01 entry, untracked `handoffs/testflight-ota-channel-fix.md`.
  This session's `LOG.md` entry is also uncommitted.
- `enhanced-components/IFSPartsWorkChatWithContext.js` has its own separate `location` display
  — untouched, already falls back to "Noticed in your system", nothing broken there.

## What's next / open items
- Push the branch (PR #1 into `master` is open from earlier work on this branch).
- **Main thing to watch on further device testing:** `_channelsPresent` depends on Claude
  actually populating the new channel fields in the delta-only extraction block. If phases
  advance more slowly than expected, that's the extractor under-reporting, not the gate logic
  — check the `parts` JSON in the dev log to tell which layer is short.
- Persona matrix (`__tests__/e2e/personaMatrix.test.js`) not re-run against the new prompt.
- The `ragFraming` for `ifsMode` is still felt-sense-led (`'felt sense in the body'`,
  `'sensation'`). Unchanged and corpus-verified, but if RAG results start skewing somatic for
  voice/memory/behavior-led sessions, that's the next place to look. See
  `handoffs/rag-query-expansion.md`.

## Related prior threads (context, not this task)
- `handoffs/ifs-chat-intro-and-6fs.md` — the 6 F's roadmap + pacing guardrails this session
  edited; also the intro-button fix.
- `handoffs/rag-query-expansion.md` — why `ragFraming` is worded the way it is.

## Resume
Read handoffs/ifs-channels-of-noticing.md and continue.
