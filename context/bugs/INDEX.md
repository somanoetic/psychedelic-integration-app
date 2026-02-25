# Bug Tracker Index

**Last Updated:** 2026-02-24

---

## Overview

Bugs are organized by priority across three files to keep each manageable.

## File Organization

| File | Priority | Description | Count |
|------|----------|-------------|-------|
| [critical.md](critical.md) | P0 | Show-stoppers, crashes, security issues | 0 active (5 resolved) |
| [high.md](high.md) | P1 | Major issues affecting key features | 3 active (11 resolved) |
| [medium-low.md](medium-low.md) | P2-P3 | Minor issues, polish, edge cases | 8 active (5 resolved) |

**Total Active Bugs:** 11 (21 resolved)

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
- Open: 11
- In Progress: 0
- Blocked: 0
- Resolved (last 30 days): 21

**By Category:**
- Infrastructure: 1 open (BUG-104)
- UI/UX: 5 open (BUG-101, BUG-204, BUG-206, BUG-208)
- Security: 0 open (all resolved)
- Performance: 2 open (BUG-301, BUG-302)
- Platform-specific: 1 open (BUG-102)
- Observability: 1 open (BUG-207)
- Documentation/Legal: 3 open (BUG-303, BUG-304, BUG-305)

---

## Recent Activity

**Week of 2026-02-24:**
- Resolved: BUG-105 (session creation navigation)
- Resolved: BUG-106 (keyboard covers input)
- Resolved: BUG-107 (Huxley theme/avatar)
- Resolved: BUG-108 (auto-scroll on messages)
- Resolved: BUG-109 (conversation draft persistence)
- Resolved: BUG-203 (no automated testing — 477 tests now passing)
- Resolved: BUG-110 (Learn/Sessions nav wrong routes)
- Resolved: BUG-111 (GlimmerSwiper crash on first swipe)
- Resolved: BUG-112 (ExperienceMapping no session data)
- Resolved: BUG-113 (CoreBeliefs user.id crash)
- Resolved: BUG-209 (Journal keyboard gap)
- Resolved: BUG-210 (RegulatingResources cut off)
- Resolved: BUG-211 (Quick Grounding nav to library)

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
- [Status Overview](../STATUS.md)
- [Current Roadmap](../roadmap/current-phase.md)

---

**Maintained By:** Development Team
**Review Cadence:** Weekly
