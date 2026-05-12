# ADR-009: HIPAA Posture — Non-HIPAA Wellness/Educational Tool

**Date:** 2026-05-05
**Status:** Accepted
**Deciders:** Project Lead

---

## Context

Huxley is a psychedelic integration support app with deeply personal user data: journal entries, AI conversations about psychedelic experiences, intentions, nervous-system check-ins, parts work, and trigger/glimmer tracking. The app is built and maintained by a licensed therapist/practitioner, which creates ambiguity about whether it's a clinical tool or a consumer wellness product.

Before launch we must make an explicit, documented call on HIPAA posture, because it cascades into:
- Vendor relationships (Supabase, Anthropic, OpenAI — BAAs needed?)
- Privacy Policy and Terms of Service language
- Marketing and in-app framing (clinical vs. wellness)
- Required disclaimers
- Cost structure (HIPAA-eligible vendor tiers are materially more expensive)
- Distribution model (consumer app stores vs. clinic B2B)
- Future scope: can practitioners use it with clients under their HIPAA umbrella?

## Decision

**Huxley is a non-HIPAA consumer wellness and educational tool.**

The app is positioned as a self-directed personal reflection and integration support tool. It is not a covered entity, does not transmit Protected Health Information (PHI), and is not used in the course of treatment, payment, or healthcare operations.

User-generated content (journal, sessions, AI conversations) is treated as **sensitive personal data** — not PHI — and protected under standard consumer privacy practices and applicable consumer privacy laws (e.g., CCPA, GDPR if/when applicable), not HIPAA.

## Rationale

1. **Scope match.** The app is a self-directed reflection tool. Users journal, set intentions, and converse with an AI guide. There is no clinician portal, no appointment scheduling tied to a covered entity, no insurance billing, no clinical chart, no intake assessment that creates a treatment record.
2. **Cost and complexity.** HIPAA compliance requires BAAs with every vendor that touches user data (Supabase, Anthropic, OpenAI for embeddings, Sentry, EAS), HIPAA-eligible vendor tiers (Anthropic's BAA is enterprise-tier; Sentry's HIPAA tier is materially more expensive), audit logging, breach notification procedures, an appointed Privacy Officer, written policies, and ongoing compliance overhead. This is disproportionate to a single-developer pre-launch app.
3. **Faster path to launch.** Avoiding HIPAA removes a multi-month vendor-negotiation and policy-drafting blocker from the production-readiness window.
4. **Reversible later.** If we move to a B2B clinical model in the future (e.g., licensed to clinics for in-session use with clients), we can revisit and pursue HIPAA at that point. This decision does not foreclose that path; it just defers it.
5. **User trust through clarity, not claims.** Strong consumer privacy practices (RLS, encryption at rest and in transit, data export, account deletion, minimal third-party sharing) protect users without requiring HIPAA framing. We are honest about what we are and aren't, rather than claiming protections we don't formally provide.

## Consequences

### Positive
- No BAA negotiations required; can use standard tiers of Supabase, Anthropic, OpenAI, Sentry.
- Lower operating cost.
- Clear, honest positioning: "wellness and reflection tool" rather than "clinical therapy."
- Faster path through Production Readiness phase.
- Privacy Policy and Terms can be drafted with a consumer-app template, simpler legal review (BUG-308).

### Negative
- **Cannot be marketed for use within a clinical practice as a HIPAA-covered tool.** Practitioners (including the project lead) cannot use Huxley with their own clients as part of treatment without separate workflows.
- B2B/clinic distribution is closed off without future re-decision.
- Some users may expect HIPAA-grade protection given the therapeutic/psychedelic subject matter; we must be explicit that it is not a clinical tool.
- Existing Privacy Policy language ("therapeutic data as sensitive health information") needs rewording to avoid implying HIPAA coverage.

### Neutral / Required Changes
- Privacy Policy: rephrase to "personal wellness data" framing; remove any implication of HIPAA coverage; make explicit that the app is not a covered entity.
- Terms of Service: keep and strengthen the existing "NOT a substitute for medical/psychiatric/therapeutic care" disclaimer; add explicit non-HIPAA statement.
- In-app framing: continue using "integration support," "reflection," "self-inquiry" language. Avoid "treatment," "therapy session," "clinical."
- AI guide system prompts: confirm Huxley does not present itself as a therapist or clinician; existing framing ("guide" / "companion") is compatible.
- Marketing copy (when written): wellness/educational framing only.
- Practitioner-facing content (e.g., "Ready for Session" flow): ensure language is "self-prep" not "clinical preparation."

## Alternatives Considered

### Option A: Pursue full HIPAA compliance
**Description:** Position Huxley as a clinical adjunct tool, sign BAAs with all vendors, implement audit logging, appoint Privacy Officer, write HIPAA policies.
**Pros:** Opens B2B clinical sales channel; matches the depth of the data; aligns with practitioner-built credibility.
**Cons:** Multi-month delay; BAA negotiations with Anthropic/OpenAI are non-trivial for a small operator; vendor cost increase; ongoing compliance overhead exceeds current capacity; not aligned with current B2C consumer-wellness scope.
**Why not chosen:** Disproportionate to current scope and team size. Defers launch by months. Can be revisited if/when a clinical B2B opportunity is concrete.

### Option B: "HIPAA-aligned" without formal compliance
**Description:** Adopt HIPAA-style controls (encryption, access logging, BAAs where free) without formally claiming HIPAA compliance.
**Pros:** Some defense-in-depth benefit at lower cost.
**Cons:** Confusing to users and legal — either you're HIPAA-covered or you're not. Half-measures invite both technical debt and legal ambiguity. Doesn't unlock B2B clinical use anyway.
**Why not chosen:** "HIPAA-aligned" is not a real legal status. Either commit or don't.

### Option C: Hybrid — consumer app + separate practitioner-mode under future BAA
**Description:** Ship consumer (non-HIPAA) version now, plan a separate practitioner workspace (HIPAA-eligible) later.
**Pros:** Lets us launch now, opens future B2B path.
**Cons:** Requires architectural separation (separate Supabase project for HIPAA-mode users) and is a v2 question, not a v1 question.
**Why not chosen:** Out of scope for current launch. **The current decision does not preclude this path** — see "Open Questions" below.

## Implementation Notes

### Pre-launch tasks driven by this ADR
1. **Privacy Policy rewrite** (BUG-308 leg): replace "therapeutic data as sensitive health information" with "personal wellness data"; add explicit non-HIPAA notice; confirm with legal reviewer.
2. **Terms of Service**: add explicit non-HIPAA / non-clinical-record clause; reinforce existing "not a substitute for medical care" language.
3. **In-app disclaimer**: surface a one-time onboarding disclosure that Huxley is a self-directed wellness tool, not a clinical service, and not HIPAA-covered.
4. **Marketing copy guardrails**: when written, avoid "treatment," "therapy," "clinical," "medical," "diagnose."
5. **AI prompt audit**: confirm Huxley's voice never positions itself as a therapist or clinician (it's a guide/companion).
6. **Crisis safety flow** (FEAT-405): keep robust — non-HIPAA does not reduce the duty-of-care expectation; keep crisis resources, escalation language, and safety-net features strong.
7. **Vendor relationships**: standard tiers of Supabase, Anthropic, OpenAI, Sentry are now confirmed acceptable for v1.

### Decisions this ADR unblocks
- **FEAT-401** (prod env separation): can proceed using standard Supabase + standard Anthropic key. No BAA negotiation needed.
- **BUG-307** (Sentry DSN to env): standard Sentry tier is fine; no HIPAA tier upgrade.
- **BUG-308** (legal review): scope is now consumer-wellness app review, not HIPAA review. Cheaper, faster.

## Therapist-Facing Features — Scope Under This ADR

Huxley already contains a set of therapist-facing screens and services (added before this ADR). They needed to be audited against the non-HIPAA posture. Audit performed 2026-05-05 against `master` @ commit `1c326db`. Summary:

### The HIPAA test we apply

A feature crosses into HIPAA territory if a therapist uses Huxley to deliver care to a specific identified client — i.e., Huxley becomes the medium through which the therapist creates, transmits, or stores Protected Health Information about a treatment relationship. Three properties together define the risk:
1. **Identified client linkage** in-app (therapist sees a named client roster).
2. **Treatment delivery** in-app (therapist assigns work to that client, reads their responses, tracks completion).
3. **Back-channel** from client to therapist (Huxley delivers client data to a therapist account).

If all three are present → Huxley is a Business Associate of that therapist's covered entity → BAAs required → full HIPAA stack required. **Currently, none of these are present.** All existing "therapist" features are either user-side self-service formatted for outbound sharing, or contributor-side anonymized library work.

### Two patterns we ALLOW under non-HIPAA

**Pattern A — User-initiated outbound sharing.** The user generates a summary of their own data and shares it via the OS share sheet (email, Messages, AirDrop, etc.). Huxley never knows who they shared it with. The recipient therapist's HIPAA obligations attach to whatever they store in their EHR after receiving it, not to Huxley. *This is no different from a patient texting their therapist a screenshot from MyFitnessPal.* The framing must be "share with anyone you choose" — not "share with your therapist via Huxley."

**Pattern B — Practitioner-curated public library.** A verified practitioner publishes content (exercises, protocols, AI training scenarios) into a shared library. *Any* user can browse and adopt it. No client linkage, no "this was assigned to you," no completion reporting back to the contributor. The clinical recommendation lives in the conversation between practitioner and client outside Huxley ("search Huxley for this resource — it'd be a good fit"); Huxley is just the library the client pulls from. Same model as a recipe site — the chef doesn't know who cooked their recipe.

### One pattern we EXPLICITLY EXCLUDE

**Pattern C — In-app clinician workspace (homework assignment + completion tracking).** Therapist has a named client roster, picks a client, assigns exercises, watches a dashboard of their responses. This unambiguously triggers HIPAA. **Not implemented today; must not be added under this ADR.** If/when this is desirable, it goes into a separate `huxley-clinical` v2 product under BAAs.

### Audit of existing features

| Feature | Pattern | Verdict | Action |
|---|---|---|---|
| `TherapistReportScreen` | A (user views/shares own data) | Safe in mechanism, misleading in framing | **Reframe.** Loads only the logged-in user's own data via `supabase.auth.getUser()`. The "Clinical Summary" badge, `medical-services` icon, and "the patient's" file comment imply a clinical workspace it isn't. Rename → `IntegrationSummaryScreen`. Remove clinical badge/icon. Strip "patient" language. |
| `ShareWithTherapistButton` + `therapistShareService.shareAll` etc. | A | Safe | Mechanism is fine (`Sharing.shareAsync` → text file → OS share sheet). Consider relabeling button to "Share Summary" or "Export" to avoid implying in-app therapist delivery. Filename `psycheteleos-complete-summary` is also a leftover from pre-Huxley rebrand. |
| `TherapistVerificationScreen` + `userRoleService.requestTherapistVerification` | (gates B contributors) | Safe in scope but **broken promise** | Collects license type/number/state/expiry/practice details. Says "We will verify your license with your state licensing board" but no admin review pipeline appears to exist, and no `user_roles` / `therapist_verification_requests` migration is in `supabase/migrations/`. Either build a minimal admin review flow for the contributor use case, OR drop license-board-verification claims and rebrand as a lighter "Contributor Application" — but don't ship a feature that promises something we don't do. |
| `TherapistToolsScreen` | (gates B contributors) | Safe — content gate, not clinical workspace | Has no client list, no client-data viewing, no homework assignment. Currently exposes `ScenarioUpload` (Pattern B) and `AdminMetricsDashboard` (which should be admin-only — see below). Keep the gate, prune what's behind it. |
| `ScenarioUploadScreen` + `ScenarioTrainingSystem` | B (training data contribution) | **Removed in B0 (2026-05-06)** | Initial audit considered this safe. Re-evaluation: contributors training the AI in a psychedelic-integration context carries real safety risk — a subtly off scenario propagates to every user invisibly, including users in fragile post-experience states. Admin review burden is heavy and trace-back is hard once a scenario shapes a response. Per the ADR boundaries, contributor work belongs in user-opt-in surfaces (Pattern B = public library), not behind-the-scenes AI training. Feature deleted; AI was never actually consuming the `training_scenarios` table, so removal had zero runtime impact. |
| AI Metrics Dashboard accessible to verified therapists | — | **Misconfiguration** | Cross-user AI metrics are admin territory; verified-therapist tier shouldn't see them. Restrict to `role === 'admin'`. |
| `EducationScreen` lines 192–208 | (gates B-style content) | Needs review | Some education content card is gated behind therapist verification. Audit what's gated and whether the gate has a clear reason. |
| `userRoleService` schema (`user`, `therapist`, `admin`) | — | Keep | Three-tier role model is fine for contributor gating. No client-relationship modeling exists in it; do not add such modeling under this ADR. |

### Cleanup tasks driven by this audit

1. ✅ **Done (commit `44cf222`, 2026-05-05):** Renamed `TherapistReportScreen` → `IntegrationSummaryScreen`. Removed "Clinical Summary" badge text, `medical-services` icon, and "patient" language. Updated navigation route and all call sites.
2. ✅ **Done (commit `44cf222`, 2026-05-05):** Relabeled `ShareWithTherapistButton` default label to "Share Summary". Updated `therapistShareService` share-sheet `dialogTitle` to "Share Summary" and renamed `shareAll` filename from `psycheteleos-complete-summary` → `huxley-integration-summary`.
3. ✅ **Done (Phase A, 2026-05-06):** Dropped `TherapistVerificationScreen`'s state-board verification claim. Renamed → `ContributorApplicationScreen`. Stripped license-board language and license-specific form fields (license_type, license_number, license_state, license_expiry, practice_name, practice_address). New form collects: full name, professional background, years of experience, areas of focus, what you'd like to contribute, additional info. Application now positioned as "we'll review and email you" — no false license-board claim. Underlying DB-facing method `userRoleService.requestTherapistVerification` left unrenamed pending DB schema confirmation (#6).
4. ✅ **Done (Phase A, 2026-05-06):** Removed AI Metrics Dashboard card from `ContributorToolsScreen`. Added discreet admin-only entry from `SettingsScreen` (gated by `userRoleService.isAdmin()`). The dashboard itself already enforced admin access at the destination — this fixes the misleading UX of showing a button verified contributors couldn't actually use.
5. ✅ **Done (Phase A, 2026-05-06):** Audited `EducationScreen` lines 178–211. It was a recruitment-funnel duplicate of the `ContributorTools` entry point, not gating educational content. Reframed as "Become a Contributor" with non-clinical language.
6. ⏳ **Pending user check:** Confirm `user_roles` / `therapist_verification_requests` table state in the live Supabase project (no migration found in repo). When confirmed, drives Phase B (review pipeline + role string rename `'therapist'` → `'contributor'`).
7. ⏳ **Open:** Add an in-app onboarding disclosure that Huxley is a self-directed wellness tool, not a clinical service, and not HIPAA-covered. Especially relevant for any user who self-identifies as a practitioner.
8. ✅ **Done (B0, 2026-05-06):** Ripped out `ScenarioUploadScreen` and `ScenarioTrainingSystem`. Removed `App.js` route, `EducationScreen` recruitment card, `ContributorToolsScreen` upload action, and `userRoleService.canAccessTrainingScenarios()`. AI was never consuming `training_scenarios` — zero runtime impact. Decision reversal documented in audit table above. The `training_scenarios` Supabase table is left in place for now and can be dropped later (no readers/writers).

### Phase B — sub-batches (DB tables confirmed 2026-05-06)

User confirmed `user_roles` and `therapist_verification_requests` exist with the columns referenced by `userRoleService`. Phase B refactored into sub-batches:

**B1 — Application review pipeline** (next up)
- New `AdminApplicationReviewScreen` listing pending entries from `therapist_verification_requests`
- Approve / reject / request-more-info actions; on approve sets `user_roles.verified = true`
- Entry from Settings → Admin (next to AI Metrics Dashboard)
- RLS audit: applications must be admin-readable only

**B2 — Public library contribution pipeline** ✅ **Done (2026-05-12)**
- Migration `20260511000003_contributed_exercises.sql` — `contributed_exercises` table with `id, contributor_id, attribution_name, title, category, instructions, steps[], duration, submitted_at, review_status (pending/approved/rejected/needs_revision), reviewed_by, reviewed_at, published_at, review_notes` and full RLS (contributor own pending; admin all; authenticated users read approved+published).
- `lib/contributedExerciseService.js` — contributor side: `submitExercise`, `listMySubmissions`, `reviseSubmission`, `deleteSubmission`. Admin side: `listForReview`, `approveSubmission` (sets `published_at` in same action), `rejectSubmission`, `requestRevision`. User-facing: `listPublished` (normalized to the bundled exercise shape).
- `screens/ContributorExerciseSubmissionScreen.js` — list + form modes. Form: title, attribution, category picker, duration, instructions, dynamic steps[]. Doubles as the revise-after-needs_revision path. Gated to approved contributors/admins.
- `screens/AdminContentReviewScreen.js` — tabbed (pending/needs_revision/approved/rejected) review queue with expandable cards, approve-and-publish / request-revision / reject actions, notes required for the latter two.
- `components/ContributedContentDisclaimer.js` — reusable component with the ADR copy verbatim, used in `ExerciseLibraryScreen` modal and `GuidedExerciseScreen` instructions.
- `ExerciseLibraryScreen` + `ConversationalExerciseLibrary` async-merge approved entries with bundled. Attribution chip on cards, disclaimer in detail/instructions.
- **Intentional scope cut:** AI services (`huxleyService`, `therapeuticIntegrationService`) stay bundled-only. Contributor content reaches users only via browse-the-library, not via AI recommendation — protects the attribution boundary and avoids the AI presenting contributor content as established protocol.
- Disclaimer text: *"This content was contributed by [Name] and reviewed for safety. It reflects the contributor's perspective, not medical advice or the views of Alleviation Therapeutics."*

**B3 — Role string rename** (deferred indefinitely; pure polish)
- Migration: `UPDATE user_roles SET role='contributor' WHERE role='therapist'` + RLS policy updates
- Rename `userRoleService` methods (`requestTherapistVerification` → `submitContributorApplication`, `isVerifiedTherapist` → `isApprovedContributor`, etc.) and call sites
- User-facing UI is already correct after Phase A; B3 is internal-only cleanup.

### Forward boundaries

- ✅ User generates their own integration summary and shares it via OS share sheet — keep and reframe.
- ✅ Verified contributors publish exercises/protocols/training scenarios to a shared library — keep and expand if useful.
- ✅ Therapist verbally tells client "search Huxley for X" — entirely outside the app, no Huxley involvement.
- 🚫 Therapist account that views named clients' data in-app — do not build under this ADR.
- 🚫 Homework assignment workflow (therapist → specific client → completion tracking) — do not build under this ADR. Belongs to the future `huxley-clinical` product.
- 🚫 Practitioner-mediated user-to-user data delivery in-app — do not build under this ADR.

## Open Questions

1. **State-level laws:** California (CMIA), Washington (My Health My Data), and others have stricter consumer health-data laws than HIPAA in some respects. Privacy Policy review (BUG-308) should cover these.
2. **Future HIPAA mode:** If demand emerges for clinic B2B distribution, what's the migration path? Tentatively: separate `huxley-clinical` Supabase project under BAA, separate Anthropic enterprise key, with feature parity but isolated data. Not a v1 concern.
3. **Practitioner self-use boundary** (resolved 2026-05-05): The project lead (a licensed therapist) can use Huxley personally and can recommend it to clients as self-directed homework outside session, with the client's own consent. Cannot use it to receive client data into a HIPAA-covered record. Worth a one-line onboarding note for practitioner users.

## References

- [Privacy Policy screen](../../screens/PrivacyPolicyScreen.js)
- [Terms of Service screen](../../screens/TermsOfServiceScreen.js)
- [Production Readiness roadmap](../roadmap/production-readiness.md)
- BUG-308: Legal review for Privacy/Terms
- FEAT-401: Production environment separation
- FEAT-405: Crisis safety audit

---

**Supersedes:** None
**Superseded by:** None
