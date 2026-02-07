# Context Management System

This directory contains modular, lightweight files for tracking project status, bugs, features, and roadmap.

## Why This System?

**Problem:** Large documentation files (1000+ lines) become hard to navigate and maintain.

**Solution:** Break into focused files (<300 lines each) organized by category.

## Directory Structure

```
context/
├── README.md                 # This file - navigation hub
├── STATUS.md                 # Current project status (what's done, what's next)
├── bugs/                     # Active bugs and issues
│   ├── INDEX.md             # Bug tracker overview
│   ├── critical.md          # P0 - Critical bugs
│   ├── high.md              # P1 - High priority bugs
│   └── medium-low.md        # P2-P3 - Lower priority
├── features/                 # Feature requests and enhancements
│   ├── INDEX.md             # Feature backlog overview
│   ├── in-progress.md       # Currently being worked on
│   ├── planned.md           # Committed for next phase
│   └── ideas.md             # Future considerations
├── roadmap/                  # Planning and timeline
│   ├── INDEX.md             # Roadmap overview
│   ├── current-phase.md     # What we're working on now
│   ├── next-phase.md        # What's next
│   └── future.md            # Long-term vision
└── decisions/                # Architecture decisions and key choices
    ├── INDEX.md             # Decision log
    └── [date]-[topic].md    # Individual ADRs
```

## Quick Start

**To add a bug:**
1. Open appropriate priority file in `bugs/`
2. Add entry with template below
3. Update `bugs/INDEX.md` count

**To track a feature:**
1. Add to `features/ideas.md` first
2. Move to `features/planned.md` when committed
3. Move to `features/in-progress.md` when started
4. Remove when complete (add to changelog)

**To update roadmap:**
1. Edit `roadmap/current-phase.md` for active work
2. Edit `roadmap/next-phase.md` for upcoming
3. Keep files focused on next 4-8 weeks

## File Size Limits

**Target:** Keep each file under 300 lines
- If a file exceeds 300 lines, split it
- Use separate files for different priorities/categories
- Link between files using markdown links

## Templates

### Bug Entry Template
```markdown
### [Bug Title]
**ID:** BUG-XXX
**Priority:** Critical/High/Medium/Low
**Status:** Open/In Progress/Blocked/Resolved
**Reported:** YYYY-MM-DD
**Assigned:** Name (if applicable)

**Description:**
Clear description of the bug

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Expected vs actual behavior

**Environment:**
- Device/OS:
- Version:

**Proposed Solution:**
Ideas for fixing

**Notes:**
Additional context
```

### Feature Entry Template
```markdown
### [Feature Name]
**ID:** FEAT-XXX
**Priority:** High/Medium/Low
**Status:** Idea/Planned/In Progress/Complete
**Proposed:** YYYY-MM-DD
**Target Phase:** Phase X

**User Story:**
As a [user], I want [feature] so that [benefit]

**Requirements:**
- [ ] Requirement 1
- [ ] Requirement 2

**Technical Notes:**
Implementation considerations

**Dependencies:**
What must be done first

**Estimated Effort:**
Days/weeks
```

### Decision Record Template
```markdown
# [Decision Title]

**Date:** YYYY-MM-DD
**Status:** Proposed/Accepted/Superseded
**Deciders:** Names

## Context
What's the issue we're facing?

## Decision
What did we decide?

## Consequences
What are the implications?

## Alternatives Considered
What else did we think about?
```

## Workflow

### Weekly Review Process
1. Review `STATUS.md` and update current state
2. Check `bugs/critical.md` and `bugs/high.md` - address blockers
3. Update `roadmap/current-phase.md` with progress
4. Move completed items out, archive if needed
5. Pull 1-2 items from `features/planned.md` to `in-progress.md`

### Monthly Cleanup
1. Archive resolved bugs older than 30 days
2. Review `features/ideas.md` - remove stale ideas
3. Update long-term roadmap based on learnings
4. Prune files that exceed 300 lines

## File Ownership

**STATUS.md** - Updated weekly by project lead
**bugs/** - Updated by developers as bugs found/fixed
**features/** - Updated by product owner / team lead
**roadmap/** - Updated by project lead after sprint planning
**decisions/** - Added when significant choices made

## Integration with Existing Docs

**Keep:**
- `BUGS_AND_FEATURE_REQUESTS.md` - Archived as reference
- `ACTION_PLAN.md` - Archived as reference
- Technical guides in root (setup, deployment, etc.)
- Knowledge base for content/research

**Migrate:**
- Active bugs → `context/bugs/`
- Active features → `context/features/`
- Timeline → `context/roadmap/`

## Navigation Tips

**Start here:** `context/README.md` (this file)
**What's happening now:** `context/STATUS.md`
**What's broken:** `context/bugs/INDEX.md`
**What's next:** `context/roadmap/current-phase.md`
**Big picture:** `context/roadmap/INDEX.md`

---

**Created:** 2026-02-07
**Last Updated:** 2026-02-07
**Maintained By:** Project Team
