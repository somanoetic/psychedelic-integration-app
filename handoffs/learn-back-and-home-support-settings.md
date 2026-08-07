# Handoff — Learn hardware-back unwind + home support/settings icons

## Task
Two unrelated nav fixes raised this session:
1. In the Learn section, the Android system/gesture back button jumped straight
   back to Home instead of unwinding the Learn hub's internal levels.
2. The home greeting's SOS button opened the crisis-resources page (FindSupport)
   when it should open the grounding/triggered-support flow; and the home screen
   had lost its settings gear (never replaced) with no separate Support entry.

## Status: CLOSED — committed `ee8d79f` (2026-08-07 audit). NOT device-verified.

"feat(learn): all-topics cleanup, hardware-back unwind, home support/settings" —
one commit covering this doc and `learn-hub-all-topics-cleanup.md`. Working tree clean.
Residual: no device pass — fold into the next one.

## What was done (this session)

**1. Learn back button (`screens/EducationScreen.js` + `components/ConversationalEducation.js`)**
- Root cause: Learn is a single React Navigation Stack screen (`EducationScreen`,
  registered in `App.js`). Its three levels — greeting → category sub-page →
  topic/article — are component state, NOT nested navigation. The in-app "← Back"
  chrome steps through that state, but the hardware back only saw one stack entry,
  so it popped the whole screen to Home.
- `EducationScreen.js`: added imports `useCallback`, `BackHandler`, and
  `useFocusEffect` (from `@react-navigation/native`). Added a `useFocusEffect`
  hardware-back handler right after `handleTopicPress` that mirrors the in-app
  back logic: if `selectedTopic` → call `handleEducationComplete()` (back to
  category, preserving the deep-link `returnTo` behavior); else if
  `eduStep !== 'greeting'` → `setEduStep('greeting')`; else return false (let the
  system pop to Home). Deps: `[selectedTopic, eduStep, returnTo]`.
- `ConversationalEducation.js`: that component only read `initialStep` at mount,
  so a parent-driven reset to greeting was ignored while a category sub-page was
  showing. Added a `useEffect` keyed on `[initialStep]` that calls
  `setConversationStepRaw(initialStep)` when it changes and differs from current.
- iOS-safe: `BackHandler` only fires on Android; iOS has no hardware back and the
  swipe-back gesture is off here (`headerShown:false`, no custom gesture).
- Pattern matches existing usage in `screens/GuidedExerciseScreen.js` and
  `screens/TrackHubScreen.js`.

**2. Home SOS + bottom Support/Settings row (`components/GridHomeScreen.js`)**
- Decisions captured via AskUserQuestion: SOS → TriggeredSupport; two icons in the
  scroll content (not a pinned footer); Support icon → FindSupport. Follow-up
  decision: Settings gear visible to EVERYONE (Settings has Privacy/ToS/Export/
  Sign Out for all users; admin rows are gated inside `SettingsScreen` via
  `userRoleService.isAdmin()`), so no admin gating added on the home screen.
- Greeting SOS button `onPress` changed `navigate('FindSupport')` →
  `navigate('TriggeredSupport')`; a11y label "Crisis support" → "Triggered
  support". (TriggeredSupport itself links onward to FindSupport, so crisis help
  is still one tap deeper.)
- Added `Settings` to the `lucide-react-native` import (alongside existing
  `LifeBuoy`).
- New "bottom utility row" rendered after the tiles, before `bottomSpacer`: an
  `Animated.View` (`styles.bottomBar`, fades in with `tilesOpacity`) holding two
  `TouchableOpacity`s — Support (LifeBuoy → FindSupport) and Settings (Settings
  gear → Settings). Both routes confirmed registered in `App.js`.
- New styles: `bottomBar`, `bottomBarButton`, `bottomBarLabel`.
- After first look, sizes bumped: both icons 22 → 28; label fontSize 12 → 14,
  marginTop 4 → 6.
- Updated the stale top-of-render comment that claimed SOS/settings live only in
  the global FAB / chat header.

## Current state
- Branch: `feat/neurobiology-of-connection`.
- Files touched THIS session: `screens/EducationScreen.js`,
  `components/ConversationalEducation.js`, `components/GridHomeScreen.js`
  (+ `LOG.md`).
- Many other files show as modified/untracked in `git status` but are from PRIOR
  sessions (trackers, philosophical talkthroughs, app.config/app.json rename,
  etc.) — NOT part of this work. Be careful staging.
- Nothing committed this session.

## Known issues / watch-outs (device pass needed — Android specifically)
- Learn back: verify each press peels one level across the special-case widget
  topics too (nervous_system, ifs_basics, grounding_practices, polyvagal_mapping,
  triggers_glimmers, regulating_resources, ifs_chat) — those render their own
  full-screen widgets but still set `selectedTopic`, so the handler should catch
  them first. Confirm deep-link entry (TrailScreen → Learn with `selectedTopicId`
  + `returnTo`) still backs out correctly.
- Home bottom row: eyeball spacing/visibility — it sits above the 100px
  `bottomSpacer`; confirm it doesn't collide with the global Huxley FAB. Confirm
  fade-in timing looks right with the tile animation.
- SOS → TriggeredSupport: confirm that flow's onward link to FindSupport still
  works (`ConversationalTriggeredSupport.js` ~line 254).

## What's NEXT
- Device-verify both fixes on Android, then commit.
- Optional: if you later want the gear admin-only, it's a one-line guard using
  `userRoleService.isAdmin()` in `GridHomeScreen.js` — but there's real
  user-facing content behind Settings, so leaving it open is the current call.

## Reference
- Learn stack screen: `App.js` (`name="Learn"` → `EducationScreen`, ~line 377).
- Support routes: `App.js` `TriggeredSupport` (~545), `FindSupport` (~857),
  `Settings` (~817).
- Back-handler pattern precedent: `screens/GuidedExerciseScreen.js`,
  `screens/TrackHubScreen.js`.

Read handoffs/learn-back-and-home-support-settings.md and continue.
