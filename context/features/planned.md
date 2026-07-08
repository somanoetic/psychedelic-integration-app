# Planned Features

**File Size Limit:** 300 lines
**Last Updated:** 2026-05-05

---

## High Priority — Production Readiness Phase (May 5 – Jun 2)

### FEAT-401: Production Environment Separation
**Priority:** High
**Status:** Planned
**Target:** Production Readiness, Week 1
**Estimated Effort:** 2-3 days

**User Story:**
As a developer, I need separate prod/dev environments so that beta and prod traffic don't share a Supabase project, Anthropic key, or Sentry stream.

**Requirements:**
- [ ] Create separate Supabase project (`huxley-prod`) and run all migrations
- [ ] Provision a dedicated prod Anthropic API key with budget alerts (50/80/100%)
- [x] Move hardcoded Sentry DSN out of App.js into `app.config.js` extra → `lib/config.js` (done 2026-05-05; see BUG-307)
- [ ] Add `production` profile to `eas.json` with prod env vars
- [ ] Update `lib/supabase.js` and `lib/config.js` to read from env, document switching

**Dependencies:** None
**Blocks:** Beta launch (FEAT-402), Play Store submission (FEAT-403)

---

### FEAT-402: Closed Beta Program
**Priority:** High
**Status:** Planned
**Target:** Production Readiness, Week 2
**Estimated Effort:** 3-4 days (setup) + ongoing

**User Story:**
As a product owner, I want 5–15 real users testing prod builds with a feedback channel so I learn what actually breaks before launch.

**Requirements:**
- [ ] Set up Play Console internal testing track
- [ ] Set up TestFlight internal testers group (resolves BUG-306)
- [ ] Recruit testers (target: 2-3 therapists, 2-3 psychedelic-experienced users, 2-3 general)
- [ ] Pick a feedback channel (form / Slack / Discord — lower friction wins)
- [ ] Triage cadence: daily during week 3, weekly thereafter

**Dependencies:** FEAT-401 (need prod env first)

---

### FEAT-403: Play Store Listing Assets
**Priority:** High
**Status:** Planned
**Target:** Production Readiness, Week 3
**Estimated Effort:** 3-4 days

**User Story:**
As a product owner, I need a complete Play Store listing so the app can be submitted for review.

**Requirements:**
- [ ] App icon export at all required Play sizes
- [ ] Feature graphic (1024×500)
- [ ] 4-8 phone screenshots (home, Huxley conversation, intention, journal, settings/export)
- [ ] Short description (80 chars) + full description (4000 chars)
- [ ] Content rating questionnaire
- [ ] **Data Safety form** — every category collected, every third-party SDK (Supabase, Anthropic, Sentry), encryption-in-transit, deletion mechanism
- [ ] Verify account deletion flow works end-to-end (Play requirement)

**Dependencies:** FEAT-401 (need prod build), legal review of Privacy/Terms (BUG-308)

---

### FEAT-404: DB Backup + Migration Rollback Playbook
**Priority:** High
**Status:** Planned
**Target:** Production Readiness, Week 3
**Estimated Effort:** 1-2 days

**User Story:**
As an on-call developer, I need a tested rollback procedure so a bad migration doesn't take down user data.

**Requirements:**
- [ ] Confirm Supabase prod has point-in-time recovery enabled (Pro plan) or document gap
- [ ] Write 1-page rollback playbook in `docs/`
- [ ] Test the playbook against a throwaway branch DB before launch

**Dependencies:** FEAT-401

---

### FEAT-405: Crisis Safety Audit
**Priority:** High
**Status:** Code-complete (pending device verification) — 2026-06-18
**Target:** Production Readiness, Week 2
**Estimated Effort:** 1-2 days

**User Story:**
As a user in distress, I need crisis resources reachable within 2 taps from anywhere in the app.

**Requirements:**
- [x] Audit every crisis resource referenced in app (988, Crisis Text Line, SAMHSA) — verified current 2026-06-18; numbers correct in `FindSupportScreen.js` + AI crisis protocol (`huxleyKnowledgeBase.js`)
- [x] Add a persistent "In crisis?" entry point — added a red SOS action to the global FAB (`GlobalHuxleyFab.js`), reachable from any screen, routing to `FindSupport`. (Also still in Settings + triggered-support flow.)
- [x] Promoted Fireside Project (psychedelic peer-support line, 62-FIRESIDE) into the crisis "Immediate Help" section
- [x] Document crisis-response philosophy — disclaimer card in `FindSupportScreen.js` ("we provide links; we don't endorse/verify")
- [x] Verify across all conversation modes that Huxley's safety prompts route to resources — covered by BUG-313 session crisis latch + persona matrix (suicidal_crisis × all modes STRONG)

**Remaining:** device verification — tap-through the FAB SOS, confirm `tel:`/`sms:` links dial (esp. Fireside 62-FIRESIDE = 623-473-7733).

**Dependencies:** None

---

## High Priority — Monetization Track (added 2026-06-02)

> Driven by the business plan (`context/business/BUSINESS-PLAN.md`). Sequenced AFTER prompt
> caching (`context/features/prompt-caching-prompts.md`), which is the highest-ROI first move.

### FEAT-501: Entitlement Layer + Metered Paywall
**Priority:** High
**Status:** Planned (future work)
**Estimated Effort:** Large (1–2 weeks, excl. store review)
**Spec:** `context/features/monetization-paywall.md`

**User Story:**
As the founder, I need a subscription/entitlement system so users can pay for premium, and a
metered free tier for Huxley so free-tier AI cost doesn't sink the business.

**Requirements:**
- [ ] `lib/entitlementService.js` mirroring the `userRoleService` cache pattern (`isPremium()`,
      `getEntitlement()`, `refresh()`); admins/contributors granted premium implicitly
- [ ] RevenueCat integration (`react-native-purchases`) as cross-platform subscription source
- [ ] `<PremiumGate>` chokepoint component + `screens/PaywallScreen.js` (plans, trial,
      restore-purchases)
- [ ] Apply gates to premium surfaces per spec §3 (Huxley, full library, insights, summaries)
- [ ] **Metered Huxley:** per-user free message counter → graceful paywall (not error) after
      the free allowance (~10 msgs, tunable). Decision logged 2026-06-02 in spec §3.
- [ ] Server mirror: RevenueCat webhook → Supabase `subscriptions` table; server checks
      entitlement before spending Anthropic tokens
- [ ] B2B-Lite premium-code redemption hook (see `context/business/b2b-path.md` §5)

**Dependencies:** Prompt caching (margin), BUG-308 (legal review before charging)
**Blocks:** All revenue

---

### FEAT-502: Education Content → Public Web Articles (SEO foundation)
**Priority:** High (start early — SEO has 6–12mo lag)
**Status:** Planned (future work)
**Estimated Effort:** Medium, ongoing
**Refs:** `context/business/distribution.md` §3 Tier 2; memory project_feature_education_surface

**User Story:**
As the founder, I want the journal/education content published as public web articles so the
niche audience can find Multitudes via search, and so the same content feeds the in-app
education surface and B2B credibility material.

**Requirements:**
- [ ] Source from `content/education.js`, `content/worksheets/edu-*.js`, journal chapters 1–14
- [ ] Publish on the web property (same one as ADR-010 web admin + future checkout)
- [ ] **ADR-009 language guardrail applies:** wellness/reflection framing only — no
      "treatment/therapy/clinical/cure/diagnose" claims in public SEO content
- [ ] Google Search Console + basic analytics set up once
- [ ] Light one-time ASO pass on app listing keywords ("psychedelic integration", "ketamine
      integration", "trip integration journal") — low-competition exact terms
- [ ] Triple-use: write once → SEO + in-app education surface + B2B material

**Dependencies:** Web property exists (shared with ADR-010)
**Note:** Foundational SEO only. Defer keyword-chasing/backlinks/paid SEO tools until traffic
+ conversion data exist. Tier-1 relationships remain the faster path to first users.

---

## Medium Priority — Deferred from Earlier Phases

### FEAT-202: Enhanced UX Layouts
**Priority:** Medium
**Status:** Planned (deferred)
**Estimated Effort:** 5-7 days

Polished layouts for Home, Journal Entry, Session Prep, Practice, Education. Requires Figma design system (FEAT-206 in ideas.md).

---

### FEAT-203: Improved Artwork & Visual Design
**Priority:** Medium
**Status:** Planned (deferred)
**Estimated Effort:** 5-7 days + ongoing

Custom icons, empty-state illustrations, exercise artwork, polyvagal infographics, breathing animations. Budget: $500-2000 for custom work.

---

### FEAT-204: Philosophical "Talkthroughs"
**Priority:** Medium
**Status:** Planned (deferred)
**Estimated Effort:** 7-10 days

5 guided philosophical explorations (Identity, Consciousness, Unity, Healing Trauma, Mystery). Format: text + audio + journal prompts.

---

### FEAT-205: Living Regulation Toolkit (Progress View)
**Priority:** Medium
**Status:** Planned
**Estimated Effort:** 3-5 days

Dedicated screen showing toolkit organized by NS state (sympathetic/dorsal/ventral), with version history and diff view across sessions. Data already exists in `regulating_resources` and `polyvagal_patterns` tables.

---

## Recently Completed (Archive Pending)

- **FEAT-101** Session Day Checklist ✅ (2026-02-24)
- **FEAT-102** AI Intention Guidance ✅ (2026-02-24)
- **FEAT-103** AI Nervous System & Parts Check-In ✅ (2026-03-15)
- **FEAT-104** Polyvagal Mapping AI ✅ (2026-03-15)
- **FEAT-201** Testing Infrastructure ✅ (2026-02-24, delivered as FEAT-204 in AI track)

These can be removed after 30-day archive window.

---

## Notes

**Lower Priority:** See [ideas.md](ideas.md) (Offline Mode, Figma Design System, etc.).

**Numbering Convention:**
- 1XX = core app features
- 2XX = AI / UX / content (overlap exists with `ai-system-improvements.md` — known)
- 3XX = future/long-term
- 4XX = production readiness (new — this phase)

**Planning Guidelines:**
- Move to `in-progress.md` when starting
- Move to `ideas.md` if deferred indefinitely
- Remove when complete (after 30 days)

---

**Current Count:** 11 features planned (5 production-readiness, 2 monetization, 4 deferred), 5 recently completed
**File Status:** Under 300-line limit
**5XX = monetization track** (added 2026-06-02)
