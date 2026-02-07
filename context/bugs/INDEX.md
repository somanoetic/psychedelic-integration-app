# Bug Tracker Index

**Last Updated:** 2026-02-07

---

## Overview

Bugs are organized by priority across three files to keep each manageable.

## File Organization

| File | Priority | Description | Count |
|------|----------|-------------|-------|
| [critical.md](critical.md) | P0 | Show-stoppers, crashes, security issues | 3 |
| [high.md](high.md) | P1 | Major issues affecting key features | 4 |
| [medium-low.md](medium-low.md) | P2-P3 | Minor issues, polish, edge cases | 6 |

**Total Active Bugs:** 13

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
- Open: 10
- In Progress: 2
- Blocked: 1
- Resolved (last 30 days): 3

**By Category:**
- Infrastructure: 3
- UI/UX: 4
- Security: 2
- Performance: 2
- Platform-specific: 2

---

## Recent Activity

**This Week:**
- Fixed: GlimmerSwiper crash
- Fixed: Config loading issues
- New: Context system migration needed

**Last Week:**
- Fixed: EAS Build validation errors
- Fixed: Android version numbering

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
