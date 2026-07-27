# Handoff: Triggered Support back arrow pops whole screen

## Status: CLOSED — committed `8838406` (2026-07-26), tester-confirmed. No open items.

## Task
Beta tester reported: in the "Triggered Support" screen, the back arrow goes all the
way back to the Huxley main screen instead of back one level. Specifically, after
drilling into a resource/exercise, tapping back exited the entire screen rather than
returning one conversational step.

## Root cause
`components/ConversationalTriggeredSupport.js` is a SINGLE React Navigation screen with
an internal multi-step conversation tracked by `conversationStep` state
(`initial` → `safety_check` / `grounding` / `support_options` → `exercise`). The header
back arrow and every "Go back home" button called `navigation.goBack()`, which pops the
whole screen off the stack — so from a deep step it jumped all the way out.

## What was done
All in `components/ConversationalTriggeredSupport.js`:
- Added a `stepHistory` state array (breadcrumb of visited steps).
- Added `goToStep(next)` — pushes current step to history before advancing. All forward
  transitions now use it (previously bare `setConversationStep`).
- Added `goBackStep()` — pops one level; only calls `navigation.goBack()` (leaves the
  screen) when already at `initial` (history empty).
- Header back arrow now calls `goBackStep`.
- In-flow "Go back" buttons rewired to `goBackStep`; relabeled "Go back home" → "Go back"
  (with `arrow-back` icon) to match level-by-level behavior.
- Added an Android `BackHandler` effect so the hardware/gesture back also steps back one
  level (returns `false` at `initial` to let the OS pop normally). Effect deps:
  `[stepHistory, conversationStep]`.
- "I feel better" resets the flow: clears history + sets step to `initial`.
- Left untouched: cross-screen `navigation.navigate()` calls (TriggerTracker, IFSChat,
  Journal, ExerciseLibrary, FindSupport) — those are correct real navigations.

## Current state
- Branch: `feat/neurobiology-of-connection`
- Files touched: `components/ConversationalTriggeredSupport.js` (NOT yet committed),
  `LOG.md` (this wrap)
- Pre-existing uncommitted changes left untouched: `.claude/settings.json`
- Tester CONFIRMED the fix works ("works"). Not device-tested by us; Android hardware-
  back path in particular was not independently verified on a device.

## What's next
- Commit the change (user was asked, then ran /wrap — still uncommitted). Suggested msg:
  `fix(triggered-support): back steps one conversational level instead of exiting screen`
- Optional: quick Android device check of the hardware-back behavior.

## Resume
Read handoffs/triggered-support-back-nav.md and continue.
