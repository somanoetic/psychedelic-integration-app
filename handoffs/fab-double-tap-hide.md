# Handoff — Double-tap-to-hide on the Global Huxley FAB

## Task
Per user request: add the ability to double-tap the floating Huxley FAB to hide
(tuck) it away, in addition to the existing hide gestures.

## Status: CLOSED — committed (2026-08-07 audit). NOT device-verified.

Landed in `cddc102` ("fix(fab): dim screen behind the radial menu for readable
options"); handoff docs swept up in `6ddcbaf`. Working tree clean.
Residual: no device pass — fold into the next one.

## What was done
All edits in `components/GlobalHuxleyFab.js`:
- Added `DOUBLE_TAP_MS = 280` constant (max gap between taps to count as a
  double-tap), next to the other tunable constants near the top.
- Added `lastTapRef = useRef(0)` to track the timestamp of the last FAB tap.
- Added `handleFabPress()`: uses `Date.now()` deltas — if a second tap lands
  within `DOUBLE_TAP_MS` it calls the existing `tuckAway()`; otherwise it records
  the timestamp and calls the existing `toggleExpanded()`.
- Rewired the main FAB `TouchableOpacity` `onPress` from `toggleExpanded` →
  `handleFabPress`. `onLongPress={tuckAway}` and the drag-to-edge PanResponder are
  unchanged.

## Current state
- Branch: `master`. Change is uncommitted in the working tree.
- Pre-existing/ambient uncommitted changes also present (NOT part of this task):
  `.claude/settings.json`, `LOG.md`, `components/FormattedText.js`,
  `content/education.js`, `screens/EducationScreen.js`, the two `scripts/*.py`,
  plus untracked `components/LearnInteractive.js` and several `handoffs/*.md` and
  `context/features/*.md`.

## Known issues / watch-outs (device pass)
- **Menu flashes open on double-tap**: the single-tap action fires instantly (no
  deferral), so the first tap opens the radial fan and the second immediately
  collapses + tucks it. Net result is correct (FAB ends hidden, no stuck-open
  state — `tuckAway()` calls `collapse()` first), but there's a brief flash. This
  was a deliberate tradeoff to keep the common "open menu" tap latency-free. If
  the flash looks bad on device, the alternative is to defer the single-tap behind
  a timer (adds lag to opening the menu).
- `DOUBLE_TAP_MS = 280` may want tuning after a real-device feel test.

## What's NEXT
- Device walk-through: confirm double-tap reliably hides, single tap still opens
  the menu cleanly, and the flash (above) is acceptable.
- Then commit (suggested: `feat(fab): double-tap Huxley FAB to hide`).

## Reference
- All changes: `components/GlobalHuxleyFab.js` — `DOUBLE_TAP_MS`, `lastTapRef`,
  `handleFabPress`, and the main FAB `TouchableOpacity` `onPress`.

Read handoffs/fab-double-tap-hide.md and continue.
