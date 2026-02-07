# ADR-001: Modular Context File System

**Date:** 2026-02-07
**Status:** Accepted
**Deciders:** Project Lead, AI Assistant

---

## Context

The project had grown large documentation files (BUGS_AND_FEATURE_REQUESTS.md at 1144 lines, ACTION_PLAN.md at 630 lines) that were becoming difficult to navigate and maintain.

**Problems:**
- Hard to find specific information quickly
- Files overwhelming to new contributors
- Difficult to update without merge conflicts
- No clear organization system
- Information scattered across many root-level .md files

**Need:**
A lightweight, scalable system for tracking bugs, features, and roadmap that stays maintainable as project grows.

---

## Decision

Implement a modular context file system with the following structure:

```
context/
├── README.md (navigation hub)
├── STATUS.md (weekly snapshot)
├── bugs/
│   ├── INDEX.md
│   ├── critical.md (P0)
│   ├── high.md (P1)
│   └── medium-low.md (P2-P3)
├── features/
│   ├── INDEX.md
│   ├── in-progress.md
│   ├── planned.md
│   └── ideas.md
├── roadmap/
│   ├── INDEX.md
│   ├── current-phase.md (2-4 weeks)
│   ├── next-phase.md (4-8 weeks)
│   └── future.md (8+ weeks)
└── decisions/
    ├── INDEX.md
    └── [date]-[topic].md (ADRs)
```

**Key Principles:**
1. **300-line limit per file** - Split when exceeded
2. **INDEX files for navigation** - Easy to find things
3. **Status-based organization** - Files organized by current state
4. **Templates for consistency** - Standardized formats
5. **Weekly updates** - STATUS.md refreshed regularly

---

## Rationale

**Why This Approach:**

1. **Modularity:** Small files easier to scan, edit, and navigate
2. **Scalability:** Can add more files as needed without bloat
3. **Clarity:** Clear organization by priority/status
4. **Accessibility:** INDEX files make it easy to find things
5. **Maintainability:** 300-line limit keeps files manageable
6. **git-friendly:** Smaller files reduce merge conflicts

**Why 300 Lines:**
- Fits on ~2-3 screens
- Long enough to be useful
- Short enough to scan quickly
- Forces good organization

**Why Status-Based:**
- Matches workflow (ideas → planned → in progress → done)
- Easy to see what's active
- Natural file movement as work progresses

---

## Consequences

### Positive ✅
- Much easier to find specific bugs or features
- New contributors can onboard faster
- Reduced cognitive overhead
- Better git commit granularity
- Scalable to hundreds of items

### Negative ⚠️
- More files to manage
- Need discipline to keep updated
- Migration effort from old files
- Team needs to learn new system

### Neutral ℹ️
- Old files (BUGS_AND_FEATURE_REQUESTS.md) archived for reference
- Weekly STATUS.md update becomes ritual
- Templates need to be followed

---

## Alternatives Considered

### Option 1: Keep Large Single Files
**Description:** Continue with BUGS_AND_FEATURE_REQUESTS.md style
**Pros:** Familiar, already exists, everything in one place
**Cons:** Already too large (1144 lines), hard to navigate, overwhelming
**Why not chosen:** Doesn't scale, already causing problems

### Option 2: Use Project Management Tool (Jira, Asana, etc.)
**Description:** Move tracking to dedicated PM software
**Pros:** Rich features, collaboration tools, reporting
**Cons:** External dependency, context switching, not in codebase, overkill for solo dev
**Why not chosen:** Want docs in repo, too heavy for current team size

### Option 3: GitHub Issues/Projects
**Description:** Use GitHub's built-in issue tracking
**Pros:** Integrated with code, labels, milestones
**Cons:** Not as flexible for planning, harder to see full context, requires internet
**Why not chosen:** Want offline access, more narrative documentation

### Option 4: Database/Spreadsheet
**Description:** Track in Notion, Airtable, or Excel
**Pros:** Queryable, sortable, rich formatting
**Cons:** Not in codebase, requires separate tool, harder to version control
**Why not chosen:** Want docs versioned with code

### Option 5: One File Per Item
**Description:** Each bug/feature gets own file
**Pros:** Ultimate modularity, very git-friendly
**Cons:** Too many files, navigation becomes difficult, overhead
**Why not chosen:** Too granular, balance between one huge file and hundreds of tiny files

---

## Implementation Notes

**Migration Plan:**
1. ✅ Create new structure
2. ✅ Migrate critical bugs
3. ✅ Migrate active features
4. ✅ Create roadmap
5. 🚧 Archive old files with note
6. 🚧 Update main README to point to context/

**Maintenance:**
- Weekly: Update STATUS.md
- Weekly: Review bugs/critical.md and bugs/high.md
- Monthly: Clean up resolved items
- Monthly: Reprioritize features/planned.md
- Quarterly: Prune features/ideas.md

**Enforcement:**
- Check file line counts during reviews
- Split files that exceed 300 lines
- Use templates for new entries
- Link between related items

---

## References

- [Markdown Architecture Decision Records](https://adr.github.io/madr/)
- Original issue tracking docs (archived):
  - `BUGS_AND_FEATURE_REQUESTS.md` (1144 lines)
  - `ACTION_PLAN.md` (630 lines)

---

## Review

**Works Well:**
- TBD (will update after 2 weeks of use)

**Needs Improvement:**
- TBD (will update after 2 weeks of use)

**Next Review:** 2026-02-21

---

**Status:** Accepted and Implemented
**Implementation Date:** 2026-02-07
