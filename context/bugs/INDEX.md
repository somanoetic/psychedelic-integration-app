# Bug Tracker Index

**Last Updated:** 2026-05-11

---

## Overview

Bugs are organized by priority across three files to keep each manageable.

## File Organization

| File | Priority | Description | Count |
|------|----------|-------------|-------|
| [critical.md](critical.md) | P0 | Show-stoppers, crashes, security issues | 0 active |
| [high.md](high.md) | P1 | Major issues affecting key features | 0 active (17 resolved) |
| [medium-low.md](medium-low.md) | P2-P3 | Minor issues, polish, edge cases | 8 active (18 resolved) |
| [resolved.md](resolved.md) | -- | Archived resolved bugs | 28 resolved |

**Total Active Bugs:** 8 (40 resolved)

---

## Priority Definitions

### P0 - Critical
- App crashes or is unusable
- Data loss or corruption
- Security vulnerabilities
- Blocks core user flows
- **SLA:** Fix within 24-48 hours

### P1 - High
- Major feature broken or degraded
- Significant UX issues
- Affects multiple users
- Workaround exists but awkward
- **SLA:** Fix within 1 week

### P2 - Medium
- Feature works but with issues
- Affects specific use cases
- Has reasonable workaround
- **SLA:** Fix within 2-4 weeks

### P3 - Low
- Minor cosmetic issues
- Edge cases
- Nice-to-have fixes
- **SLA:** Fix when time permits

---

## Quick Stats

**By Status:**
- Open: 8
- In Progress: 0
- Blocked: 0
- Resolved (last 30 days): 40

**By Category:**
- UI/UX: 1 open (BUG-213)
- Platform/Build: 1 open (BUG-306 — iOS beta stale)
- Production-readiness: 2 open (BUG-307 Sentry env, BUG-308 legal review)
- Observability: 1 open (BUG-309 — AI metrics MVs missing)
- Notifications: 1 open (BUG-311 — no decision emails)
- Performance: 1 open (BUG-301)
- Documentation: 1 open (BUG-303, in progress)

---

## Recent Activity

**Week of 2026-05-05:**
- Added: BUG-307 (Sentry DSN hardcoded — move to env)
- Added: BUG-308 (Privacy Policy + Terms need legal review)
- Added: BUG-309 (AI Metrics dashboard — materialized views missing in live DB)
- Added: BUG-311 (No email notifications on admin application decisions — surfaced during B1 smoke test)
- Production Readiness phase planned (see context/roadmap/production-readiness.md)

**Week of 2026-04-02:**
- Added: BUG-221 (No crash reporting — Sentry removed, need replacement)
- Added: BUG-306 (iOS beta build stale — needs rebuild + full regression)

**Week of 2026-03-08:**
- Added: BUG-215 (Experience Processing conversation window too small)
- Added: BUG-216 (Excessive bottom padding below input on conversation screens)

**Week of 2026-03-03:**
- Resolved: BUG-114 (Save Intention button)
- Resolved: BUG-206 (VirtualizedList warning)
- Resolved: BUG-214 (Set Intention chat cut off)
- Resolved: BUG-207 (ai_metrics table created)
- Resolved: BUG-204 (selector affordance — not applicable)
- Resolved: BUG-208 (opening statement variability)

**Week of 2026-02-24:**
- Resolved: BUG-105 through BUG-113 (9 bugs total)
- Resolved: BUG-203, BUG-209, BUG-210, BUG-211, BUG-212

**Week of 2026-02-08:**
- Resolved: BUG-001, BUG-002, BUG-003, BUG-004 (all P0 security/infra)
- Resolved: BUG-103 (git repository cleanup)

---

## How to Use

### Reporting a New Bug
1. Determine priority (P0-P3)
2. Open appropriate file
3. Add using template from [context/README.md](../README.md)
4. Update counts in this INDEX.md

### Fixing a Bug
1. Mark status as "In Progress"
2. Add your name to "Assigned"
3. When fixed, move to "Resolved" with date
4. After 30 days, archive or remove

### Bug Review Meeting
- Weekly review of P0/P1 bugs
- Monthly cleanup of resolved bugs
- Quarterly review of P2/P3 backlog

---

## Links

- [Critical Bugs (P0)](critical.md)
- [High Priority Bugs (P1)](high.md)
- [Medium/Low Priority Bugs (P2-P3)](medium-low.md)
- [Resolved Bugs Archive](resolved.md)
- [Status Overview](../STATUS.md)
- [Current Roadmap](../roadmap/current-phase.md)

---

**Maintained By:** Development Team
**Review Cadence:** Weekly
