# Project Status

**Last Updated:** 2026-05-12
**Version:** 1.1.0 (Build 4)
**Phase:** Production Readiness — Week 1 (parallel with Phase 3 feature track)

---

## Current State

### What's Working ✅
- Core app rebranded to Huxley with grid home screen + Huxley AI guide
- Conversational UI across all major flows (Huxley, Intention, Experience Processing, NS Mapping)
- Daily journal with AI assistance
- Integration session tools, intention setting, exercise library (160 exercises)
- Database (Supabase) — 30 tables, RLS enforced everywhere
- Authentication flow
- Educational content section + Learning Hub
- Tracking features: triggers, glimmers, habits, curriculum
- **Privacy Policy + Terms of Service screens** (in-app, registered routes)
- **User data export** (Settings → Export My Data, full JSON across 19 tables)
- **Sentry crash reporting** wired in App.js (DSN currently hardcoded — see BUG-307)
- **RAG knowledge base** live (21,648 chunks, scores 0.59–0.71)
- **AI metrics + admin dashboard** (FEAT-203)

### What's In Progress 🚧
- **Production Readiness phase** (Week 1 of 4) — see `roadmap/production-readiness.md`
- BUG-303: documentation (ongoing)

### What's Blocked 🚫
- None currently

### Recently Completed (Mar–Apr 2026) ✅
- BUG-114, BUG-206, BUG-214 — Set Intention flow fixes
- BUG-215 through BUG-219 — Experience Processing UX, Huxley avatar, intention conversation depth, follow-up typing
- **BUG-220** — Exercise library IP review (18 exercises genericized)
- **BUG-221** — Sentry reinstalled, wired into App.js (leftover: BUG-307 to move DSN to env)
- **BUG-202** — TypeScript config (tsc passes clean)
- **BUG-205** — Privacy link wired
- **BUG-302** — Bundle optimized (4 deps removed: @anthropic-ai/sdk, react-native-dotenv, react-native-web, react-dom)
- **BUG-304** — Privacy Policy + Terms screens created (leftover: BUG-308 legal review)
- **BUG-305** — User data export feature (Settings + dataExportService)
- **FEAT-103/104** — Nervous System & Polyvagal AI services complete

---

## This Week's Focus (May 5–12) — Production Readiness Week 1

### Top Priorities
1. ~~**Sentry DSN → env var** (BUG-307)~~ — **code-side done** (merged 2026-05-05; `app.config.js` + `lib/config.js` + `App.js` all read `SENTRY_DSN` from env). User-action remaining: set `SENTRY_DSN` in local `.env`, configure as EAS secret for prod builds, verify capture on a prod build, configure Sentry alerts
2. ~~**Privacy Policy / Terms rewrite** for non-HIPAA framing (driven by ADR-009)~~ — **drafted 2026-05-12**; legal review kickoff still pending (BUG-308)
3. **Therapist-feature reframing** (driven by ADR-009 audit) — Phase A + B0 + B1 + B2 + **B3 complete (2026-05-12)**. Phase A: renamed `TherapistReportScreen` → `IntegrationSummaryScreen`, `TherapistVerificationScreen` → `ContributorApplicationScreen`, `TherapistToolsScreen` → `ContributorToolsScreen`; dropped license-board verification claim; AI Metrics now admin-only via Settings; EducationScreen card reframed. **B0:** ripped out `ScenarioUploadScreen` + `ScenarioTrainingSystem` entirely. **B1:** admin review of contributor applications end-to-end (`AdminApplicationReviewScreen` + `userRoleService` review methods + four migrations including `20260506000001_b1_admin_review_policies`, `20260508000001_unify_is_admin_to_user_roles`, `20260511000001_contributor_application_fields`, `20260511000002_user_resubmit_application`). Applicant-side has edit mode + resubmit path for `needs_more_info`. Surfaced bugs during smoke test: BUG-309 (AI metrics MVs missing), BUG-311 (no email notifications on decisions). **B2 (committed 2026-05-12):** public library contribution pipeline. New table `contributed_exercises` (migration `20260511000003_contributed_exercises`) with RLS allowing contributors to submit/revise own pending, admins to review/approve, all authenticated users to read approved+published. New `contributedExerciseService` with submit/listMine/revise/delete (contributor), listForReview/approve/reject/requestRevision (admin), listPublished (user-facing). New `ContributorExerciseSubmissionScreen` (form + past-submissions list, gated to approved contributors) and `AdminContentReviewScreen` (tabbed review queue mirroring the application reviewer). New reusable `ContributedContentDisclaimer` component shown in `ExerciseLibraryScreen` modal and `GuidedExerciseScreen` instructions; both library entry points now async-merge approved contributions with an attribution chip on cards. AI services (`huxleyService`, `therapeuticIntegrationService`) intentionally still pull bundled-only to keep contributor content out of AI recommendations. **B3 (committed 2026-05-12):** internal role string rename — `user_roles.role='therapist'` → `'contributor'` via migration `20260512000002_role_string_rename_contributor.sql` (drops/recreates the `valid_role` CHECK to the post-B3 vocabulary `('user', 'contributor', 'admin')`, dropping unused `'service_account'`/`'moderator'`); no RLS changes needed (no active policy filtered on the role string). `userRoleService.isVerifiedTherapist`→`isApprovedContributor`, `requestTherapistVerification`→`submitContributorApplication`, plus six call-site flips and a dev-screen rename. User-facing UI unchanged — rename was always internal-only after Phase A.
4. **Production env separation** (FEAT-401) — separate Supabase project, prod Anthropic key, EAS prod profile (standard tiers — no BAA needed per ADR-009)

### Goals for This Week
- [x] **Sentry DSN moved to env-injected `SENTRY_DSN`** (code-side done 2026-05-05; runtime verification on a prod build still owed by user)
- [x] **ADR-009 written and Accepted** (2026-05-05 — non-HIPAA wellness tool)
- [x] **Privacy Policy rewritten for non-HIPAA framing** (2026-05-12 — drafted, pending legal review per BUG-308)
- [x] **Terms of Service updated with explicit non-HIPAA / non-clinical clause** (2026-05-12 — drafted, pending legal review per BUG-308)
- [ ] Engaged legal reviewer (consumer-app scope, not HIPAA)
- [ ] `huxley-prod` Supabase project created, schema migrated
- [ ] Prod Anthropic key with budget alerts (50/80/100%)

---

## Next Phase Preview

**Production Readiness Week 2 (May 12–19):**
- iOS rebuild + TestFlight (BUG-306, FEAT-402)
- Closed beta program setup + tester recruitment
- Crisis safety audit (FEAT-405)

**Production Readiness Weeks 3–4 (May 19 – Jun 2):**
- Beta feedback iteration
- Play Store listing assets (FEAT-403)
- DB backup + rollback playbook (FEAT-404)
- Submission + go/no-go

**Parallel feature track:** Phase 3 evidence-based interventions continues per `docs/phase-3-evidence-based-interventions.md`.

---

## Key Metrics

**Codebase Stats:**
- Components: 50+ React Native components
- Screens: 25+ navigation screens
- AI Services: 9 specialized AI integrations
- Database Tables: 30 active tables (all RLS-protected)
- Tests: 519 passing

**Technical Debt:**
- iOS beta build stale (BUG-306)
- Sentry DSN hardcoded (BUG-307)
- No E2E tests yet (Detox/Maestro deferred)
- Privacy/Terms not legally reviewed (BUG-308)

---

## Health Indicators

| Indicator | Status | Notes |
|-----------|--------|-------|
| Build Status | 🟢 Green | Builds successfully on Android |
| Critical Bugs | 🟢 Green | All resolved |
| Test Coverage | 🟢 Green | 519 tests passing |
| Documentation | 🟢 Green | Context system operational |
| Performance | 🟡 Yellow | Acceptable, no formal measurement (BUG-301) |
| Security | 🟢 Green | All 30 tables RLS-protected, keys rotated |
| Crash Reporting | 🟡 Yellow | Sentry wired but DSN hardcoded (BUG-307) |
| Legal Readiness | 🟡 Yellow | Policies drafted, awaiting review (BUG-308) |
| iOS Status | 🔴 Red | Build stale; needs rebuild + regression (BUG-306) |

---

## Team & Resources

**Team Size:** 1 developer + AI assistance
**Development Mode:** Active (production-readiness focus)
**Deployment:** Android (primary target this phase), iOS (TestFlight rebuild this phase)

**Key Tools:**
- React Native 0.81.5 + Expo ~54.0.25
- Supabase (Postgres + Auth + RLS + pgvector)
- Anthropic Claude API
- Sentry (newly reintegrated)

---

## Quick Links

- [Production Readiness Roadmap](roadmap/production-readiness.md) ⭐
- [Bugs](bugs/INDEX.md)
- [Features](features/INDEX.md)
- [Roadmap Index](roadmap/INDEX.md)
- [Decisions](decisions/INDEX.md)

---

**Next Status Update:** 2026-05-12 (end of Production Readiness Week 1)
