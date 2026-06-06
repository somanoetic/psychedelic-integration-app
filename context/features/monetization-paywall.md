# FEAT — Monetization & Paywall (Premium Subscription)

**Status:** Planned (spec)
**Created:** 2026-06-02
**Priority:** High (gates the entire B2C revenue model)
**Effort:** Large (1–2 weeks for v1, excluding store review time)
**Depends on:** ADR-009 (positioning), BUG-308 (legal review), FEAT-203 (AI metrics → cost view)
**Parent:** `context/business/BUSINESS-PLAN.md`

> This spec defines the free/paid line, the entitlement architecture, and the build steps.
> It deliberately does NOT pick final prices — those are a market-validation decision.

---

## 1. Goal

Introduce a **Premium subscription** that unlocks the high-value, high-cost features while
keeping a genuinely useful free tier and keeping all crisis-safety features free.

---

## 2. Hard constraints (from ADR-009)

- **Crisis features are NEVER gated.** `FindSupportScreen`, crisis detection/escalation in
  Huxley, and any 988/safety resource must work for free, signed-out-grade users.
- Marketing/paywall copy uses wellness language only. No "treatment/therapy/clinical."
- No clinician-workspace features are part of this (that's blocked v2 work).

---

## 3. The free / premium line

Mapping to real screens (see `screens/`). **Gate = requires active premium entitlement.**

### Free (acquisition + habit + safety)
| Surface | Screen(s) | Rationale |
|---|---|---|
| Daily journal | `DailyJournal` component / Journal tab | Habit driver; low marginal cost |
| Glimmers / triggers tracking | `GlimmerTracker`, `TriggerTracker`, `DailyGlimmersPractice` | Habit driver, cheap |
| Basic exercises (subset) | `ExerciseLibraryScreen` (bundled subset) | Taste of value |
| Onboarding + disclosure | `OnboardingCarousel`, `NonClinicalDisclosureScreen` | Required path |
| **Crisis & support** | `FindSupportScreen`, Huxley crisis flow | **Never gated — duty of care** |
| Account / settings / data export | `SettingsScreen` | Trust; legal (export must stay free) |

### Premium (differentiator + marginal cost)
| Surface | Screen(s) | Why premium |
|---|---|---|
| **Huxley AI guide** | `HuxleyChatScreen`, `HuxleyChatModal`, conversational flows | Main differentiator AND main per-user API cost |
| Full exercise library + RAG depth | `ExerciseLibraryScreen` (full), `GuidedExerciseScreen` | Depth |
| AI-assisted intention / processing | `SetIntentionScreen`, `ProcessIntegrateScreen`, `TherapeuticIntegrationScreen`, `ExperienceMappingScreen`, `ActiveImaginationScreen` | AI cost |
| Insights / trends | `InsightsScreen` | High-value retention feature |
| Integration summaries / export-to-share | `IntegrationSummaryScreen` + summary screens | Premium polish |
| Curriculum trail | (planned) | Depth/retention |
| Nervous-system / parts AI check-ins | `InnerWorkScreen`, NS/parts flows | AI cost |

> **Tuning note:** the free/premium split above is the *starting hypothesis*. Watch
> activation: if free is too thin, conversion AND retention both drop.
>
> **DECISION (2026-06-02): meter Huxley rather than hard-wall it.** Give a free allowance
> (e.g. ~10 AI messages, tunable) then paywall. Two reasons: (1) the blended cost model shows
> unlimited free AI sinks the business at realistic conversion (see cost-model.md §5), and
> (2) letting users *feel* Huxley's value before the wall is a stronger conversion driver
> than locking it entirely. Implement as a per-user message counter checked in the proxy /
> entitlement layer; show a graceful "you've used your free sessions" paywall, not an error.

---

## 4. Entitlement architecture

Do NOT overload `user_roles` (user/contributor/admin = *authorization* tier). Subscription
state is an **orthogonal entitlement**. Keep them separate.

### Source of truth: RevenueCat
- RevenueCat is the cross-platform subscription system (App Store + Play + Stripe web).
- Client reads entitlement from the RevenueCat SDK: `entitlements.active["premium"]`.
- **Server-side mirror (recommended):** RevenueCat webhook → Supabase Edge Function →
  `subscriptions` table (`user_id`, `status`, `product_id`, `expires_at`, `store`,
  `updated_at`), RLS = owner-read-only. This lets RLS / server logic trust entitlement and
  prevents a jailbroken client from faking premium for server-side AI calls.

### New service: `lib/entitlementService.js`
Mirror the shape of `userRoleService` (cache + async getter):
- `getEntitlement()` → `{ isPremium: boolean, expiresAt, store, source }`
- `isPremium()` → boolean (cached, like `roleCache`)
- `refresh()` → re-pull from RevenueCat after purchase/restore
- Admins/contributors: grant premium implicitly (so the owner + reviewers aren't paywalled).
  `isPremium = revenueCatActive || role in ('admin','contributor')`.

### Gating UI: `<PremiumGate>` component
- Wraps a screen or feature. If `!isPremium`, renders the **paywall** (or a metered
  countdown for Huxley) instead of the feature.
- Single chokepoint so we don't sprinkle `if (premium)` everywhere.

### Paywall screen: `screens/PaywallScreen.js`
- Plans (monthly / annual), trial CTA, restore-purchases button (Apple requires it),
  feature list, links to Terms/Privacy.
- Buttons call RevenueCat `purchasePackage()`; on success → `entitlementService.refresh()`
  → dismiss.

---

## 5. Payment plumbing (build order)

1. **Stripe** account under Alleviation Therapeutics → existing business bank account.
2. **RevenueCat** project; configure entitlement `premium`, products (monthly/annual),
   offerings. Wire App Store Connect + Play Console products.
3. Install `react-native-purchases` (RevenueCat SDK) in the Expo app (config plugin).
4. `entitlementService.js` + `<PremiumGate>` + `PaywallScreen`.
5. Apply gates to the premium surfaces in §3.
6. **Server mirror:** RevenueCat webhook → Supabase Edge Function → `subscriptions` table;
   server-side AI entry points check it before spending Anthropic tokens.
7. **(Later) Web checkout:** Stripe page on the landing site → RevenueCat web billing →
   app unlocks for logged-in payer. Dodges the 15–30% platform fee. Verify Apple's
   external-link policy first.

---

## 6. Cost-control coupling (do NOT skip)

- **Prompt caching is unimplemented** (grep 2026-06-02: zero `cache_control` anywhere).
  Adding it is the biggest margin lever (~3×) and lives in one chokepoint. Do this BEFORE
  or alongside launch. See `context/features/prompt-caching-plan.md`.
- Gating/metering Huxley is the primary cost control.
- Add **cost-per-user** to the AI metrics dashboard (FEAT-203) so a runaway premium user is
  visible.
- Set **Anthropic budget alerts** (50/80/100%) — already on the production-readiness list.
- Consider a **per-user monthly AI message soft-cap** even for premium, with graceful
  messaging, to bound worst-case cost.

---

## 7. Store / legal checklist

- [ ] BUG-308 legal review closed before charging.
- [ ] Paywall copy reviewed against ADR-009 language guardrails.
- [ ] Restore-purchases implemented (Apple requirement).
- [ ] Subscription terms + auto-renew disclosure on the paywall (store requirement).
- [ ] Privacy Policy mentions payment processor (Stripe/RevenueCat) data handling.
- [ ] Free tier remains genuinely functional (Apple rejects "ransom-ware" paywalls).
- [ ] Crisis features verified reachable without premium.

---

## 8. Open decisions (for beta)

1. Hard wall vs. **metered** Huxley free allowance.
2. Final price points (anchor: ~$9.99/mo, ~$59.99/yr) + trial length (anchor: 7 days).
3. Launch under "Huxley" or "Multitudes" branding.
4. Web-first vs. IAP-first at launch (depends on Apple policy check).

---

## Links

- Business plan: `context/business/BUSINESS-PLAN.md`
- HIPAA/positioning: `context/decisions/2026-05-05-hipaa-posture.md`
- AI metrics (cost view): FEAT-203
- Legal review: BUG-308
