# ADR-010: Separate Web Admin Dashboard (analytics/cost out of the consumer app)

**Date:** 2026-06-02
**Status:** Accepted
**Deciders:** Project Lead

## Context

We need a cost-per-user / AI-economics dashboard (and other admin analytics) to manage unit
economics as monetization launches (see `context/business/cost-model.md`). An in-app
`AdminMetricsDashboard.js` already exists in the React Native consumer app, but cramming
richer analytics (cost-per-user breakdowns, charts, CSV export) into a phone screen is
awkward, ships admin-only code to every user's device, and forces an app-store update for
every dashboard change.

Separately, the monetization plan wants a **web checkout page** (sell subscriptions on the
web to avoid the Apple/Google 15–30% platform fee — see `monetization-paywall.md`). That is
also a web property.

## Decision

Build admin analytics (starting with the cost-per-user dashboard) as a **separate web
application**, not as screens inside the consumer React Native app. It reads the same
Supabase project (same `ai_metrics`, `user_api_usage_summary`, etc.), gated to admins via the
existing `is_admin()` / `user_roles` model. The same web property will later host the web
subscription checkout page.

## Rationale

1. **Keep admin code out of the consumer bundle.** Smaller app, less attack surface, no
   admin logic on user devices.
2. **Iterate without store review.** Dashboard changes deploy as a web push, not an app
   release.
3. **Better tooling for analytics.** Web gives real charting libs, tables, CSV export — all
   painful in React Native.
4. **Reuse the backend.** Supabase RLS + `is_admin()` already exist; the web app is just
   another client of the same Postgres.
5. **Consolidates the web surface.** Admin dashboard + future web checkout + the existing
   landing page can live under one web property/repo.

## Consequences

### Positive
- Clean separation of concerns (consumer app vs. operator tools).
- Faster analytics iteration.
- Natural home for web checkout (platform-fee savings).

### Negative
- A second codebase/deploy to maintain (small, but real).
- Need auth wiring for admin login on web (Supabase Auth supports this directly).

### Neutral
- The existing in-app `AdminMetricsDashboard.js` can be left as-is or thinned over time;
  no urgent removal required.
- Cost figures depend on `metricsService` pricing accuracy — caching work (ADR-pending /
  `prompt-caching-plan.md`) must update `estimateCost()` so the dashboard stays truthful.

## Alternatives Considered

### Option 1: Improve the in-app dashboard
**Description:** Add cost-per-user views to `AdminMetricsDashboard.js` in React Native.
**Pros:** No new project; reuses existing screen.
**Cons:** Cramped on phone; ships admin code to all users; every change needs store review.
**Why not chosen:** Wrong long-term surface for operator analytics.

### Option 2: SQL views only, run in Supabase dashboard
**Description:** Create Postgres views (cost per user, blended, by engagement) and query them
manually in the Supabase SQL editor.
**Pros:** Zero new app code; fastest to first numbers.
**Cons:** No nice UI; manual; not shareable as a product surface; no checkout home.
**Why not chosen:** Good as an interim step, not the destination. (We will likely build the
SQL views first anyway as the data layer the web app reads.)

## Implementation Notes

- **Phase 0 (data layer, do first):** create Supabase SQL views — `v_cost_per_user`,
  `v_cost_blended`, `v_cost_by_engagement` — over `ai_metrics` priced with the same rates as
  `metricsService.CLAUDE_PRICING`. These are usable immediately in the Supabase SQL editor
  and become what the web app queries.
- **Stack suggestion:** Next.js (or Vite + React) + `@supabase/supabase-js`, deployed to
  Vercel/Netlify. Admin auth via Supabase Auth; gate on `is_admin()`.
- **Update `metricsService.estimateCost()`** to handle cached tokens before trusting cost
  numbers (see `prompt-caching-plan.md`), else the dashboard overstates cost post-caching.

## References

- Cost model: `context/business/cost-model.md`
- Paywall/monetization: `context/features/monetization-paywall.md`
- Prompt caching plan: `context/features/prompt-caching-plan.md`
- Existing in-app dashboard: `screens/AdminMetricsDashboard.js`
- Admin model: `lib/userRoleService.js`, `public.is_admin()`

---

**Supersedes:** None
**Superseded by:** None
