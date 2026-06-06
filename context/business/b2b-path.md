# B2B Path — Multitudes for Practitioners

**Last Updated:** 2026-06-02
**Status:** Draft v1 (future track — do NOT build the HIPAA workspace under current ADR-009)
**Parent:** `context/business/BUSINESS-PLAN.md`

> Why this doc exists: every analysis (cost-model, distribution) keeps concluding that pure
> B2C tops out short of full income replacement for a solo founder in this niche, while a
> handful of B2B customers reaches the same revenue with ~15–25 *customers* instead of ~25k
> installs. This is the more probable route to a living — scope it now, build it later.

---

## 1. The core tension (read first)

ADR-009 says Multitudes is a **non-HIPAA consumer wellness tool**. The thing clinics would
pay most for — an **in-app clinician workspace** (named client roster, assign work, watch
their responses) — is exactly what triggers HIPAA and is **explicitly forbidden** under
ADR-009 (Pattern C). So B2B splits into two very different products:

- **B2B-Lite (allowed NOW, no HIPAA):** sell to practitioners/centers WITHOUT building a
  client-data workspace. Revenue without re-opening the HIPAA decision.
- **B2B-Clinical (`multitudes-clinical`, future):** the real workspace. Requires the full
  HIPAA stack (separate Supabase, BAAs with Anthropic/Supabase/Sentry, enterprise Anthropic
  key, audit logging, Privacy Officer). A multi-month, capital-dependent v2.

Start with B2B-Lite. It's real money and breaks zero rules.

---

## 2. B2B-Lite offerings (buildable under ADR-009 today)

These all stay inside ADR-009's allowed patterns (A: user-initiated outbound sharing;
B: practitioner-curated public library). No client data flows TO the practitioner in-app.

| Offering | What it is | Price hypothesis | ADR-009 fit |
|---|---|---|---|
| **Practitioner seats / comped accounts** | Practitioner uses Multitudes themselves + recommends to clients as self-directed homework | $0 (loss-leader) → drives B2C | Pattern A/B; outside-app handoff |
| **Bulk / cohort codes** | Retreat center buys a block of premium codes, hands one to each participant post-experience | Per-seat, e.g. $5–8/participant/mo or one-time cohort fee | Center pays; participant uses self-directed |
| **Co-branded / white-label-lite** | Center's logo + a custom welcome; same app, no client-data back-channel | Setup fee + per-seat | Cosmetic only; no workspace |
| **Practitioner content publishing** | Verified practitioners publish exercises to the public library (already built: contributed_exercises) | Free (supply) or paid "featured" tier | Pattern B (public library) |
| **Integration program licensing** | License the structured journal/curriculum as a center's official integration program | Annual license | Content license, not a workspace |

**The wedge:** retreat centers and ketamine clinics have a real, unsolved problem — "what do
we give clients for integration *after* they leave?" Multitudes is a ready answer. Selling
them cohort codes is B2B revenue that needs no HIPAA and no new clinical features.

---

## 3. B2B-Clinical (future `multitudes-clinical` — scoped, not built)

The workspace practitioners actually want long-term:
- Named client roster, assign exercises/worksheets, see responses, track completion.
- This is **Pattern C** → HIPAA-covered Business Associate relationship → full stack.

**What it requires (the gate):**
- Separate `multitudes-clinical` Supabase project under a **BAA**.
- **BAA with Anthropic** (enterprise tier) + separate enterprise key; BAA with Sentry's
  HIPAA tier; BAA with any other PHI-touching vendor.
- Audit logging, breach-notification process, appointed Privacy Officer, written policies.
- Architectural data isolation from the consumer app.
- Legal: a real HIPAA review, not the consumer-app review (BUG-308).

**Pricing hypothesis (where the real money is):**
- Per-seat SaaS to practices: ~$30–80/practitioner/mo, or
- Per-client-active pricing, or
- Annual practice license $2k–10k+ depending on size.

**Reachability:** $5k/mo MRR = ~15–25 practitioner customers at $200–350/mo, OR a few
multi-seat practices. That is a *sales* problem (reachable with founder credibility), not a
*virality* problem (unreachable for a solo B2C app). This is the strategic reason B2B is the
likely path to a real living.

---

## 4. Decision sequence

1. **Now:** B2B-Lite cohort codes + practitioner seats. Build the minimal piece needed
   (bulk premium-code generation/redemption) — small, no HIPAA. Sell to the retreat/clinic
   relationships from distribution.md Tier 1.
2. **Validate:** Do centers actually pay? What's their willingness-to-pay per participant?
   Do practitioners ask for "can I see my clients' progress?" (that demand signal is the
   trigger for B2B-Clinical).
3. **Trigger for B2B-Clinical:** concrete, repeated demand + capital to fund the HIPAA stack
   + a re-decision superseding/extending ADR-009. Not before.

---

## 5. What to build for B2B-Lite (minimal)

- **Premium code system:** generate batches of redeemable codes that grant premium
  entitlement (ties into entitlementService from monetization-paywall.md). A center buys 50
  codes, hands them out. Redemption marks the user premium without a card.
- **Simple B2B invoicing:** Stripe invoices to the center (not app-store IAP — B2B is a
  real-world sale, ~3% fee, direct to bank).
- **Optional cohort attribution:** a code prefix per center so you can measure which partner
  drives activation (feeds the web admin dashboard).

Everything above is ADR-009-clean and reuses the entitlement layer you're already building.

---

## 6. Risks

1. **Scope creep into HIPAA.** The moment a center asks "can I see client responses," the
   answer under current ADR is *no, not in-app* — hold that line until B2B-Clinical is a
   funded, deliberate decision.
2. **Support burden.** B2B customers expect support; a solo founder must price that in.
3. **Sales cycle.** Centers/clinics buy slowly. Start the conversations early, expect months.

---

## Links

- HIPAA constraint (the master gate): `context/decisions/2026-05-05-hipaa-posture.md`
- Distribution (where B2B leads come from): `context/business/distribution.md`
- Entitlement layer (powers B2B codes): `context/features/monetization-paywall.md`
- Cost model / profitability: `context/business/cost-model.md`
- Existing contributor library: `lib/contributedExerciseService.js`
