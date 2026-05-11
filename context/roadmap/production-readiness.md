# Production Readiness Phase

**Phase Duration:** 2026-05-05 to 2026-06-02 (4 weeks)
**Status:** Planned
**Last Updated:** 2026-05-05

> **Naming note:** The label "Phase 3" is already taken by `docs/phase-3-evidence-based-interventions.md` (CBM / evidence-based features track). This is a separate **release-prep phase** that runs in parallel with whatever feature track is active.

---

## Phase Overview

**Theme:** Move Huxley from internal/dev state to a public-ready release on Play Store + TestFlight.

**Goals:**
1. **Close the launch-blocker list** — finish the items left over after BUG-221, BUG-304, BUG-305 etc.
2. **Production environment separation** — distinct prod Supabase project, prod API keys, prod EAS profile.
3. **Closed beta** — get the app into 5–15 real testers' hands and gather structured feedback.
4. **Store-ready submission** — listings, screenshots, data-safety/privacy forms, content rating.

**Out of scope (intentionally deferred):**
- New features. This phase is launch-prep, not feature work. Phase 3 (CBM / evidence-based) and outcome measurement continue as a parallel track but don't block release.
- E2E test suite (Detox/Maestro) — nice-to-have, not blocking.
- iOS App Store submission — TestFlight only this phase; full App Store comes after Play.

---

## Current State (Production-Relevant)

**Already done:**
- Privacy Policy + Terms of Service screens (BUG-304)
- Data export feature (BUG-305)
- Sentry reinstalled and wired (BUG-221 — needs DSN only)
- Exercise library IP review complete (BUG-220)
- RLS enabled on all 30 tables
- Bundle optimized, 519 tests passing
- Crash-free local builds on Android

**Still open / not yet tracked:**
- Sentry project not created, no DSN configured
- Privacy/Terms not legally reviewed; contact emails (privacy@, legal@somanoetic.com) not verified
- iOS beta build is stale (BUG-306)
- No prod/dev environment separation — single Supabase project, single Anthropic key
- No store listing assets (screenshots, descriptions, content rating, data-safety form)
- No closed beta cohort or feedback channel
- No DB backup/restore or migration-rollback plan for prod
- HIPAA posture not decided/documented (relevant for a therapeutic app handling sensitive journals)
- Crisis safety resources not audited (988, regional alternatives, escalation path)

---

## Week 1 (May 5–12): Legal, Crash Reporting, Env Split

### Primary Focus
**Legal & monitoring sign-off**
- [ ] Create Sentry project, set `SENTRY_DSN`, verify it captures a forced JS error and a forced native crash on Android
- [ ] Legal review of `screens/PrivacyPolicyScreen.js` + `screens/TermsOfServiceScreen.js` (external counsel or templated review)
- [ ] Configure privacy@ + legal@somanoetic.com mailboxes
- [ ] Decide HIPAA posture and document as ADR (likely "non-HIPAA wellness app" given current scope, but needs explicit call)

**Production environment separation**
- [ ] Create separate Supabase project (`huxley-prod`)
- [ ] Migrate schema (re-run all migrations against prod project)
- [ ] Provision prod Anthropic key with separate budget alert
- [ ] Add `production` profile to `eas.json` with prod env vars
- [ ] Document env switching in `lib/supabase.js` config

**Expected Outcome:**
End of week: prod environment exists, crashes are tracked, legal docs are reviewed.

---

## Week 2 (May 12–19): iOS Rebuild + Closed Beta Setup

### Primary Focus
**iOS rebuild (BUG-306)**
- [ ] `eas build --platform ios --profile preview`
- [ ] Upload to TestFlight
- [ ] Full regression pass on physical iOS device per BUG-306 checklist
- [ ] File any iOS-specific issues found

**Beta infrastructure**
- [ ] Set up Play Console internal testing track
- [ ] Set up TestFlight internal testers group
- [ ] Build the prod `eas build --platform android --profile production`, upload to Play internal track
- [ ] Recruit 5–15 testers (mix of: 2–3 therapists, 2–3 people with psychedelic experience, 2–3 general users)
- [ ] Create feedback channel (form or shared Slack/Discord — pick the lower-friction option)

**Crisis safety audit**
- [ ] Verify all crisis resources referenced in app are current (988, Crisis Text Line, SAMHSA)
- [ ] Add a visible "In crisis?" entry point reachable from any screen (footer link or persistent button in Settings)

**Expected Outcome:**
End of week: real testers on both Android and iOS, feedback flowing in.

---

## Week 3 (May 19–26): Beta Feedback + Store Assets

### Primary Focus
**Beta iteration**
- [ ] Triage incoming feedback daily; file as bugs/features in tracker
- [ ] Fix any P0/P1s that surface from beta
- [ ] One mid-week build push if blockers land

**Store listing assets (Play first, App Store next phase)**
- [ ] App icon final review (export at all required Play sizes)
- [ ] Feature graphic (1024×500)
- [ ] 4–8 phone screenshots showing: home, conversation w/ Huxley, intention-setting, journal, settings/export
- [ ] Short description (80 chars) + full description (4000 chars)
- [ ] Content rating questionnaire
- [ ] **Data Safety form** — every category collected, every third-party SDK (Supabase, Anthropic, Sentry), encryption-in-transit, deletion mechanism (point at the data export + account-delete flow)
- [ ] Verify account deletion flow exists and works (Play requires it as of 2024)

**DB backup + rollback plan**
- [ ] Confirm Supabase prod has point-in-time recovery enabled (Pro plan — or document the gap)
- [ ] Write a 1-page migration-rollback playbook in `docs/`
- [ ] Test the rollback playbook on a throwaway branch DB

**Expected Outcome:**
End of week: store listing 90% drafted, beta feedback loop running, DB recovery story exists.

---

## Week 4 (May 26 – Jun 2): Submission + Launch Decision

### Primary Focus
**Submission**
- [ ] Final build with all beta-driven fixes
- [ ] Submit to Play Store closed testing → production review
- [ ] iOS: keep on TestFlight, plan App Store submission as Production Readiness Phase 2

**Launch readiness checklist**
- [ ] All P0/P1 bugs from beta resolved
- [ ] Sentry capturing prod data, dashboards reviewed
- [ ] Anthropic + Supabase budget alerts set
- [ ] Support email monitored
- [ ] Privacy policy URL publicly accessible (not just in-app)
- [ ] Crisis resources verified one more time
- [ ] STATUS.md and roadmap docs updated

**Go / no-go decision**
- [ ] Review against success criteria below; pull the trigger or defer one more week

**Expected Outcome:**
Either submitted to Play production review, or a clear documented reason for the delay.

---

## New Tickets to File

These don't exist in the tracker yet and should be created when this phase starts:

- **FEAT-401:** Production environment separation (Supabase prod project, EAS prod profile, env switching)
- **FEAT-402:** Closed beta program (Play internal track, TestFlight, tester recruitment, feedback channel)
- **FEAT-403:** Play Store listing assets (screenshots, descriptions, data-safety, content rating)
- **FEAT-404:** DB backup + migration rollback playbook
- **FEAT-405:** Crisis safety audit + persistent "In crisis?" entry point
- **BUG-307:** Sentry DSN not configured (BUG-221 leftover)
- **BUG-308:** Privacy Policy + Terms not legally reviewed (BUG-304 leftover)
- **DEC-XXX:** ADR for HIPAA posture decision

---

## Success Criteria

**This Phase is Complete When:**
- [ ] Crash reporting capturing real prod data with team-readable dashboards
- [ ] Privacy/Terms legally reviewed; contact emails active
- [ ] Separate prod Supabase + prod Anthropic key in use, with budget alerts
- [ ] Fresh iOS build on TestFlight, regression pass complete
- [ ] 5+ active beta testers, written feedback collected
- [ ] Play Store listing complete and submitted
- [ ] DB rollback playbook tested at least once
- [ ] HIPAA posture documented as ADR

---

## Risks & Mitigations

### Risk: Legal review takes longer than 1 week
**Impact:** Blocks launch even if everything else is ready.
**Mitigation:** Start legal review on day 1; use a templated review service if external counsel is slow.
**Backup:** Soft-launch as "beta" with prominent disclaimer until legal lands.

### Risk: iOS regression surfaces deep platform-specific bugs
**Impact:** iOS slips out of this phase, Android-only launch.
**Mitigation:** Prioritize iOS rebuild in Week 2; don't let it slip to Week 4.
**Backup:** Acceptable to launch Android-first; iOS becomes Production Readiness Phase 2.

### Risk: Beta testers find a P0 in Week 3
**Impact:** Launch slips by 1–2 weeks.
**Mitigation:** Assume this will happen; Week 4 has slack for 1 critical fix cycle.
**Backup:** Defer Play submission until next phase; treat this phase as "beta hardening."

### Risk: Anthropic API costs spike with real users
**Impact:** Surprise bill, potential service degradation.
**Mitigation:** Set hard budget alerts at 50%/80%/100% of monthly cap before opening beta.
**Backup:** RAG cache + circuit breaker on per-user request count.

---

## Dependencies on Other Tracks

- **UX Polish phase** (current) — should be wrapping up; any in-flight P2 fixes carry over but don't block.
- **Phase 3 evidence-based features** — runs in parallel; no production-readiness work depends on it.
- **External:** Apple Developer account active, Google Play Console active, Sentry account, legal reviewer identified.

---

## Links

- [Current Phase: UX Polish](current-phase.md)
- [Phase 3: Evidence-Based Interventions](../../docs/phase-3-evidence-based-interventions.md) — parallel feature track
- [Roadmap Index](INDEX.md)
- [Bug Tracker](../bugs/INDEX.md)
- [Feature Backlog](../features/INDEX.md)
- [BUG-306: iOS rebuild](../bugs/medium-low.md#bug-306-ios-beta-build-stale)
- [BUG-221: Sentry resolution notes](../bugs/medium-low.md#bug-221-no-crash-reporting-in-production-sentry-removed)
- [BUG-304: Privacy/Terms resolution notes](../bugs/medium-low.md#bug-304-missing-privacy-policy--terms)

---

**Phase Owner:** Project Lead
**Next Review:** 2026-05-12 (end of Week 1)
