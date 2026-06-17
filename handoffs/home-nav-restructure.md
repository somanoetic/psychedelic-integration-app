# Handoff — Home nav restructure (3-tab bar + 7-tile grid) + next-session TODOs

## Task
The home screen had 5 nav tiles, which orphaned the 5th in the 2-column grid
(2 + 2 + 1, leaving a right-side gap). Decided to collapse the two parallel nav
systems (bottom tab bar + home tiles) instead of just patching the symmetry:
trim the tab bar and promote Learn + History into tiles.

## Status: DONE — committed + pushed (`86e2876`). NOT device-verified.

## What was done (this session)
**RAG index fix (BUG-317) — separate, already merged/pushed earlier this session:**
- Live Supabase: dropped/recreated `idx_document_chunks_embedding` with `lists=150`
  on the real 21.6K vectors, and `CREATE OR REPLACE match_document_chunks ... SET
  ivfflat.probes = 10`. Needed `SET maintenance_work_mem='128MB'` (default 32MB
  errored). Migration file updated to match. Tracker closed. See
  `handoffs/backlog-audit.md` and `context/bugs/medium-low.md` (BUG-317 resolved).

**Home nav restructure (commit `86e2876`):**
- `App.js`
  - Tab bar trimmed 5 → 3: Home, Journal, Inner Atlas. Removed `Learn` + `History`
    `Tab.Screen`s and their `TAB_ICONS` entries; dropped now-unused lucide imports
    (`GraduationCap`, `History`).
  - Registered `Learn` (EducationScreen) and `History` (ConversationalAllSessions)
    as **Stack screens** (right after `MainTabs`).
- `components/GridHomeScreen.js`
  - Added `history` + `learn` to `tileIcons`.
  - `navigationTiles` reordered to 7 entries: prepare, process, **history (wide)**,
    innerwork, practice, philosophy, learn. History carries `wide: true`.
  - Layout falls out of the existing `flexWrap` + `space-between` grid as:
    `[prepare|process]`, `[history full-width]`, `[innerwork|practice]`,
    `[philosophy|learn]`.
  - `PressableTile` gained an `innerStyle` prop for the wide variant.
  - Wide-tile styles: `tileWide` (`width:'100%'`, `minHeight:96`), `tileInnerWide`
    (centered/stacked), `tileIconWide` (**160×160 to match square tiles**),
    `tileTitleWide` (fontSize 13 to match). Icon forces the band taller than
    minHeight — intended.
- Repointed nav calls that used the old nested-tab form:
  - `components/HuxleyChatScreen.js` ×2: `navigate('MainTabs',{screen:'Learn'})` →
    `navigate('Learn')` (the if/else branches collapsed since both sides matched).
  - `components/TrailScreen.js` ×1: education deep-link now
    `navigate('Learn', { selectedTopicId, returnTo:'CurriculumTracker' })`.
  - History's existing `navigate('History')` calls (SessionsHubScreen,
    ProcessIntegratePickerScreen) now resolve to the new Stack route — unchanged.
- New tile icon: `assets/images/icons/history.png` (copied from
  `design/Icon/v2bigger/v2/bigger/history.png`; user re-exported with background
  removed). The `design/` source is untracked on purpose.

## Verification done
- `npx tsc --noEmit` clean.
- `npx jest`: 497 pass. 1 failing suite (`__tests__/e2e/conversationBot.test.js`)
  is PRE-EXISTING — a `.png require()` in `lib/uiIcons.js` Jest can't parse;
  confirmed identical failure on the clean tree before these edits. Not ours.

## Current state
- Branch: `master`, pushed (origin at `86e2876`).
- Uncommitted: only `.claude/settings.json` (ambient) and the untracked
  `design/Icon/.../history.png` source.

## Known issues / watch-outs (device pass needed)
- Stack vs tab behavior: Learn + History tiles now PUSH a screen (back gesture/
  header), they don't switch a tab. Confirm back navigation feels right and the
  bottom bar behaves as expected when on those screens.
- Verify the two re-pointed Learn entry points still land: Huxley chat "explore
  the app"/handoff to Learn, and TrailScreen education deep-link (with params).
- Wide History band height with the 160px icon — eyeball it isn't cramped; bump
  `tileWide.minHeight` (~120) if it looks tight.

## What's NEXT (user's two requests for next session)
1. **Make the Track-block indicator icons individually tappable** so each goes
   straight to its tracker, instead of the whole block opening the SubMenuModal.
   - File: `components/GridHomeScreen.js` — `buildTrackIndicators()` /
     `renderTrackBlock()`. Each indicator already maps to a `trackOptions` route
     (nervous→NervousSystemCheckin, glimmer→GlimmerTracker, trigger→TriggerTracker,
     parts→PartsCheckin, habits→HabitTracker). Wrap each indicator in a
     TouchableOpacity → `navigation.navigate(route)`; keep the header/empty area
     opening the modal (or drop the modal — decide with user). Watch nested-touchable
     behavior since the block is currently one big TouchableOpacity.
   - Routes/screens live via `trackOptions` in `GridHomeScreen.js`.
2. **Fix keyboard ↔ input-box relationship in the Huxley FAB chat modal.**
   - File: `components/HuxleyChatModal.js` (opened from `FloatingHuxleyButton` on
     the home screen). The device-verified keyboard fix already landed on the main
     chat + conversation screens; this modal was NOT covered and has the same class
     of bug. See memory `project_chat_keyboard_gap_android` for the WORKING pattern
     (pad by FULL keyboard height; do NOT subtract insets.bottom) and the committed
     reference fix (commit `bd4b7d2`). Apply the same pattern; device-verify on
     Android. Related handoff: `handoffs/chat-keyboard-gap.md`.

## Reference
- Tab nav: `App.js` `MainTabs` (~line 130) + Stack screens (~line 399).
- Track block: `components/GridHomeScreen.js` (`buildTrackIndicators`, `trackOptions`).
- Keyboard pattern: memory `project_chat_keyboard_gap_android`, commit `bd4b7d2`,
  `handoffs/chat-keyboard-gap.md`.

Read handoffs/home-nav-restructure.md and continue.
