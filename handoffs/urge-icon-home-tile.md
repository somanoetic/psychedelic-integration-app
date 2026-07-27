# Handoff: Urge icon stale on home Track tile

## Status: CLOSED — fix committed `58b1c6d`, user-confirmed icon looks good (2026-07-26). No open items.

## Task
User reported the Urge tracker icon "was not replaced" on the Track tile in recent
production preview builds.

## Root cause
Not a build/cache issue — a missed wiring in source. The home grid maintains its OWN
icon map (`uiIcons` in `components/GridHomeScreen.js`), separate from both
`lib/uiIcons.js` and `screens/TrackHubScreen.js`. When the Urge tracker shipped
(commit `f4480d6`), `TrackHubScreen.js` was updated to `urge.png` but the home grid's
`subCraving` entry still pointed at the old `flow.png`. So the tracker hub showed the
new comet icon while the home Track tile showed the stale one.

Investigation also confirmed: `urge.png` is tracked/committed/not gitignored,
`.easignore` does NOT exclude `assets/`, so the asset uploads fine — ruling out the
EAS-archive-trim commit (`0402795`) as a cause.

## What was done
- Changed `subCraving` in `components/GridHomeScreen.js` (icon map near top, ~line 57)
  from `flow.png` to `urge.png`.
- Committed as `58b1c6d` on branch `feat/neurobiology-of-connection`.
- The `craving`/Urge home sub-item (route `CravingTracker`, label "Urge") renders
  `uiIcons.subCraving`, so it now shows the correct icon.

## Current state
- Branch: `feat/neurobiology-of-connection`
- Files touched: `components/GridHomeScreen.js` (committed), `LOG.md` (this wrap)
- Pre-existing uncommitted change left untouched: `.claude/settings.json`
- Not yet run on a device or in a new build — fix is source-verified only.

## What's next
- Trigger a fresh preview build from HEAD and confirm the home Track tile's Urge item
  shows the new comet icon.
- Watch for the same trap elsewhere: the home grid's `uiIcons` map is independent, so
  any future icon re-theme must be mirrored in BOTH `GridHomeScreen.js` and the
  `TrackHubScreen` / `lib/uiIcons.js` set.

## Resume
Read handoffs/urge-icon-home-tile.md and continue.
