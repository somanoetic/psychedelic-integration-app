# Business Plan — Multitudes

**Last Updated:** 2026-06-02
**Status:** Draft v1
**Legal entity:** Alleviation Therapeutics
**Marketing brand:** Multitudes (codebase still says Huxley)
**Owner:** Project Lead (1 dev + AI assistance)

> Keep this file under 300 lines (CLAUDE.md convention). Detailed paywall spec lives in
> `context/features/monetization-paywall.md`. Legal posture lives in ADR-009.

---

## 1. One-line thesis

A self-directed psychedelic-integration companion (journaling, intention-setting, an AI
guide "Huxley," nervous-system/parts work, exercise library) sold as a **consumer wellness
subscription**. Free to download; the AI guide and depth features are premium.

---

## 2. Positioning guardrail (NON-NEGOTIABLE — from ADR-009)

The app is a **non-HIPAA consumer wellness/educational tool**, NOT a clinical service.
Every monetization decision must stay inside this box:

- Market with wellness/reflection/self-inquiry language. Never "treatment," "therapy,"
  "clinical," "medical," "diagnose."
- **Do NOT** build an in-app clinician workspace (named client rosters, homework
  assignment, completion tracking back to a practitioner). That triggers HIPAA and is the
  future `huxley-clinical` v2 product, not v1.
- Crisis-safety features stay **free for everyone**, always — duty of care is independent
  of payment.
- Selling the subscription does not change any of the above.

---

## 3. Revenue model (sequenced, not parallel)

The three models the owner is drawn to map to a **timeline**, not competing bets:

| Phase | Model | When | Why this order |
|---|---|---|---|
| **Now** | Freemium → B2C subscription | 2026 H2 | Only path to income without re-opening HIPAA. Scales without owner's time. |
| **Later** | Consulting / B2B to practitioners | 2027+ | Higher contract value but slower; **B2B clinician workspace is blocked by ADR-009** until `huxley-clinical` exists. |
| **Dropped for now** | 1:1 services delivered by owner | — | Owner is not in a position to add this. May revisit downstream. |

**Primary goal:** replace/supplement owner income. Honest expectation below (§7).

---

## 4. How money reaches the bank account (the "plumbing")

Already in place: **legal entity + business bank account (Alleviation Therapeutics).** That's
the hardest step done.

To wire in payments:

1. **Stripe** under Alleviation Therapeutics → payout rail to the existing business bank
   account (~3% fee, ~2-day payout).
2. **RevenueCat** (free under $2.5k/mo revenue) → single subscription system across App
   Store, Play Store, and Stripe web. Avoids hardcoding Apple/Google billing logic.
3. **Web-first selling:** sell the subscription on the existing landing page (Stripe, ~3%)
   and have the app unlock for the logged-in payer. This avoids Apple/Google's **15–30%**
   cut on in-app purchases. (Caveat: Apple's external-link rules are finicky — verify
   current policy before launch. If in doubt, ship IAP first via RevenueCat, add web later.)

**Platform-fee reality:**

| Sell where | Processor | Their cut |
|---|---|---|
| In-app (IAP/Play Billing) | Apple / Google — mandatory for digital goods | 15% (<$1M/yr Small Business Program) – 30% |
| Web page → app unlocks | Stripe via RevenueCat | ~3% |

---

## 5. Pricing & the free/paid line

**Tiers (starting hypothesis — validate, don't anchor):**

- **Free:** daily journal, glimmers/triggers tracking, basic exercises, onboarding,
  **all crisis resources**.
- **Premium — ~$9.99/mo or ~$59.99/yr:**
  - **Huxley AI guide** (the differentiator AND the main marginal cost — gate it)
  - Full 160-exercise library + RAG depth
  - Insights/trends charts
  - Integration summaries / export
  - Curriculum trail

**Why gate the AI:** marginal cost per user ≈ Claude API calls. The paid feature should be
the thing that costs money to serve, so unit economics stay positive. See
`context/features/monetization-paywall.md` for the exact gating map.

Offer an **annual plan** (better cash flow + lower churn) and consider a **7-day free
trial** of premium to drive conversion.

---

## 6. Unit economics (the thing that kills wellness apps)

Watch **(monthly revenue per paying user) − (their API + infra cost)** and keep it solidly
positive.

- Cost drivers: Anthropic Claude API (per-message), Supabase, OpenAI embeddings (RAG),
  Sentry, EAS.
- A free user who hammers Huxley loses money → that's *why* Huxley is premium-gated.
- The existing **AI metrics dashboard (FEAT-203)** already captures most of what's needed;
  add a **cost-per-user** view to it before/around launch.

---

## 7. Honest revenue expectation (so the plan isn't fantasy)

- Consumer wellness subs convert at roughly **1–5% of installs** and churn quickly.
- "Replace income" via pure B2C realistically needs **thousands of installs** and is a
  **12–18 month compounding effort** for a solo founder.
- Implication: treat 2026 H2 as **validation + first dollars**, not income replacement.
  Income replacement is a 2027 question, likely accelerated later by consulting/B2B.

---

## 8. Costs to run (rough monthly, pre-scale)

| Item | Est. monthly |
|---|---|
| Supabase (standard tier) | $25+ |
| Anthropic API | usage-based — scales with active users |
| OpenAI embeddings | low / mostly one-time ingestion |
| Sentry (standard) | $0–26 |
| Apple Developer | $99/yr |
| Google Play | $25 one-time |
| EAS (Expo) | $0–99 |
| RevenueCat | $0 under $2.5k/mo revenue |
| Stripe | ~3% of revenue (no fixed) |

Legal review of Privacy/Terms (BUG-308) is a one-time professional cost still owed.

---

## 9. Go-to-market (lightweight, founder-led)

- Landing page + waitlist already exist (per git history) — convert waitlist to trial.
- Channels that fit a non-clinical wellness/psychedelic-integration audience: content
  (the journal chapters → education surface), community/Reddit, practitioner word-of-mouth
  (without crossing into clinical claims).
- Brand: **Multitudes** (Whitman + IFS + polyvagal triple meaning). Codebase rename from
  Huxley is a separate tracked effort.

---

## 10. Milestones

| When | Milestone |
|---|---|
| 2026 H2 | Stripe + RevenueCat wired; paywall shipped; first paying users; legal review closed (BUG-308) |
| 2026 H2 | Web subscription page live to dodge platform fees |
| 2027 H1 | Validate retention + unit economics; decide on consulting/B2B |
| 2027+ | If B2B demand is real → scope `huxley-clinical` (HIPAA, separate Supabase + BAAs) |

---

## 11. Open questions / risks

1. **Apple external-link policy** — confirm current rules before betting on web-first.
2. **Churn** — wellness apps churn hard; annual plans + habit features (journal streaks
   minus the streak-shaming per `project_feature_curriculum_trail`) mitigate.
3. **AI cost spikes** — set Anthropic budget alerts (50/80/100%) per production-readiness
   plan; a runaway premium user shouldn't surprise the bank account.
4. **Legal review (BUG-308)** still open — close before charging money.
5. **Rebrand timing** — launch as Huxley or Multitudes? Marketing wants Multitudes.

---

## Links

- ADR-009 HIPAA posture (the master constraint): `context/decisions/2026-05-05-hipaa-posture.md`
- ADR-010 web admin dashboard: `context/decisions/2026-06-02-web-admin-dashboard.md`
- Cost model + profitability: `context/business/cost-model.md`
- Financial model (editable assumptions): `context/business/financial-model.md`
- Distribution / go-to-market: `context/business/distribution.md`
- Tier 1 relationship execution: `context/business/tier1-relationship-strategy.md`
- B2B path (the $5k alternative): `context/business/b2b-path.md`
- Paywall / feature-gating spec: `context/features/monetization-paywall.md`
- Prompt caching plan (margin lever): `context/features/prompt-caching-plan.md`
- Prompt caching implementation prompts: `context/features/prompt-caching-prompts.md`
- Production Readiness roadmap: `context/roadmap/production-readiness.md`
- Status: `context/STATUS.md`
