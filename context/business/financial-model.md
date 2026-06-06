# Financial Model — Multitudes

**Last Updated:** 2026-06-02
**Status:** Draft v1 (assumption-driven projection — edit the assumptions, re-read the outcomes)
**Parent:** `context/business/BUSINESS-PLAN.md`

> This is a transparent, hand-computable model. Every assumption is named and editable. It is
> NOT a forecast — it's a way to see how outcomes move when you change beliefs. Replace
> assumptions with real data from the web admin dashboard (ADR-010) as it arrives.

---

## 1. Editable assumptions (change these)

| # | Assumption | Base | Optimistic | Pessimistic |
|---|---|---|---|---|
| A1 | Price (monthly) | $9.99 | $12.99 | $7.99 |
| A2 | Net after fees (web/Stripe ~3%) | $9.69 | $12.60 | $7.75 |
| A3 | Free→paid conversion | 3% | 5% | 1.5% |
| A4 | Monthly churn (of paying subs) | 6% | 4% | 9% |
| A5 | Avg AI cost / paying user / mo (metered, NO caching) | $4.50 | $3.00 | $7.00 |
| A6 | Avg AI cost / paying user / mo (WITH caching) | $1.60 | $1.00 | $2.50 |
| A7 | Fixed infra / mo (small scale) | $150 | $100 | $400 |
| A8 | Annual-plan uptake (better cash flow, lower churn) | 30% | 50% | 10% |

Conversion/churn ranges are typical consumer-wellness benchmarks. AI cost from
`cost-model.md` (real Sonnet 4.6 pricing). Caching (A6) is the ~3× lever and assumes
`prompt-caching-plan.md` is implemented.

---

## 2. Per-subscriber unit economics (base case, WITH caching)

```
Gross revenue / sub / mo      = $9.69   (A2)
- AI cost / sub / mo          = $1.60   (A6)
= Contribution margin / sub   = $8.09   (≈ 83% margin)
```

Without caching (A5 = $4.50): margin = $5.19/sub (~54%). Caching adds ~$2.90/sub/mo straight
to the bottom line — at 300 subs that's ~$870/mo found money.

**LTV (lifetime value):**
```
Avg subscriber lifetime = 1 / churn = 1 / 0.06 = ~16.7 months
LTV (with caching)      = $8.09 × 16.7 = ~$135 per subscriber
LTV (no caching)        = $5.19 × 16.7 = ~$87 per subscriber
```
This is your ceiling for customer acquisition cost (CAC). Keep **CAC < LTV/3** (~$45) to
grow healthily on paid channels.

---

## 3. Monthly P&L at different subscriber counts (base, WITH caching)

Net/mo = (subs × $8.09 contribution) − $150 fixed.

| Active subs | Contribution | − Fixed | **Net / mo** | Note |
|---|---|---|---|---|
| 19 | $154 | $150 | **~$0** | break-even |
| 50 | $405 | $150 | **+$255** | covers infra + a little |
| 100 | $809 | $150 | **+$659** | |
| 280 | $2,265 | $150 | **+$2,115** | ramen / side income |
| 650 | $5,259 | $150 | **+$5,109** | income replacement |
| 1,300 | $10,517 | $150 | **+$10,367** | real income |

WITHOUT caching, the same rows roughly halve the net (e.g. 650 subs → ~$3,200/mo not $5,100)
— which is the entire argument for shipping caching before scaling.

---

## 4. Installs needed (links subs → distribution reality)

Active subs ≈ installs × conversion × (subs that stay). Using A3 = 3% conversion as the
steady-state active-paying fraction of cumulative installs (a simplification that already
nets out churn for a roughly stable base):

| Net/mo goal | Active subs | Installs @3% (A3 base) | Installs @5% (optimistic) | Installs @1.5% (pessimistic) |
|---|---|---|---|---|
| Break-even | ~19 | ~650 | ~400 | ~1,300 |
| Side income $2k | ~280 | ~9,300 | ~5,600 | ~18,700 |
| Replace $5k | ~650 | ~21,700 | ~13,000 | ~43,300 |
| Real $10k | ~1,300 | ~43,300 | ~26,000 | ~86,700 |

**Read this against `distribution.md`:** break-even (~650 installs) is very reachable via
Tier-1 relationships alone. The $5k row (~13k–43k installs) is the hard wall for pure B2C —
which is why `b2b-path.md` exists (same $5k via ~15–25 B2B customers, not tens of thousands
of installs).

---

## 5. The two levers that move everything

1. **Caching (A5→A6):** ~+$2.90/sub/mo margin, ~3× LTV improvement. One code change.
   Highest ROI action in the whole plan. Do it before scaling.
2. **Conversion (A3):** moving 3%→5% cuts required installs by 40% at every goal. Driven by
   the metered-Huxley paywall (feel-the-value-then-wall) + a genuinely useful free tier +
   trial. This is product/paywall tuning, measured in beta.

Churn (A4) is the silent third lever — annual plans (A8) and habit features (journal,
glimmers, curriculum trail) lower it; a 6%→4% churn lifts LTV ~50%.

---

## 6. Cash-flow / runway note

- Annual plans (A8) front-load cash: a $59.99 annual sub is ~$58 net up front vs ~$9.69/mo —
  great for a bootstrapped solo founder's runway, and the upfront commitment lowers churn.
- B2B-Lite cohort sales (b2b-path.md) are lump-sum invoices (Stripe, ~3%, direct to bank) —
  lumpy but high-value and immediate.
- Keep Anthropic budget alerts (50/80/100%) so a usage spike can't outrun revenue.

---

## 7. How to replace these guesses with truth

Order of confidence-building:
1. Ship caching → measure real A5/A6 from the cost dashboard.
2. Run the paid beta → measure real A3 (conversion) and A4 (churn).
3. Track installs-by-channel (distribution.md §6) → real install→sub funnel.
4. Re-run this table with real numbers; decide B2C-scale vs B2B-pivot from evidence.

---

## Links

- Cost model (AI cost basis): `context/business/cost-model.md`
- Distribution (install reachability): `context/business/distribution.md`
- B2B path (the $5k alternative): `context/business/b2b-path.md`
- Paywall (conversion lever): `context/features/monetization-paywall.md`
- Caching (margin lever): `context/features/prompt-caching-plan.md`
