# Handoff — Legal review (self-serve) + Huxley→Multitudes rebrand

## Task
Refresh the stale STATUS.md, then tackle the legal review (BUG-308). User has
NO budget for full external counsel right now, so we switched to a templated-service
+ in-house-audit path. Then user clarified the brand rule: **Multitudes = the app/product
everywhere; Huxley = only the in-app AI avatar/guide.** Finished both and committed.

## What was done

### Legal (BUG-308)
- Audited both policy drafts + ADR-009 + traced the OpenAI data flow in code.
- **Confirmed in code:** the `embeddings` edge function `search` action sends the
  USER'S query text to OpenAI (`supabase/functions/embeddings/index.ts` →
  `generateEmbedding(body.query)`, query comes from `lib/ragService.js`). So OpenAI is a
  subprocessor of user-derived data, not just doc ingestion — its omission was a real gap.
- Applied factual fixes to `screens/PrivacyPolicyScreen.js` + `screens/TermsOfServiceScreen.js`:
  added OpenAI + Sentry disclosures; deleted false "applicable federal AI safety frameworks"
  claim; fixed export language to match the shipped self-service export; clarified account
  deletion; added Consumer Health Data section (WA MHMDA / NV SB 370); named **Massachusetts**
  governing law + jurisdiction (user provided the state).
- Bumped `TOS_VERSION` 2026-05-12 → 2026-06-18 in `lib/legal/tosVersion.js` (re-prompts
  acceptance — the version is the per-user accepted-terms audit trail).
- Wrote `context/legal/legal-review-packet.md` (subprocessor table, open items, checklist).

### Rebrand (user-facing strings only)
- Fanned out 2 classifier agents to sort all 404 "Huxley" occurrences into product (rename)
  vs avatar (keep). Applied ~23 product renames by hand across the policy screens + 8 more files.
- **Kept as Huxley** (avatar): "Reflect with Huxley", "Hi, I'm Huxley", "Huxley is typing",
  chat-bubble name labels, "help Huxley respond more skillfully", etc.
- `app.config.js` display name was **already** "Multitudes"; AI prompt configs already treat
  Huxley as the guide's name, not the product — no change needed there.

## Current state
- Branch: **`legal-and-multitudes-rebrand`** (created off `master`). **Local only — NOT pushed.**
- Two commits: `d0414a7` (legal) and `22d2e33` (rebrand).
- Tests: **497 passing**; the 1 failure is the pre-existing unrelated PNG-import issue in
  `conversationBot.test.js` (documented in ADR-009) — not caused by this work.

## Files touched (all committed on the branch)
Legal commit (d0414a7): `screens/PrivacyPolicyScreen.js`, `screens/TermsOfServiceScreen.js`,
`lib/legal/tosVersion.js`, `context/legal/legal-review-packet.md`, `context/STATUS.md`,
`context/bugs/medium-low.md`.
Rebrand commit (22d2e33): `components/AnimatedSplash.js`, `components/ConversationalHomeScreen.js`,
`screens/AdminApplicationReviewScreen.js`, `screens/ContributorApplicationScreen.js`,
`screens/ContributorToolsScreen.js`, `screens/FindSupportScreen.js`,
`screens/NonClinicalDisclosureScreen.js`, `screens/SettingsScreen.js`.

## IMPORTANT — left deliberately untouched
The working tree has **pre-existing, unrelated in-progress work** that was NOT included in
either commit (do not assume it's part of this task): `App.js`, `lib/huxleyModeConfigs.js`,
`lib/huxleyService.js`, `screens/InnerWorkScreen.js`, the new Adult Attachment Interview feature
(`components/ConversationalAttachmentInterview.js`, `lib/modeHandlers/AdultAttachmentInterviewModeHandler.js`,
`supabase/migrations/20260618000001_attachment_reflection_sessions.sql`), scripts, `.claude/settings.json`,
and some `context/`/`handoffs/` notes. These are still uncommitted on the branch.

## What's next (suggested)
1. **Decide**: push the branch + open a PR, or merge to master. (Nothing pushed yet.)
2. **Operational legal items** (no lawyer): host privacy policy at a public URL (Play requires it);
   stand up privacy@/legal@somanoetic.com mailboxes; verify in-app account deletion end-to-end.
3. **Before monetization (FEAT-501):** ~$200–500 attorney-review add-on scoped ONLY to WA MHMDA
   + arbitration clause + subscription/refund terms. Details in the legal packet.
4. The rebrand intentionally stopped at user-facing strings. Code identifiers (huxleyService,
   HuxleyChatScreen, file/import names) were left as-is on purpose — only revisit if a deeper
   refactor is ever wanted (risky, no user benefit).

## Resume
Read handoffs/legal-review-and-multitudes-rebrand.md and continue.
