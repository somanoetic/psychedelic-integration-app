# Handoff — First beta builds (TestFlight + Android APK)

## Task
User asked "what's left before beta testing?" → walked the production-readiness
list, did the remaining *code* items, fixed a build failure, and got the iOS
build into TestFlight. Scope decisions made this session: **both platforms**,
**defer legal review** (run free beta under a draft-terms disclaimer), and
**defer the prod/dev Supabase split** (builds point at the current Pro project
for now).

## Status: SUPERSEDED (2026-08-07 audit) — iOS beta is live on TestFlight; Android APK never started.

The iOS build cleared review long ago and testers are on it; OTA delivery to that
build is covered by `handoffs/testflight-ota-channel-fix.md` (the channel mismatch
that was silently dropping every update), and iOS build/OTA mechanics now live in
memory `reference_ios_dev_and_ota_setup.md`. Everything below about "nothing pushed
to origin" is stale.

Still genuinely open: **the Android APK beta build was never started.** That's the
one real carry-forward from this doc.
All code committed to `master` (3 commits, see below). **Nothing pushed to origin.**

## What was done

### Crisis safety (FEAT-405) — committed `e575cc8`
- `screens/FindSupportScreen.js`: promoted Fireside Project into the crisis
  "Immediate Help" section (tel:6234737733 = 62-FIRESIDE); removed its duplicate
  from the therapist-directory list. Verified 988 / 741741 / SAMHSA numbers correct.
- `components/GlobalHuxleyFab.js`: added a red "In crisis?" SOS action to the
  global FAB fan → routes to `FindSupport`. (NOTE: user/linter later also added a
  "Contribute" action to the same fan — see current file; intentional, keep it.)
- AI-side crisis protocol verified correct in `lib/huxleyKnowledgeBase.js` +
  BUG-313 session crisis latch in `lib/huxleyService.js`.
- Marked code-complete (pending device verification) in `context/STATUS.md` +
  `context/features/planned.md`.

### Beta disclaimer — committed `e575cc8`
- `screens/NonClinicalDisclosureScreen.js`: added a "You're using an early beta"
  card (beta + draft Privacy/Terms acknowledgement). Bumped `DISCLOSURE_VERSION`
  v1 → v2 so prior acknowledgers re-see it. App.js gates on the derived storage
  key automatically — no App.js change needed. Breadcrumb in the version comment:
  remove the beta card + bump to v3 at public launch.

### Build fix — committed `78d7ede`
- EAS `npm ci` failed (ERESOLVE): `react-native-keyboard-controller@1.18.5`
  pulled `react-native-reanimated@4.4.1` transitively, which peer-requires RN
  0.83–0.86, but project is RN 0.81.5 (SDK 54).
- Root cause: **neither lib is used in app code.** Only reanimated consumers were
  two dead Expo template files (`components/HelloWave.tsx`,
  `ParallaxScrollView.tsx`). Removed both deps from `package.json` + the two
  scaffolding files. `npm ci --dry-run` now passes clean.
- `eas.json`: added `preview-internal` profile (APK + internal distribution) for
  sideloadable Android beta — existing profiles only emit Play AABs.

### EAS env vars — DONE (set by user during session)
- Discovered EAS had **zero** env vars (would've shipped a dead app). Set
  `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SENTRY_DSN` in EAS for the build to work.
  These point at the **current Pro Supabase project** (prod/dev split deferred).

## Current state
- Branch: `master`, 3 commits ahead of `origin/master` (e575cc8, 78d7ede + one
  earlier this session). **Not pushed.**
- iOS: built via `production` profile, `eas submit`-ed, in TestFlight Beta App
  Review. App Store Connect emails on approve/reject; status flips in TestFlight tab.
- Sentry: code wiring complete (`App.js`, guarded by `config.sentryDsn`). Whether
  a real DSN was set in EAS vs left empty was user's call at build time — verify.

## Known issues / watch-outs
- **Android APK build not run yet.** Command: `eas build --platform android
  --profile preview-internal`.
- **Dep removal was static-analysis-based** (nothing imports reanimated/
  keyboard-controller). High confidence, but if a tester hits a missing-native-
  module error, look here first.
- **Lots of uncommitted unrelated work still in the tree** (Learn hub rebuild:
  `content/education.js`, `components/LearnInteractive.js`, `EducationScreen.js`,
  `FormattedText.js`; RAG scripts; several handoffs). NOT in the beta build —
  EAS builds from committed state. Decide separately whether it ships.
- **Dead scaffolding left in place** (intentionally, out of scope): unused
  `components/HapticTab.tsx`, `ThemedText.tsx`, `ThemedView.tsx`. (`ExternalLink.tsx`
  IS used — keep.)
- **iOS buildNumber** was "5" in `app.config.js`; if it collides on a re-submit,
  bump it.

## What's next (when review clears or to keep moving)
1. **Fast path to testers now:** add them as *internal* TestFlight testers in App
   Store Connect (Users and Access → invite → internal group). Internal testers
   install immediately, no review wait. External testers need Beta App Review.
2. **Kick the Android APK build:** `eas build --platform android --profile
   preview-internal` → share the install link.
3. Prep tester onboarding note (install steps + what to test + feedback channel).
4. Deferred for later: prod/dev Supabase split (create a Free dev project, repoint
   local `.env`, current Pro project becomes prod — see prior discussion), full
   legal review (BUG-308), device-verify the FAB SOS + v2 disclosure gate.

## Resume
Read handoffs/beta-builds-testflight.md and continue.
