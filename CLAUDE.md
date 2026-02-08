# Claude AI Assistant Guide

**Project:** Psychedelic Integration App (Psycheteleos)
**Last Updated:** 2026-02-07

---

## 🎯 Project Overview

This is a React Native mobile app designed to help people integrate psychedelic experiences into daily life. It combines journaling, AI-guided support, nervous system regulation, and evidence-based integration practices.

**Tech Stack:**
- React Native 0.81.5 + Expo ~54.0.25
- Supabase (backend/database)
- Claude API (AI features)
- Navigation: React Navigation
- State: React hooks + AsyncStorage

**Current Version:** 1.1.0 (Build 4)
**Status:** Active development, post-launch iteration

---

## 🚨 CRITICAL: Use the Context System

**This project uses a modular context management system. You MUST use it.**

### Before Making Changes

1. **Read the current status:**
   ```
   context/STATUS.md - What's happening now?
   context/roadmap/current-phase.md - What are we working on?
   ```

2. **Check for related bugs/features:**
   ```
   context/bugs/INDEX.md - Known issues
   context/features/INDEX.md - Feature backlog
   ```

3. **Understand past decisions:**
   ```
   context/decisions/INDEX.md - Why things are the way they are
   ```

### When Working on This Project

**✅ DO:**
- Read `context/QUICK_START.md` first (5 min)
- Check `context/STATUS.md` before starting work
- Add bugs to `context/bugs/` using the template
- Add features to `context/features/` using the template
- Update `context/features/in-progress.md` when working on features
- Update `context/STATUS.md` weekly with progress
- Keep all context files under 300 lines (split if needed)
- Use INDEX files to navigate

**❌ DON'T:**
- Create new tracking systems (use context/)
- Add large documentation to root directory
- Ignore the context system
- Make architectural decisions without creating an ADR
- Let context files exceed 300 lines

### Quick Reference

```
🎬 User asks "what should I work on?"
   → Follow the workflow in "Development Workflow" section below
   → Assess project → Present options → Recommend plugin

📋 What should I work on?
   → context/roadmap/current-phase.md

🐛 Is this a known bug?
   → context/bugs/INDEX.md

✨ Has this feature been discussed?
   → context/features/planned.md or ideas.md

🤔 Why was this done this way?
   → context/decisions/INDEX.md

📊 What's the current status?
   → context/STATUS.md

🔌 Which plugin should I use?
   → docs/PLUGIN_SELECTION_GUIDE.md
```

---

## 📁 Project Structure

### Key Directories

```
psychedelic-integration-app/
├── components/           # Reusable UI components
├── enhanced-components/  # AI-enhanced components
├── screens/             # Main app screens
├── lib/                 # Services (Claude API, Supabase, etc.)
├── content/             # Educational content, exercises
├── knowledge-base/      # Research, protocols, source materials
├── context/             # 🚨 PROJECT TRACKING (use this!)
├── docs/                # Technical documentation
└── design/              # Design system, assets
```

### Important Files

- `App.js` - Main app entry point
- `lib/supabase.js` - Database connection
- `lib/claudeService.js` - AI integration
- `theme/colors.js` - Noesis color scheme
- `context/` - **ALL project tracking lives here**

---

## 🎨 Design System

**Noesis Aesthetic:**
```javascript
Background: #1a1a2e (deep indigo)
Cards: #252542
Primary: #9d84b7 (lavender)
Text: #f4f1de (warm cream)
Success: #6b8e6b
Warning: #d4a574
Error: #c17b7b
```

**Always use these colors** - No old color schemes!

---

## 🔧 Development Workflow

### 🎬 Starting a New Session (Recommended Flow)

**When the user asks: "What should I work on next?"**

Follow this flow:

1. **Assess the Project**
   ```
   Read these files in order:
   - context/STATUS.md (current state)
   - context/roadmap/current-phase.md (current priorities)
   - context/bugs/critical.md (P0 bugs)
   - context/bugs/high.md (P1 bugs)
   - context/features/in-progress.md (active features)
   ```

2. **Present Options**
   Give the user 3-4 prioritized options with:
   - Bug/Feature ID
   - Brief description
   - Priority level
   - Estimated effort
   - Impact statement

3. **Recommend Plugin**
   Once user chooses, recommend the appropriate plugin from `docs/PLUGIN_SELECTION_GUIDE.md`:

   **Examples:**
   - UI/UX work → `/frontend-mobile-development` or `/frontend-design`
   - Backend/Database → `/backend-development` or `/database-design`
   - Security issues → `/security-scanning`
   - AI features → `/llm-application-dev`
   - Testing → `/unit-testing` or `/tdd-workflows`
   - Documentation → `/documentation-generation`
   - Git issues → Use `git-advanced-workflows` skill

4. **User Invokes Plugin**
   User types the slash command (e.g., `/frontend-mobile-development`)
   The plugin coordinates which skills to use and when

**Example Flow:**
```
User: "What should I work on next?"

Claude: [Reads context files]
"Here are the top priorities:
1. BUG-101: Screens Missing Noesis Aesthetic (P1, 2-3 days)
2. BUG-102: Android Keyboard Overlap (P1, 2-3 days)
3. Git Repository Cleanup (P1, 1-2 days)

I recommend starting with BUG-101 for maximum user impact."

User: "Let's work on BUG-101"

Claude: "Great! For UI/UX consistency work, I recommend using:
👉 /frontend-mobile-development

This plugin will coordinate the right skills for React Native UI updates."

User: /frontend-mobile-development
[Plugin launches and handles the work]
```

---

### When You Start Work (Traditional Flow)

1. Read `context/STATUS.md` and `context/roadmap/current-phase.md`
2. Check `context/bugs/critical.md` and `context/bugs/high.md`
3. Review any in-progress features: `context/features/in-progress.md`
4. Start coding with current priorities in mind

### When You Find a Bug

1. Determine priority (P0/P1/P2/P3) - see `context/bugs/INDEX.md`
2. Add to appropriate file:
   - `context/bugs/critical.md` (P0 - security, crashes)
   - `context/bugs/high.md` (P1 - major issues)
   - `context/bugs/medium-low.md` (P2-P3 - minor issues)
3. Use the bug template from `context/README.md`
4. Update count in `context/bugs/INDEX.md`

### When You Implement a Feature

1. Move from `context/features/planned.md` to `context/features/in-progress.md`
2. Update status as you work
3. When complete, mark as complete with date
4. After 30 days, remove from tracking (it's in git history)

### When You Make a Significant Decision

1. Create an ADR: `context/decisions/YYYY-MM-DD-topic.md`
2. Use the template from `context/README.md`
3. Document context, decision, rationale, alternatives
4. Update `context/decisions/INDEX.md`

### Before You Finish

1. Update `context/STATUS.md` with progress
2. Update `context/features/in-progress.md` if working on features
3. Mark bugs as resolved in `context/bugs/`
4. Create git commit with clear message

---

## 🚨 Critical Security Rules

**Never commit:**
- `.env` file (should be in .gitignore)
- API keys or secrets
- SSH keys
- User data

**Always:**
- Use environment variables for secrets
- Keep `.env.example` updated
- Review git status before committing
- Check for sensitive data in code

**Current Security Issues:**
- See `context/bugs/critical.md` for active security bugs

---

## 🧪 Testing Philosophy

**Current State:** Minimal automated testing (see BUG-203)

**When adding features:**
- Test on actual device (not just emulator)
- Test on both Android and iOS if possible
- Verify Noesis color scheme is used
- Check for console errors/warnings

**Future:** Setting up Jest + Detox (see `context/features/planned.md`)

---

## 🤖 AI Integration Guidelines

### Claude API Usage

**Services using Claude API:**
- `lib/claudeService.js` - General AI service
- `lib/enhancedClaudeService.js` - Context-aware conversations
- `lib/dailyJournalAIService.js` - Journal prompts
- `lib/nervousSystemMappingAIService.js` - Polyvagal assessment
- `lib/coreBeliefsAIService.js` - Core beliefs exploration
- Additional specialized services in `lib/`

**Best Practices:**
- Use streaming for better UX
- Implement proper error handling
- Cache responses when appropriate
- Monitor API costs
- Keep prompts in separate files (not hardcoded)

**Current API Key:** Stored in `.env` as `ANTHROPIC_API_KEY`

---

## 🗄️ Database (Supabase)

**Tables:**
- `sessions` - Integration sessions
- `journal_entries` - User journal
- `exercises` - Practice exercises
- `users` - User accounts
- And more... (see database schema in knowledge-base/)

**Row Level Security (RLS):** Enabled
**Auth:** Supabase Auth with email/password

---

## 📝 Documentation Standards

### Code Comments

**DO comment:**
- Complex logic or algorithms
- Workarounds for known issues
- Non-obvious design decisions
- API integrations

**DON'T comment:**
- Obvious code
- What the code does (code should be self-documenting)

### Git Commits

**Good commit messages:**
- `Fix BUG-003: Resolve VM connectivity with EAS`
- `Implement FEAT-101: Session day checklist`
- `Update context system: Add decision log`

**Bad commit messages:**
- `fix bug`
- `update`
- `changes`

### Context System Updates

**Weekly:** Update `context/STATUS.md`
**As you work:** Keep `context/features/in-progress.md` current
**When finding issues:** Add to `context/bugs/`
**When planning:** Update `context/roadmap/`

---

## 🎯 Current Phase Priorities

**Phase:** Context System Setup & Foundation (Feb 7-21)

**Top Priorities:**
1. ✅ Context system (done!)
2. Fix critical security bugs (BUG-001, BUG-002)
3. Resolve VM connectivity or move to EAS (BUG-003)
4. Repository cleanup

**See:** `context/roadmap/current-phase.md` for details

---

## 🚀 Next Phase Preview

**Phase:** UX Polish & Core Features (Feb 21 - Mar 21)

**Focus:**
1. Complete session preparation checklist (FEAT-101)
2. AI intention guidance (FEAT-102)
3. Nervous system check-in (FEAT-103)
4. Visual design improvements (FEAT-203)

**See:** `context/roadmap/next-phase.md` for full plan

---

## 📚 Learning Resources

**Project Documentation:**
- `context/QUICK_START.md` - Start here!
- `context/README.md` - Complete context system guide
- `.context-guide.md` - Quick reference card
- `CONTEXT_SYSTEM_MIGRATION.md` - How we got here

**Technical Guides:**
- `knowledge-base/` - Research papers, protocols
- `docs/` - Technical documentation
- `DEPLOYMENT_GUIDE.md` - Deployment instructions

**Old Documentation (Archived):**
- `BUGS_AND_FEATURE_REQUESTS.md` - Replaced by context/bugs/
- `ACTION_PLAN.md` - Replaced by context/roadmap/

---

## 🎓 Psychedelic Integration Context

**This app is focused on integration, not the experience itself.**

**Key Concepts:**
- **Set and Setting** - Preparation matters
- **Integration** - Making sense of experiences after
- **Nervous System Regulation** - Polyvagal theory, somatic awareness
- **IFS (Internal Family Systems)** - Parts work, self-compassion
- **Evidence-Based** - Grounded in research and therapeutic practices

**User Base:**
- Individuals integrating psychedelic experiences
- Therapists and integration guides (future)
- People interested in personal growth and trauma healing

**Ethical Considerations:**
- Privacy is paramount
- Non-prescriptive guidance
- User agency and choice
- Safety and harm reduction
- Professional help when needed

---

## 🤝 Working with This Project

### If You're New

1. Read `context/QUICK_START.md` (5 min)
2. Read `context/STATUS.md` (current state)
3. Review `context/roadmap/current-phase.md` (priorities)
4. Explore the codebase starting with `App.js`
5. Ask questions by creating issues or updating context/

### If You're Returning

1. Read `context/STATUS.md` (what changed?)
2. Check `context/bugs/` (new issues?)
3. Review `context/roadmap/current-phase.md` (still on track?)
4. Continue where you left off

### If You're Planning

1. Review `context/features/ideas.md` (what's possible?)
2. Check `context/roadmap/next-phase.md` (what's next?)
3. Read `context/decisions/INDEX.md` (past decisions)
4. Propose new ideas in `context/features/ideas.md`

---

## 🔄 Maintenance Reminders

**Weekly (Fridays):**
- [ ] Update `context/STATUS.md`
- [ ] Review `context/bugs/critical.md` and `context/bugs/high.md`
- [ ] Update `context/features/in-progress.md` progress

**Monthly (Last Friday):**
- [ ] Archive resolved bugs/features older than 30 days
- [ ] Reprioritize `context/features/planned.md`
- [ ] Update `context/roadmap/next-phase.md`
- [ ] Clean up `context/features/ideas.md` (remove stale ideas)

**Quarterly (Every 3 months):**
- [ ] Strategic roadmap review
- [ ] Update `context/roadmap/future.md`
- [ ] Review all ADRs for relevance
- [ ] Evaluate context system effectiveness

---

## 📞 Getting Help

**Documentation:**
- Start with `context/QUICK_START.md`
- Full guide in `context/README.md`
- Technical docs in `docs/`

**Decision History:**
- Check `context/decisions/` for "why did we do this?"

**Current Work:**
- See `context/roadmap/current-phase.md`

**Bugs & Features:**
- Browse `context/bugs/INDEX.md` and `context/features/INDEX.md`

---

## ✨ Pro Tips for Claude AI

### Session Start Workflow

**When the user asks "what should I work on?":**
1. ✅ Read `context/STATUS.md` → `context/roadmap/current-phase.md` → `context/bugs/`
2. ✅ Assess priorities and present 3-4 options
3. ✅ When user chooses, recommend the right plugin from `docs/PLUGIN_SELECTION_GUIDE.md`
4. ✅ Tell user to invoke it with `/plugin-name` command
5. ✅ Let the plugin coordinate skills (don't try to do the work yourself)

**Plugin Recommendations by Task Type:**
- UI/UX fixes → `/frontend-mobile-development` or `/frontend-design`
- Backend/API → `/backend-development`
- Database work → `/database-design` or `/database-migrations`
- Security → `/security-scanning`
- AI features → `/llm-application-dev`
- Testing → `/unit-testing` or `/tdd-workflows`
- Documentation → `/documentation-generation`

### Other Workflows

**When the user reports a bug:**
→ Add to appropriate file in `context/bugs/` with template

**When suggesting features:**
→ Check if it's already in `context/features/` first

**When making architectural changes:**
→ Create an ADR in `context/decisions/`

**When you're unsure:**
→ Read `context/STATUS.md` for current project state

### Always Remember

- Keep context files under 300 lines
- Use the templates provided
- Link related items together
- Update as you go, not in batches
- Recommend plugins, don't do the work yourself
- Let plugins coordinate their own skills

---

## 🎯 Success Criteria

**You're doing it right if:**
- ✅ You checked context/ before starting work
- ✅ You updated context/ with your changes
- ✅ Files stay under 300 lines
- ✅ Templates are used consistently
- ✅ STATUS.md reflects current reality
- ✅ Bugs and features are tracked properly

**Red flags:**
- ❌ Creating tracking docs outside context/
- ❌ Large files (>300 lines) in context/
- ❌ Outdated STATUS.md (>1 week old)
- ❌ Untracked bugs or features
- ❌ Making big decisions without ADRs

---

## 🚀 Let's Build Something Great!

This app helps people integrate life-changing experiences. Your work has real impact.

**Remember:**
- Privacy and user agency come first
- Evidence-based approaches
- Beautiful, intuitive design
- Supportive, not prescriptive
- Accessible and inclusive

**Core Mission:**
*Help people meaningfully integrate transformative experiences into daily life.*

---

**Last Updated:** 2026-02-08
**Context System Version:** 1.0
**Next Review:** 2026-02-21

---

## Quick Links

- [Project Status](context/STATUS.md)
- [Quick Start Guide](context/QUICK_START.md)
- [Current Phase Plan](context/roadmap/current-phase.md)
- [Bug Tracker](context/bugs/INDEX.md)
- [Feature Backlog](context/features/INDEX.md)
- [Decision Log](context/decisions/INDEX.md)
- [Plugin Selection Guide](docs/PLUGIN_SELECTION_GUIDE.md) ⭐ **Use this!**
- [Context System Guide](.context-guide.md)
