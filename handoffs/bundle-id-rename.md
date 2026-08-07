# Handoff — Bundle identifier rename to io.multitudesapp

## Task
EAS build was failing at bundle-ID registration. Root cause was an unaccepted
Apple Developer Program License Agreement (now resolved by the Account Holder).
While unblocking, replaced the default placeholder bundle ID
`com.anonymous.psycheteleosapp` with a real one keyed to the owned domain
`multitudesapp.io` → `io.multitudesapp`. Safe to change now because the old ID
was never successfully registered with Apple (no live app tied to it).

## Status: CLOSED — shipped and in production use (2026-08-07 audit).

`app.config.js:7` reads `IS_DEV ? 'io.multitudesapp.dev' : 'io.multitudesapp'`, and
both IDs are live: TestFlight builds ship under `io.multitudesapp` and the dev client
under `io.multitudesapp.dev`. Working tree clean. No open items.

## What was done
- `app.config.js` (the LIVE, source-of-truth config — `app.config.js` wins over
  `app.json` in Expo):
  - iOS `bundleIdentifier`: `com.anonymous.psycheteleosapp` → `io.multitudesapp`
  - Android `package`: `com.anonymous.psycheteleosapp` → `io.multitudesapp`
- Deleted stale `app.json`. It was dead (ignored when app.config.js exists) and
  had already drifted (missing camera permission, stale Sentry plugin block).
  Now app.config.js is the unambiguous single source of truth.

## Current state
- Branch: `master`. Changes uncommitted in working tree.
- This task's changes: `app.config.js` (modified), `app.json` (deleted).
- Many pre-existing/ambient uncommitted changes also present (NOT part of this
  task): `.claude/settings.json`, `LOG.md`, `components/FormattedText.js`,
  `content/education.js`, `screens/EducationScreen.js`, `scripts/*.py`, plus
  untracked `components/LearnInteractive.js`, several `handoffs/*.md`,
  `context/features/*.md`.

## Off-code items (user's plate, outside repo)
- Apple Developer Program License Agreement: DONE (accepted by Account Holder
  Neil Hadfield).
- EU trader status (Digital Services Act): NOT done. Deferred by user. Only
  blocks EU App Store *submission*, not the build. Set in App Store Connect →
  Business / compliance info.
- Marketing landing page is on Vercel (`multitudes-landing.vercel.app`, custom
  domain `multitudesapp.io`). Fully decoupled from the app build pipeline.

## What's NEXT
- Rebuild via EAS. First build will freshly register `io.multitudesapp` in App
  Store Connect and create a new provisioning profile (credentials step may take
  slightly longer). User hadn't yet said which track — profiles available in
  `eas.json`: `development`, `preview`, `preview-internal`, `production`.
- Optionally commit these config changes (suggested:
  `chore: set bundle id io.multitudesapp, remove stale app.json`).

## Possible follow-up cleanup (flagged, NOT done)
- `scheme` is still `"myapp"` (default deep-link placeholder). Change to e.g.
  `multitudes` if/when custom deep links are wanted.
- `slug` is still `psychedelic-integration-app` (cosmetic; changing it can affect
  the Expo project association — leave unless deliberate).

## Reference
- Live config: `app.config.js` — `expo.ios.bundleIdentifier`,
  `expo.android.package`.

Read handoffs/bundle-id-rename.md and continue.
