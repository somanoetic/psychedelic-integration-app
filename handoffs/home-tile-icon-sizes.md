# Handoff — Home screen tile icon size tuning

## Task
Per user request, make the home-screen tile/block icons slightly different sizes:
- **Track** — same size as Prepare
- **Process & Integrate** — 10% smaller
- **Inner Atlas** — 20% smaller

## Status: DONE — committed + pushed (in `origin/master`). Confirmed by user ("better"). Not separately device-verified beyond that.

## What was done
All edits in `components/GridHomeScreen.js`:
- `trackHeaderIcon` style: 88×88 → **160×160** (Track is a header block, not a grid
  tile; this matches the Prepare grid tile's base size). Note: the Track header
  layout/spacing was originally sized around an 88px icon — see watch-out below.
- Added two per-tile override styles next to `tileIcon` (base = 160×160):
  - `tileIconProcess` → **144×144** (−10%)
  - `tileIconInnerAtlas` → **128×128** (−20%)
- Render (the `navigationTiles.map(...)` `<Image>`): picks the icon style by
  `tile.id` — `process` → `tileIconProcess`, `innerAtlas` → `tileIconInnerAtlas`,
  wide tiles → `tileIconWide`, everything else → base `tileIcon` (Prepare stays 160).

## Current state
- Branch: `master`. The icon-size changes are already in HEAD and contained in
  `origin/master` (verified via `git branch -r --contains HEAD`).
- During the session the commit/push showed confusing output: `git diff` was empty
  and there was a transient stale-ref push rejection, but the end state is clean —
  changes are committed and on the remote. No outstanding local commits to push.
- Uncommitted in the tree (pre-existing / ambient, NOT part of this task):
  `.claude/settings.json`, `LOG.md`, and untracked design assets under
  `design/Icon/v2bigger/v2/bigger/` plus `handoffs/home-nav-restructure.md`.

## Known issues / watch-outs (device pass)
- **Track header height**: the icon went 88 → 160, which makes the Track block
  noticeably taller and may shift the title/subtitle layout. Eyeball it on device;
  if cramped or unbalanced, adjust the Track header block's spacing
  (`trackHeaderIcon` marginBottom / surrounding `trackHeader*` styles in
  `GridHomeScreen.js`).

## What's NEXT
- Nothing required for this task. If the Track header looks off on device, tune its
  spacing as noted above.
- Unrelated pending items still live in `handoffs/home-nav-restructure.md`
  (tappable Track indicators; Huxley FAB chat-modal keyboard fix).

## Reference
- All changes: `components/GridHomeScreen.js` — `trackHeaderIcon`, `tileIcon`,
  `tileIconProcess`, `tileIconInnerAtlas`, and the `navigationTiles.map` render.

Read handoffs/home-tile-icon-sizes.md and continue.
