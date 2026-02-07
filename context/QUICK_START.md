# Context System Quick Start

**Get oriented in 5 minutes**

---

## New Here? Start With These 3 Files

1. **[STATUS.md](STATUS.md)** - What's happening now?
2. **[bugs/INDEX.md](bugs/INDEX.md)** - What's broken?
3. **[roadmap/current-phase.md](roadmap/current-phase.md)** - What are we working on?

---

## Common Tasks

### "What should I work on next?"
1. Check [roadmap/current-phase.md](roadmap/current-phase.md)
2. Look at [bugs/critical.md](bugs/critical.md) - any P0 bugs?
3. Check [features/in-progress.md](features/in-progress.md) - anything blocked?

### "I found a bug!"
1. Determine severity (P0-P3) - see [bugs/INDEX.md](bugs/INDEX.md)
2. Add to appropriate file:
   - P0 → [bugs/critical.md](bugs/critical.md)
   - P1 → [bugs/high.md](bugs/high.md)
   - P2-P3 → [bugs/medium-low.md](bugs/medium-low.md)
3. Use template from [README.md](README.md#bug-entry-template)
4. Update count in [bugs/INDEX.md](bugs/INDEX.md)

### "I have a feature idea!"
1. Add to [features/ideas.md](features/ideas.md)
2. Use template from [README.md](README.md#feature-entry-template)
3. Bring up in next planning meeting
4. May get moved to [features/planned.md](features/planned.md)

### "Where do I find...?"

**Big picture strategy** → [roadmap/future.md](roadmap/future.md)
**Next 2 weeks plan** → [roadmap/current-phase.md](roadmap/current-phase.md)
**All active bugs** → [bugs/INDEX.md](bugs/INDEX.md)
**Planned features** → [features/planned.md](features/planned.md)
**Why we made that choice** → [decisions/INDEX.md](decisions/INDEX.md)

---

## File Organization at a Glance

```
context/
│
├── 📄 STATUS.md              ← Start here! Weekly snapshot
├── 📄 README.md              ← Full guide & templates
├── 📄 QUICK_START.md         ← This file
│
├── 🐛 bugs/
│   ├── INDEX.md             ← Bug overview
│   ├── critical.md          ← P0: Fix ASAP
│   ├── high.md              ← P1: Fix soon
│   └── medium-low.md        ← P2-P3: Fix eventually
│
├── ✨ features/
│   ├── INDEX.md             ← Feature backlog
│   ├── in-progress.md       ← Building now
│   ├── planned.md           ← Building next
│   └── ideas.md             ← Maybe someday
│
├── 🗺️ roadmap/
│   ├── INDEX.md             ← Roadmap overview
│   ├── current-phase.md     ← Next 2-4 weeks
│   ├── next-phase.md        ← Next 4-8 weeks
│   └── future.md            ← Long-term vision
│
└── 📋 decisions/
    ├── INDEX.md             ← Decision log
    └── 2026-02-07-*.md      ← Individual ADRs
```

---

## Weekly Workflow

### Monday Morning (15 min)
1. Read [STATUS.md](STATUS.md)
2. Check [roadmap/current-phase.md](roadmap/current-phase.md) for week's goals
3. Review [bugs/critical.md](bugs/critical.md) and [bugs/high.md](bugs/high.md)

### Friday Afternoon (30 min)
1. Update [STATUS.md](STATUS.md) with progress
2. Move completed items to "Recently Completed" sections
3. Add any new bugs/features discovered
4. Update [roadmap/current-phase.md](roadmap/current-phase.md) progress

### End of Month (1 hour)
1. Archive resolved bugs older than 30 days
2. Review and reprioritize [features/planned.md](features/planned.md)
3. Update next phase roadmap
4. Clean up stale ideas from [features/ideas.md](features/ideas.md)

---

## Quick Reference

### Priority Levels

**Bugs:**
- **P0 (Critical):** App unusable, security issue, data loss
- **P1 (High):** Major feature broken, significant UX issue
- **P2 (Medium):** Feature works but has issues
- **P3 (Low):** Minor cosmetic, edge cases

**Features:**
- **High:** Core functionality, user-facing
- **Medium:** Nice to have, improves experience
- **Low:** Future consideration, not committed

### File Size Rule

**Each file max 300 lines**
- If file exceeds 300 lines, split it
- Create critical-2.md, high-2.md, etc.
- Keep INDEX files updated

---

## Who Updates What?

| File | Who | When |
|------|-----|------|
| STATUS.md | Project Lead | Weekly |
| bugs/*.md | Developers | As found/fixed |
| features/*.md | Product Owner | Planning meetings |
| roadmap/*.md | Project Lead | Weekly (current), Monthly (next/future) |
| decisions/*.md | Team | When decisions made |

---

## Pro Tips

**🔍 Finding Things Fast**
- Use INDEX files, don't search randomly
- Ctrl+F within files
- Check STATUS.md first

**📝 Keeping Files Clean**
- Use templates for consistency
- Link between related items (bugs → features, etc.)
- Remove completed items after 30 days

**⚡ Staying Productive**
- Don't over-document
- Keep entries concise
- Update as you go, not in batch

**🎯 Focused Work**
- Close tabs to everything except current-phase.md
- One file open = one focus
- Review full context weekly, not daily

---

## Questions?

**Full documentation:** [README.md](README.md)
**Current status:** [STATUS.md](STATUS.md)
**System decision record:** [decisions/2026-02-07-modular-context-system.md](decisions/2026-02-07-modular-context-system.md)

---

**Created:** 2026-02-07
**Keep this under 300 lines!** (Currently ~180)
