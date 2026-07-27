# Handoff: IFS chat intro/button fix + 6 F's guidance + NS-mapping drawing buttons

## Task
User reported two IFS-chat issues (and asked to check other conversational areas):
1. The "Learn More About IFS First" button jumped into a parts-work conversation
   ("there's a part of you that wants to know more...") instead of explaining IFS.
2. The AI jumped too fast to "what does this part want?" — weak structure around the
   6 F's, exiles, and unburdening.

## Root cause (bug 1)
In `enhanced-components/IFSPartsWorkChatWithContext.js`, initial `currentPhase` was
hardwired to `'check_in'`, but `handleOptionSelect` guarded the intro buttons on
`currentPhase === 'intro'` (never set). Taps fell through every branch to a catch-all
`handleSendMessage(option)` that sent the literal button label to the AI as if typed.

## What was done (committed `d6287f3` on `feat/neurobiology-of-connection`)
- **IFS chat** (`enhanced-components/IFSPartsWorkChatWithContext.js`): intro is now its
  own phase; 3 buttons — "Explain it to me & discuss" (new `handleLearningQuestion`,
  calls `huxleyService.chat(q, { mode: 'general' })` so it explains instead of running
  parts work), "Explore the learning modules" (`navigation.navigate('Learn',
  { selectedTopicId: 'ifs_basics' })`; falls back to stay-and-discuss when no navigation
  prop, e.g. embedded under EducationScreen), "Start working with a part" (new
  `beginSession()` that sets ifs mode + loads parts). Free-text in the `learning` phase
  routes to the Q&A, not parts work.
- **IFS prompt** (`lib/huxleyModeConfigs.js`, `ifsMode.systemPrompt`): 6 F's rewritten as
  an ordered roadmap WITH pacing guardrails, a real Feel-Toward gate, and an
  exiles/unburdening section. Kept fluid, not rigid (per user).
- **IFS handler** (`lib/modeHandlers/IFSModeHandler.js`, `_getPhaseGuidance`): tightened
  `fleshOut`/`feelToward`/`unblend`/`befriend` strings so later-phase questions stop
  surfacing early. No state-machine changes (user scoped to prompt+guidance only).
- **NS mapping** (`components/ConversationalNervousSystemMapping.js`): drawing buttons
  were gated on phase `'drawing_prompt'` but the handler emits `'drawing'` — so
  "Show Drawing Guide" / "I'm Done Drawing" never appeared. Fixed the gate (line ~272).

## Sibling-chat audit (findings only, no leak like IFS)
- SAFE: `components/HuxleyChatScreen.js` (value-based quick replies),
  `screens/PhilosophicalTalkthroughScreen.js` (options are dialogue continuations),
  `screens/ActiveImaginationScreen.js` (every button has an explicit literal guard;
  checked phases are genuinely set),
  `components/ConversationalRegulatingResources.js` (buttons send natural sentences by
  design, not labels).
- `components/NervousSystemCheckin.js` — form, not a chat. N/A.

## UPDATE 2026-07-26 — Experience-tier onboarding landed (commit `cac424b`)
Follow-on to this thread: the IFS check-in now adapts its opening message to the
user's history (new = full teaching intro; returning = terse welcome + up to 5
saved parts). Verified WITHOUT a device — logic + copy extracted to
`lib/ifsCheckIn.js` as pure functions and unit-tested (`__tests__/lib/ifsCheckIn.test.js`,
11 tests, all green).
- **Threshold decision (user-approved):** `isExperiencedUser = savedPart>0 || sessions>=2`.
  A single stray prior session is deliberately NOT enough to drop the teaching intro
  (bias to "new" — under-explaining loses a novice). Fallback path defaults to new.
- `getRecentSessions` confirmed to always return an array (safe `.length`).
- Component (`enhanced-components/IFSPartsWorkChatWithContext.js`) refactored to import
  the two helpers; inline copies removed; parses clean via `@babel/core`+`babel-preset-expo`.
- Sits on the same branch as `d6287f3`, so it rides PR #1.
- One non-blocking tone nit left as-is: "trailhead" is defined for new users but assumed
  known in the two returning-user branches.

## Current state
- Branch: `feat/neurobiology-of-connection`, pushed to origin.
- **PR #1 open into `master`**: https://github.com/somanoetic/psychedelic-integration-app/pull/1
- Files in commit `d6287f3`: the 4 code files above + `LOG.md`.
- All edited files parse clean (Babel + Expo preset). NOT device-tested.
- Many unrelated parallel-session changes remain uncommitted in the working tree
  (spell-check, intention keyboard, etc.) — left untouched.

## What's next
- Device-test: IFS intro → each of the 3 buttons behaves; "Explain & discuss" stays
  educational (no parts-work leak); typing a question in that phase gets an educational
  answer. NS mapping → reach the drawing phase, confirm both buttons now show.
- Optional: `/code-review` the PR diff before merging; PR is large (whole neuro branch).
- Memory written: `project_ifs_chat_intro_and_6fs`.

## Related (separate, NOT this task)
- Neurobiology of Connection status: Learn article + RAG fixes SHIPPED (on this branch,
  commits `cac5cfb`/`319c292`). "Personal Connection Plan" interactive exercise is
  SPEC-ONLY, not built — `context/features/personal-connection-plan-exercise.md`.
  Possible open item: a Supabase reindex for the ingested book (manual, unverified).

## Resume
Read handoffs/ifs-chat-intro-and-6fs.md and continue.
