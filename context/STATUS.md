# Project Status

**Last Updated:** 2026-06-18
**Version:** 1.1.0 (Build 4)
**Phase:** Production Readiness (release-prep, overrunning original May 5 – Jun 2 window) + Monetization track (planned)

> **Note:** The original Production Readiness timeline (4 weeks ending Jun 2) has been exceeded. Most *code* is complete; the remaining work is largely operational (account/service setup, legal review, device builds) plus the new Monetization feature track.

---

## Current State

### What's Working ✅
- Core app rebranded to Huxley with grid home screen + Huxley AI guide (marketing name: **Multitudes**)
- Conversational UI across all major flows (Huxley, Intention, Experience Processing, NS Mapping)
- Daily journal with AI assistance
- Integration session tools, intention setting, exercise library (160 exercises)
- Database (Supabase) — 30 tables, RLS enforced everywhere
- Authentication flow + age gate / ToS acceptance + non-clinical disclosure gate
- Educational content section + Learning Hub
- Tracking features: triggers, glimmers, habits, curriculum
- **Privacy Policy + Terms of Service screens** (in-app, registered routes — drafted, pending legal review)
- **User data export** (Settings → Export My Data, full JSON across 19 tables)
- **Sentry crash reporting** wired in App.js (DSN now env-driven — needs project + DSN value)
- **RAG knowledge base** — ✅ DEPLOYED & LIVE, verified 2026-06-16 (281 docs / 21,648 chunks, vector search ~0.9–1.4s, IVFFlat index right-sized to lists=150)
- **AI metrics + admin dashboard** (FEAT-203 — note: two materialized views still missing in live DB, BUG-309)
- **Anthropic prompt caching** — live & committed (verified 2026-06-10)
- **Contributor pipeline** — application review + public exercise contribution (ADR-009 B1/B2/B3 complete)
- **Guided exercise narration v1** — TTS reads exercise steps aloud (built, not yet device-verified)

### What's In Progress 🚧
- **Production Readiness phase** — operational items remaining (see `roadmap/production-readiness.md`)
- **Voice conversation** — ⏸️ PAUSED 2026-06-02; pivoted to narration-only
- BUG-303: documentation (ongoing)

### What's Blocked 🚫
- **Monetization (FEAT-501)** — blocked on legal review (BUG-308) before charging users

### Recently Resolved P0s 🚨 (2026-05-13)
- **BUG-312** ✅ — Huxley silently returning mode fallback strings as if they were real AI responses on API errors. Fix: `huxleyService.chat()` now retries transient errors (3 attempts, exponential backoff) and **throws** on persistent failure; orphaned user-turn rolled back to prevent duplicates on retry; `_getFallback()` deleted. Callers' existing `try/catch + Alert` flow now actually fires. Verified BAD→STRONG on trauma_resurfacing and spiritual_bypasser.
- **BUG-313** ✅ — IFS / regulating_resources mode framework overriding crisis protocol after user declined 988. Fix: session-scoped `crisisDetected` latch in `HuxleyService` triggered by `critical`-priority scenario detection; once set, the crisis protocol is always injected for the rest of the session along with an explicit override directive that suspends mode-specific phase advancement. Also added fabrication-prevention rule to `HUXLEY_IDENTITY`. Verified 6/6 BAD→STRONG on suicidal_crisis × {ifs, regulating_resources} × {1,2,3}.
- **Persona matrix testing infrastructure now in place** — `__tests__/e2e/personaMatrix.test.js` drives 10 AI-personas × 6 modes × 3 runs = 180 conversations with auto-eval. Re-runnable as a regression suite for any conversation-related change.

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

## Critical Paths (as of 2026-06-18)

**Path to launch:** prod environment (FEAT-401) → legal review (BUG-308) → closed beta (FEAT-402) → Play Store listing (FEAT-403) → submit. Most remaining items are account/service setup and device builds — your action, not code.

**Path to revenue:** legal review (BUG-308) → entitlement layer + metered paywall (FEAT-501, ~1–2 weeks code).

### Remaining Production-Readiness Items
- **FEAT-401 Prod env** — code-side done; create `huxley-prod` Supabase, run migrations, prod Anthropic key + budget alerts, set EAS Secrets
- **BUG-307 Sentry** — code reads `SENTRY_DSN` from env; create Sentry project, set DSN, verify a test crash, configure alerts
- **BUG-308 Legal review** — Privacy/Terms drafted but not reviewed by counsel; `privacy@`/`legal@somanoetic.com` mailboxes not live. **Blocks monetization.**
- **BUG-306 iOS rebuild** — stale beta; `eas build` → TestFlight → regression on a physical device
- **FEAT-402 Closed beta** — Play internal track + TestFlight group, recruit 5–15 testers, feedback channel
- **FEAT-403 Play Store listing** — screenshots, descriptions, content rating, Data Safety form, verify account-deletion flow
- **FEAT-404 DB backup/rollback** — confirm PITR, write + test rollback playbook
- **FEAT-405 Crisis safety audit** — verify 988/Crisis Text Line/SAMHSA, add persistent "In crisis?" entry point

### Open Bugs (code work)
- **BUG-309** (P2) — AI metrics dashboard missing two materialized views in live DB (~2–4 hrs, admin-only)
- **BUG-311** (P2) — no email on contributor-application decisions (blocked on Resend SMTP first)
- **BUG-314** (P2) — crisis latch never disengages within a session (conservative-safe; minor for single-session model)
- **BUG-301** (P3) — no performance monitoring
- **BUG-303** (P3) — documentation gaps (ongoing)

### Monetization Track (planned, future)
- **FEAT-501** — entitlement layer + metered paywall (RevenueCat, `<PremiumGate>`, PaywallScreen, metered free Huxley). Large (~1–2 weeks). Blocked on legal review.
- **FEAT-502** — education content → public web articles (SEO foundation)

---

## Historical: This Week's Focus (May 5–12) — Production Readiness Week 1

### Top Priorities
1. ~~**Sentry DSN → env var** (BUG-307)~~ — **code-side done** (merged 2026-05-05; `app.config.js` + `lib/config.js` + `App.js` all read `SENTRY_DSN` from env). User-action remaining: set `SENTRY_DSN` in local `.env`, configure as EAS secret for prod builds, verify capture on a prod build, configure Sentry alerts
2. ~~**Privacy Policy / Terms rewrite** for non-HIPAA framing (driven by ADR-009)~~ — **drafted 2026-05-12**; legal review kickoff still pending (BUG-308)
3. **Therapist-feature reframing** (driven by ADR-009 audit) — Phase A + B0 + B1 + B2 + **B3 complete (2026-05-12)**. Phase A: renamed `TherapistReportScreen` → `IntegrationSummaryScreen`, `TherapistVerificationScreen` → `ContributorApplicationScreen`, `TherapistToolsScreen` → `ContributorToolsScreen`; dropped license-board verification claim; AI Metrics now admin-only via Settings; EducationScreen card reframed. **B0:** ripped out `ScenarioUploadScreen` + `ScenarioTrainingSystem` entirely. **B1:** admin review of contributor applications end-to-end (`AdminApplicationReviewScreen` + `userRoleService` review methods + four migrations including `20260506000001_b1_admin_review_policies`, `20260508000001_unify_is_admin_to_user_roles`, `20260511000001_contributor_application_fields`, `20260511000002_user_resubmit_application`). Applicant-side has edit mode + resubmit path for `needs_more_info`. Surfaced bugs during smoke test: BUG-309 (AI metrics MVs missing), BUG-311 (no email notifications on decisions). **B2 (committed 2026-05-12):** public library contribution pipeline. New table `contributed_exercises` (migration `20260511000003_contributed_exercises`) with RLS allowing contributors to submit/revise own pending, admins to review/approve, all authenticated users to read approved+published. New `contributedExerciseService` with submit/listMine/revise/delete (contributor), listForReview/approve/reject/requestRevision (admin), listPublished (user-facing). New `ContributorExerciseSubmissionScreen` (form + past-submissions list, gated to approved contributors) and `AdminContentReviewScreen` (tabbed review queue mirroring the application reviewer). New reusable `ContributedContentDisclaimer` component shown in `ExerciseLibraryScreen` modal and `GuidedExerciseScreen` instructions; both library entry points now async-merge approved contributions with an attribution chip on cards. AI services (`huxleyService`, `therapeuticIntegrationService`) intentionally still pull bundled-only to keep contributor content out of AI recommendations. **B3 (committed 2026-05-12):** internal role string rename — `user_roles.role='therapist'` → `'contributor'` via migration `20260512000002_role_string_rename_contributor.sql` (drops/recreates the `valid_role` CHECK to the post-B3 vocabulary `('user', 'contributor', 'admin')`, dropping unused `'service_account'`/`'moderator'`); no RLS changes needed (no active policy filtered on the role string). `userRoleService.isVerifiedTherapist`→`isApprovedContributor`, `requestTherapistVerification`→`submitContributorApplication`, plus six call-site flips and a dev-screen rename. User-facing UI unchanged — rename was always internal-only after Phase A.
4. **Production env separation** (FEAT-401) — separate Supabase project, prod Anthropic key, EAS prod profile (standard tiers — no BAA needed per ADR-009). **Code-side prep done 2026-05-12:** `eas.json` now has explicit `env` blocks per profile, `.env.example` documents required EAS Secrets and the dev/prod separation pattern, `lib/supabase.js` confirmed env-driven (no code changes needed for prod swap). Remaining is operational: create `huxley-prod` Supabase, set EAS Secrets pointing at it, separate Anthropic key + budget alerts.
5. ✅ **ADR-009 onboarding non-HIPAA disclosure (#7)** — **done 2026-05-12.** New `screens/NonClinicalDisclosureScreen.js` shown after onboarding and before main app routes. Three cards (wellness-not-clinical, not-HIPAA-covered, crisis services) + practitioner self-ID question with extended note when Yes. Versioned AsyncStorage key (`huxley:disclosure_acknowledged_v1`) so future material changes can re-prompt. App.js gates on it after the existing onboarding gate.

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
- Sentry project/DSN not yet created (BUG-307 — code now env-driven)
- No E2E tests yet (Detox/Maestro deferred)
- Privacy/Terms not legally reviewed (BUG-308)
- AI metrics materialized views missing in live DB (BUG-309)

---

## Health Indicators

| Indicator | Status | Notes |
|-----------|--------|-------|
| Build Status | 🟢 Green | Builds successfully on Android |
| Critical Bugs | 🟢 Green | All resolved |
| Test Coverage | 🟢 Green | 519 tests passing |
| Documentation | 🟢 Green | Context system operational |
| RAG / Knowledge Base | 🟢 Green | Deployed & verified live (2026-06-16) |
| Performance | 🟡 Yellow | Acceptable, no formal measurement (BUG-301) |
| Security | 🟢 Green | All 30 tables RLS-protected, keys rotated |
| Crash Reporting | 🟡 Yellow | Sentry env-driven; project/DSN not yet created (BUG-307) |
| Legal Readiness | 🟡 Yellow | Policies drafted, awaiting review (BUG-308) — blocks monetization |
| Prod Environment | 🟡 Yellow | Code-side ready; `huxley-prod` not yet created (FEAT-401) |
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

**Next Status Update:** when prod env or legal review lands
