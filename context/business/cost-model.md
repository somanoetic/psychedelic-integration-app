# Cost Model — Per-User AI Economics

**Last Updated:** 2026-06-02
**Status:** Draft v1 (projections — replace with real data once the cost dashboard ships)
**Parent:** `context/business/BUSINESS-PLAN.md`

> All figures use the REAL pricing in `lib/metricsService.js` CLAUDE_PRICING:
> Sonnet 4.6 (`MODELS.PRIMARY`) = **$3.00 / 1M input tokens, $15.00 / 1M output tokens**.
> Embeddings (RAG retrieval) cost a fraction of a cent per query — folded into rounding.

---

## 1. Cost of one Huxley message

Prompts are RAG-augmented (system + Huxley identity + retrieved chunks + history), so input
tokens dominate.

| Scenario | Input tok | Output tok | Input $ | Output $ | **Cost / msg** |
|---|---|---|---|---|---|
| Lean | 2,000 | 350 | $0.0060 | $0.0053 | **$0.011** |
| **Typical** | 5,000 | 450 | $0.0150 | $0.0068 | **$0.022** |
| Heavy | 9,000 | 600 | $0.0270 | $0.0090 | **$0.036** |

Base case used below = **$0.022 (typical)**.

### ⚠️ Prompt caching changes everything (NOT yet implemented)
Codebase grep (2026-06-02): **no caching anywhere** — every message pays full $3/M for a
prefix that barely changes. Adding `cache_control` to the stable prefix (system + identity +
RAG) makes cached reads cost **$0.30/M instead of $3/M**. Typical message drops
**~$0.022 → ~$0.008** (≈3× margin improvement). See
`context/features/prompt-caching-plan.md`. Single change in the `claude-proxy` edge function
benefits all 35 AI services.

---

## 2. Monthly AI cost per user, by engagement (@ $0.022/msg)

| User type | Msgs/day | Msgs/mo | **AI $/user/mo** |
|---|---|---|---|
| Dabbler | ~1 | 30 | $0.66 |
| Light | 3 | 90 | $1.98 |
| Regular | 7 | 210 | $4.62 |
| Heavy | 15 | 450 | $9.90 |
| Power | 30 | 900 | $19.80 |

Worst case @ $0.036/msg: Regular $7.56 · Heavy $16.20 · Power $32.40.
With caching @ ~$0.008/msg: Regular ~$1.68 · Heavy ~$3.60 · Power ~$7.20.

---

## 3. Margin per paying user @ $9.99/mo

| Sell via | Net/mo | Regular ($4.62) | Heavy ($9.90) | Power ($19.80) |
|---|---|---|---|---|
| IAP @ 30% | $6.99 | +$2.37 🟢 | −$2.91 🔴 | −$12.81 🔴 |
| IAP @ 15% (Small Biz) | $8.49 | +$3.87 🟢 | −$1.41 🔴 | −$11.31 🔴 |
| Web/Stripe @ 3% | $9.69 | +$5.07 🟢 | −$0.21 🟡 | −$10.11 🔴 |

**Takeaways:**
1. Regular users are profitable on every channel.
2. Heavy/power users lose money **even at 0% platform fee** — the all-you-can-eat AI trap.
3. Two fixes: **prompt caching** (shifts every column left ~3×) + **metered/capped AI**.
4. Platform fee swings margin by **$2.70/user/mo** → the reason to sell on web.

---

## 4. Blended cost per 1,000 signups (realistic mix, no caching)

| Segment | % | Users | $ each | Segment $ |
|---|---|---|---|---|
| Inactive/churned | 50% | 500 | ~$0 | $0 |
| Dabbler | 25% | 250 | $0.66 | $165 |
| Light | 15% | 150 | $1.98 | $297 |
| Regular | 8% | 80 | $4.62 | $370 |
| Heavy | 2% | 20 | $9.90 | $198 |
| **Total** | | 1,000 | | **~$1,030/mo AI** |

\+ fixed infra ~$50–150/mo (Supabase, Sentry, EAS) → **~$1,100–1,200/mo per 1,000 users.**

---

## 5. The decisive number: free-tier AI sinks you at low conversion

At 3% paid conversion (conservative wellness benchmark), 1,000 users = 30 subscribers:

| Scenario | Revenue/mo | Cost/mo | Net |
|---|---|---|---|
| **Huxley free for all** | $291 (30 × $9.69) | ~$1,150 | **−$859 🔴** |
| **Huxley gated/metered to premium** | $291 | ~$150 (infra only) | **+$141 🟢** |

→ **Gating or metering Huxley is non-negotiable.** Free-tier unlimited AI is the killer at
realistic conversion rates. Metering (e.g. 10 free AI msgs → paywall) doubles as a
conversion driver: users feel the value, then hit the wall.

---

## 6. What to do (priority order)

1. **Add prompt caching** (≈3× margin) — biggest lever, smallest change. See plan doc.
2. **Meter free Huxley** (cost cap + conversion driver).
3. **Sell on web** (reclaim $2.70/user/mo platform fee).
4. **Ship the cost-per-user dashboard** (web admin) so these projections → real data.
5. Optional **soft per-user message cap** even for premium, to bound worst case.

---

## Links

- Business plan: `context/business/BUSINESS-PLAN.md`
- Caching plan: `context/features/prompt-caching-plan.md`
- Paywall spec: `context/features/monetization-paywall.md`
- Web admin ADR: `context/decisions/2026-06-02-web-admin-dashboard.md`
- Pricing source of truth: `lib/metricsService.js` (CLAUDE_PRICING)
