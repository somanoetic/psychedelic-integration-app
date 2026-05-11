# Project Status

**Last Updated:** 2026-05-11
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
1. **Sentry DSN → env var** (BUG-307) + verify capture on prod build
2. **Privacy Policy / Terms rewrite** for non-HIPAA framing (driven by ADR-009), then **legal review kickoff** (BUG-308)
3. **Therapist-feature reframing** (driven by ADR-009 audit) — Phase A + B0 + **B1 complete (2026-05-11)**. Phase A: renamed `TherapistReportScreen` → `IntegrationSummaryScreen`, `TherapistVerificationScreen` → `ContributorApplicationScreen`, `TherapistToolsScreen` → `ContributorToolsScreen`; dropped license-board verification claim; AI Metrics now admin-only via Settings; EducationScreen card reframed. **B0:** ripped out `ScenarioUploadScreen` + `ScenarioTrainingSystem` entirely. **B1 (committed 2026-05-11):** admin review of contributor applications end-to-end. Includes `AdminApplicationReviewScreen` + `userRoleService.listApplications` / `approveApplication` / `rejectApplication` (auto-reverts user_roles to baseline on reject) / `requestMoreInfo` / `resubmitVerificationRequest`. Applicant-side: `ContributorApplicationScreen` has edit mode + resubmit path for `needs_more_info`; `ContributorToolsScreen` shows decision inline (rejection + reviewer notes visible on Tools surface, no tap-through). Four migrations: `20260506000001_b1_admin_review_policies` (admin SELECT/UPDATE policies + audit columns), `20260508000001_unify_is_admin_to_user_roles` (closes JWT-metadata escalation), `20260511000001_contributor_application_fields` (Phase A schema gap — added `professional_background`/`contribution_focus`), `20260511000002_user_resubmit_application` (RLS allowing applicant to flip `needs_more_info` → `pending`). Surfaced bugs during smoke test: BUG-309 (AI metrics MVs missing), BUG-311 (no email notifications on decisions). **Next: B2 (public library contribution + attribution + disclaimer).**
4. **Production env separation** (FEAT-401) — separate Supabase project, prod Anthropic key, EAS prod profile (standard tiers — no BAA needed per ADR-009)

### Goals for This Week
- [ ] Sentry DSN moved to `EXPO_PUBLIC_SENTRY_DSN`
- [x] **ADR-009 written and Accepted** (2026-05-05 — non-HIPAA wellness tool)
- [ ] Privacy Policy rewritten for non-HIPAA framing
- [ ] Terms of Service updated with explicit non-HIPAA / non-clinical clause
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
