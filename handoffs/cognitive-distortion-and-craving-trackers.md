# Handoff — Cognitive Distortion & Craving Trackers

**Date:** 2026-06-22
**Branch:** `fix/beta-ux-polish-batch`
**Status:** CLOSED — committed (2026-08-07 audit). NOT device-verified.

Verified: `components/CognitiveDistortionTracker.js` and `components/CravingTracker.js`
exist, are tracked, and are registered as routes in `App.js:684-692`. Migrations were
already applied to Supabase (live). Working tree clean.
Residual: no device pass — fold into the next one.

## Task

Two net-new data models requested from the beta backlog:
1. **Cognitive Distortion Tracker** — a full CBT thought record.
2. **Craving Tracker** — general urge logging that invites nervous-system + IFS-parts exploration.

## Design decisions (from user, a therapist)

- Distortion set: **Burns' classic 10 + a free-text "other"** (stored as a `TEXT[]` multi-select).
- Distortion flow: **full thought record** — situation → automatic thought → distortion type(s) → evidence for/against → balanced reframe → belief % before/after.
- Craving scope: **general urge** framing (substance/behavior/food/digital/other), deliberately inviting `ns_state` (polyvagal) and `part_note` (IFS) per the app's existing spine. Non-clinical wellness posture (ADR-009) — no diagnosis language.
- Integration scope: TrackHub + history feed, data export, insights, AND Huxley AI awareness — all four.
- Home Track block: **all 7 indicators in a 3+4 layout** — top row Parts/Nervous/Habits, bottom row Glimmer/Trigger/Urge/Thought.

## What was done

**Migrations (applied live):**
- `supabase/migrations/20260622000001_cognitive_distortions.sql`
- `supabase/migrations/20260622000002_craving_logs.sql`
- Both follow the newest convention: `gen_random_uuid()`, `updated_at` trigger, indexes on `user_id` + `created_at DESC`, 4 named RLS policies on `auth.uid() = user_id`.

**Components (new):**
- `components/CognitiveDistortionTracker.js` — modeled on TriggerTracker/GlimmerTracker (collapsible sections, multi-select distortion chips, two belief % scales, recent list with belief-shift badge).
- `components/CravingTracker.js` — urge category cards, 1–5 intensity, NS-state chips (reuse polyvagal icons), IFS part prompt, ride-the-wave toggle.

**Wiring (edited):**
- `App.js` — imports + `Stack.Screen` registrations for both (routes `CognitiveDistortionTracker`, `CravingTracker`).
- `screens/TrackHubScreen.js` — added two tracker cards + KIND_META rows (icons: `thought_cloud.png`, `flow.png`).
- `lib/dashboardService.js` — `fetchTrackHistory` now includes `fetchDistortionEntries` + `fetchCravingEntries`; `fetchDashboardData` now returns `lastDistortion` + `lastCraving` (new `fetchLast*` helpers).
- `lib/dataExportService.js` — added both tables to `USER_DATA_TABLES`.
- `lib/insightsDataService.js` — added `_fetchCognitiveDistortions` / `_fetchCravingLogs` fetchers + 4 aggregation helpers (`getTopDistortions`, `getBeliefShift`, `getCravingsByCategory`, `getUrgeSurfingRate`); both surfaced in `getInsightsSummary`.
- `lib/masterContextService.js` — new `getBehavioralPatterns(userId, opts)` loaded under `focus: 'all'` and `'nervous_system'`, attached as `context.behavioralPatterns` (distortion top-types/belief-ease + craving by-category/state-links/rode-wave-rate, plus 3 recent of each). This is the seam AI services already consume.
- `components/GridHomeScreen.js` — added `subDistortion`/`subCraving` icons; `buildTrackIndicators` now returns `{ topRow, bottomRow }`; `renderTrackBlock` renders two rows; new `trackIndicatorRowBottom` style.

## Verification done

- `npx tsc --noEmit` → clean.
- `npx jest __tests__/lib __tests__/components` → 390 pass, 0 fail.
- Full suite: only pre-existing failure is `__tests__/e2e/conversationBot.test.js` (PNG-`require` resolution in that e2e file — confirmed failing with our changes STASHED, so unrelated).

## What's next

1. **Device smoke test** (primary): log one entry in each tracker, confirm it saves (no RLS error), appears in TrackHub Recent, and flips the home tile from "—" to "Just now".
2. **Narrow-phone check**: bottom Track row packs 4 × 64px icons; should fit via `flex:1` + short labels, but eyeball it. If tight, drop icon size slightly.
3. **InsightsScreen UI** (optional follow-up): the insightsDataService aggregations exist but are NOT yet rendered. Would need to match existing chart conventions in the Insights screen.
4. **Commit** — nothing committed yet this session; branch has other unrelated uncommitted work (philosophical talkthroughs, thought experiments) — be selective when staging.

## Reference

- Pattern source files modeled on: `components/TriggerTracker.js`, `components/GlimmerTracker.js`.
- Memory index: `MEMORY.md` (Track/IFS/polyvagal context). ADR-009 = non-HIPAA wellness posture.

Read handoffs/cognitive-distortion-and-craving-trackers.md and continue.
