# Handoff — Track block on the home screen

## Task
The Track tile on the home screen opened a modal while the other 5 tiles
navigate — and it duplicated the 3 dashboard widgets (NS / Habits / Glimmers),
which already linked to 3 of Track's 5 submenu items. Consolidated both surfaces
into a single **Track block** and made the tile grid 5 consistent sections.

## Status: DONE (built) — NOT committed, NOT device-verified

## What was done
- `lib/dashboardService.js`
  - Added `fetchLastTrigger` (`trigger_logs`) and `fetchLastParts`
    (`parts_checkins`), most-recent `created_at` each. `fetchDashboardData()`
    return shape now `{ nsCheckin, habitProgress, glimmerCount, lastTrigger, lastParts }`.
    All 5 Track indicators have real data.
- `components/GridHomeScreen.js`
  - Removed `track` from `navigationTiles` → grid is now 5 section tiles, all
    navigating (Prepare, Process, Inner Work, Practice, Philosophy).
  - Removed the 3-widget `dashboardRow` and the three `renderXWidget` fns.
  - Added `buildTrackIndicators()` (5 entries in submenu order: nervous, glimmer,
    trigger, parts, habits — each with icon, short status, `active` flag) and
    `renderTrackBlock()`.
  - **Whole block is one tap target → opens existing `SubMenuModal`** (the user's
    explicit choice). Indicators are read-only status, NOT individually tappable.
  - Gave `GlassCard` an optional `overlayStyle` prop so the Track block fills
    width instead of the default centered/padded overlay.
  - Trimmed now-dead code: `widget2/3` animators (entrance simplified to
    greeting → block → tiles), `WIDGET_WIDTH`/`WIDGET_GAP` consts, old widget styles.

### Visual tuning done (lots of back-and-forth — current state)
- Header is **stacked & centered**: Track icon (88px) above title (22px) above
  subtitle "Check in & log a moment".
- Overlay background: `rgba(255,255,255,0.55)` (soft light glass). NOTE: a darker
  blue tint and a near-solid white were both tried and rejected — light is correct.
- Indicator icons: 64px box, `resizeMode: contain`.
- **Per-icon `iconScale`** (applied via `transform: scale`, keeps layout box fixed):
  glimmer ×1.5, trigger ×1.25. Reason: those two PNGs have the artwork sitting
  small inside lots of transparent padding, so they looked smaller than
  parts/habits/NS which fill their canvas. Tunable if over/undershooting.
- A tinted **circle behind each icon was tried and removed** — didn't help.
- Track card border + shadow + elevation all zeroed (`trackCard` overrides
  `glassCardBase`): the side icons were bumping into the Android elevation rim.
  Indicator row `paddingHorizontal: 12`.

## Current state
- Branch: `master`. Nothing committed for this work.
- Working tree (this task): `components/GridHomeScreen.js`, `lib/dashboardService.js`.
  Pre-existing unrelated uncommitted items remain (`.claude/settings*`, `LOG.md`,
  prior handoffs, the session-checklist restyle from the earlier session).
- Both files parse clean (`@babel/core` + `babel-preset-expo`).

## Known issues / watch-outs
- NOT run on a device. Things to eyeball:
  - 5 icons at 64px across one row on a narrow phone (~64px columns) — tight; the
    ×1.5 glimmer is the widest. Check it doesn't crowd/clip.
  - `iconScale` values (glimmer 1.5 / trigger 1.25) are estimates from the art —
    nudge if they don't visually match.
  - Confirm the border/shadow rim is fully gone on Android (last reported issue).
- Trigger/Parts indicators read "time ago"; Glimmer "N this wk"; Habits "X/Y";
  empty shows muted "—".
- The earlier **session-checklist restyle** is also uncommitted and unverified —
  see `handoffs/session-checklist-restyle.md`. Consider committing both together
  after a device pass.

## What's next
- Run the app, open Home, eyeball the Track block (icon sizes, row fit, no rim).
- Tweak `iconScale` / row padding / overlay opacity if needed.
- Commit (likely alongside the session-checklist restyle).

## Reference
- Track submenu lives in `components/SubMenuModal.js`; options defined in
  `trackOptions` inside `GridHomeScreen.js`.
- Tracker screens/tables: `components/TriggerTracker.js` (`trigger_logs`),
  `components/PartsCheckin.js` (`parts_checkins`).
- Related: `handoffs/session-checklist-restyle.md`.

Read handoffs/track-block-home-screen.md and continue.
