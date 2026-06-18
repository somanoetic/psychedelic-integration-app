# Legal Review Packet — Privacy Policy & Terms of Service

**Created:** 2026-06-18
**Owner:** Project Lead
**Status:** Self-serve path (no external counsel budget yet). Use this to (a) drive a templated
generator service, and (b) track what still needs a human lawyer before monetization.
**Related:** BUG-308 (legal review), ADR-009 (non-HIPAA posture), FEAT-501 (monetization)

> **How to use this doc.** Section A is the app/data summary you paste into a templated service
> (Termly / Iubenda / TermsFeed) or hand to any reviewer. Section B is the corrections already
> applied to the in-app drafts. Section C is the open items — what a generator won't know, what
> still needs a human, and rough costs. Section D is the pre-launch checklist.

---

## A. What the app is and does (paste into the generator / give to reviewer)

**App name:** Multitudes (the AI guide within it is named "Huxley") · **Operator / legal entity:**
Alleviation Therapeutics (Massachusetts) · **Contact domain:** somanoetic.com

**One-line description:** A self-directed consumer wellness and educational app that helps adults
reflect on and integrate transformative (including psychedelic) experiences, via journaling,
an AI reflection guide, nervous-system/parts tracking, and educational content.

**Posture (decided in ADR-009):** Non-HIPAA consumer wellness/educational tool. NOT a covered
entity, business associate, or healthcare provider. Data recorded is sensitive personal data, NOT
HIPAA PHI. No clinician portal, no client roster, no insurance billing, no clinical chart.

**Audience / age:** Adults 18+ only. US-first; may have EEA users (GDPR) over time.

**Data collected:**
- Account: email, password (hashed by Supabase Auth — plaintext never stored/seen)
- User wellness content: journal entries, session reflections, intentions, polyvagal/nervous-system
  check-ins, IFS parts notes, trigger/glimmer logs, habit & exercise completions, core-beliefs
  assessments, active-imagination notes, conversations with the Huxley AI guide
- Usage/technical: AI interaction metrics (response times, token counts, error rates) — auto-deleted
  after 90 days. Crash/error reports via Sentry (PII scrubbed).
- NOT collected: device IDs, advertising IDs, location, contacts, photos, other device sensors

**Where data lives:** Supabase-hosted Postgres (encrypted at rest + in transit, row-level security
on every table). Some local-device data via AsyncStorage. Certain features (intentions) can be kept
local-only.

**Third-party subprocessors (ALL must be disclosed):**
| Provider | Purpose | What it receives |
|---|---|---|
| Supabase | DB hosting + auth | Account + wellness data (the primary store) |
| Anthropic (Claude) | AI conversation | User message text + recent context + session/NS state. NOT email, NOT full history. Commercial API terms: not used for training. |
| **OpenAI** | Knowledge-base search embeddings | **User query text** (the message/topic being looked up) — see note below. NOT journal, NOT history, NOT account. API terms: not used for training. |
| **Sentry** | Crash/error reporting | Error/diagnostic data with PII scrubbed via `beforeSend`. NOT journal/conversations/credentials. |

> **OpenAI scope — confirmed in code (2026-06-18):** The `search` action of the `embeddings` edge
> function (`supabase/functions/embeddings/index.ts`) calls `generateEmbedding(body.query)`, and
> `lib/ragService.js` passes the **user's message/topic** as that query. So user-derived text DOES
> reach OpenAI at retrieval time (query only, not the journal). This is why OpenAI must be disclosed
> as a subprocessor of user data, not just as a doc-ingestion tool. *Optional future hardening:*
> embed a truncated/sanitized query instead of raw user text.

**User rights / controls already built:**
- Self-service data export: Settings → Export My Data (JSON across 19 tables) — `lib/dataExportService.js`
- In-app account deletion that removes all data (Play requires this — VERIFY it works end-to-end, FEAT-403)
- Edit/delete individual entries; switch AI off or to local-only
- Versioned ToS acceptance: `lib/legal/tosVersion.js` `TOS_VERSION` persisted to `user_profiles` at signup

**What we do NOT do:** no selling/renting data, no advertising networks, no analytics trackers, no
social SDKs, no data brokers.

---

## B. Corrections already applied to the in-app drafts (2026-06-18)

These were factual errors/omissions fixed directly in the code — no lawyer needed for any of them:

1. **Added OpenAI** to PrivacyPolicy §4 (new "OpenAI (knowledge-base search)" subsection) and §10
   (now §11) third-party list, and to TOS §6. The drafts previously named only Anthropic.
2. **Added Sentry** to PrivacyPolicy §10 (now §11) third-party list. Previously omitted entirely.
3. **Deleted the false claim** in TOS §8 referencing "applicable federal AI safety frameworks" —
   no such framework governs this; it was AI-generated filler and undercut the ADR-009 honesty posture.
4. **Fixed the data-export language** in PrivacyPolicy §7: was "contact us to request a full export"
   (a manual process we replaced) → now describes the self-service Settings → Export My Data flow.
   Also clarified in-app account deletion.
5. **Added a Consumer Health Data section** (PrivacyPolicy §8, new) covering WA My Health My Data Act
   + Nevada SB 370 + similar — see Section C item 1 for why this matters and what still needs review.
6. **Bumped `TOS_VERSION`** 2026-05-12 → 2026-06-18 and `TOS_LAST_UPDATED_DISPLAY` to match (these
   must move together; the version is the per-user acceptance audit trail).

Sections renumbered in PrivacyPolicy (now 13 sections) to accommodate the new §8.

---

## C. Open items — what still needs a human / a decision / money

Ordered by risk. Items 1–3 are the ones worth a paid set of eyes someday; 4–6 are decisions you can make.

### 1. 🔴 Washington My Health My Data Act (MHMDA) — the real exposure for this category
- **Why it matters:** MHMDA's "consumer health data" definition is extremely broad and almost
  certainly captures mental-health / psychedelic-adjacent reflection data. It has a **private right
  of action** (individuals can sue), which is rare and raises the stakes well above generic CCPA.
- **What I did now:** added a plain-language consumer-health-data section (PrivacyPolicy §8) with the
  core commitments (no sale without separate consent, no ad use, no brokers, withdrawal path).
- **What still needs review:** MHMDA may require a **separate, distinctly-linked "Consumer Health Data
  Privacy Policy"** (not just a section), a specific consent flow before *collecting* consumer health
  data, and specific authorization language before any *sharing*. This is the #1 thing to put in front
  of an attorney before turning on monetization. A templated generator generally will NOT handle MHMDA
  correctly on its own.

### 2. 🟡 Arbitration / dispute resolution / class-action waiver (TOS)
- Standard for consumer apps; currently absent. Its absence is conspicuous to any reviewer.
- A templated generator will offer a standard clause — accept it, but have a human confirm
  enforceability in your governing-law state. **Decision needed:** do you want binding arbitration?
  (Trade-off: limits class actions in your favor, but some users dislike it and some states scrutinize it.)

### 3. 🟡 Monetization terms (blocked until FEAT-501 design is firm)
- Once you charge: need subscription/auto-renewal disclosure, refund policy, RevenueCat/app-store
  billing terms, and the §11 liability cap ("amount you paid") only becomes meaningful then.
- App stores have their own required auto-renew disclosure language. **Do not enable monetization
  before this lands** — charging + sensitive health data is exactly when the WA MHMDA item (C1) bites.

### 4. ✅ Governing-law state (TOS §14) — RESOLVED 2026-06-18
- **Massachusetts** (where Alleviation Therapeutics has its business filing). TOS §14 now names the
  Commonwealth of Massachusetts and sets exclusive jurisdiction in MA state/federal courts.
- Note for C2: MA generally enforces consumer arbitration clauses, but confirm with the attorney-review
  add-on when scoping the arbitration clause.

### 5. ✅ Brand / entity / app-name consistency — RESOLVED 2026-06-18
- **Public app name = Multitudes.** Both policies now define: the App = "Multitudes" (operated by
  Alleviation Therapeutics), and "Huxley" = the AI reflection guide *within* the App. All app-level
  references in both policy files were flipped Huxley → Multitudes; the AI-guide references correctly
  keep "Huxley."
- **⚠️ Still outstanding (separate from legal):** the rest of the app's UI still says "Huxley" as the
  product name (NonClinicalDisclosureScreen, ContributorToolsScreen, FindSupportScreen, SettingsScreen,
  etc.). That's a deliberate rebrand pass, not a legal task — but the store listing (FEAT-403) and the
  user-facing disclosure copy should be made consistent before launch. Tracked separately.

### 6. ⚙️ Operational must-dos (no lawyer, but required)
- **Public URL:** Play Store requires the privacy policy at a hosted public URL, not just in-app.
  Ties to the web property (FEAT-502 / ADR-010). Pick where to host.
- **Mailboxes:** privacy@somanoetic.com and legal@somanoetic.com must actually exist and be monitored
  — they're cited in both docs. (Also a prerequisite for BUG-311 email notifications.)
- **CCPA notice-at-collection** line: generator will add it; verify present.

### Cost-aware recommendation
- **Now ($10–30/mo):** a templated service (Termly/Iubenda) for hosted URL + auto-updating boilerplate
  + CCPA/GDPR scaffolding. Feed it Section A. Keep the corrections in Section B (generators tend to
  drop app-specific facts like OpenAI/Sentry).
- **Before monetization ($200–500 one-time):** a focused **attorney-review add-on** (Termly/TermsFeed
  offer these) or a single paid consult, scoped to ONLY items C1 (WA MHMDA), C2 (arbitration), C3
  (subscription terms). Much cheaper than full counsel and targets the actual risk.
- **Skip for now:** full external counsel engagement. Not proportionate pre-revenue.

---

## D. Pre-launch legal checklist

- [x] Provide governing-law state → TOS §14 = Massachusetts (C4) ✅ 2026-06-18
- [x] Decide public app name = Multitudes; policy headers aligned (C5) ✅ 2026-06-18
- [ ] Rebrand remaining in-app UI from "Huxley" (product) → "Multitudes" (separate pass, before launch)
- [ ] Stand up privacy@ + legal@somanoetic.com, verify monitored (C6)
- [ ] Host privacy policy at a public URL (C6) — Play requirement
- [ ] Verify in-app account-deletion works end-to-end (FEAT-403 / Play requirement)
- [ ] Run Section A through templated service; reconcile output against Section B (don't lose OpenAI/Sentry/MHMDA)
- [ ] Complete Play Data Safety form using the Section A subprocessor table
- [ ] **Before monetization:** paid attorney-review add-on for C1/C2/C3
- [ ] Confirm WA MHMDA: section vs. separate policy + consent flow (C1) — attorney
- [ ] Decide arbitration clause (C2)
- [ ] Add subscription/refund/auto-renew terms when FEAT-501 design firms (C3)
- [ ] Bump `TOS_VERSION` again whenever substantive text changes (re-prompts acceptance)

---

## Files touched in the 2026-06-18 pass
- `screens/PrivacyPolicyScreen.js` — OpenAI + Sentry disclosure, export/deletion fix, new §8 consumer health data, renumber
- `screens/TermsOfServiceScreen.js` — OpenAI in §6, deleted false "federal AI frameworks" claim in §8
- `lib/legal/tosVersion.js` — version + display bumped to 2026-06-18
- `context/legal/legal-review-packet.md` — this file
