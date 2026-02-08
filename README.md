# Psycheteleos - Psychedelic Integration App

A React Native mobile application designed to help people meaningfully integrate psychedelic and transformative experiences into daily life.

**Version:** 1.1.0 (Build 4)
**Status:** Active Development
**Last Updated:** 2026-02-07

---

## 🚀 Quick Start

### For Developers

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on device
# Scan QR code with Expo Go (iOS/Android)
```

### For AI Assistants (Claude, etc.)

**👉 START HERE: Read [CLAUDE.md](CLAUDE.md) for complete project guidance**

**Then read:**
1. `context/QUICK_START.md` - 5-minute orientation
2. `context/STATUS.md` - Current project status
3. `context/roadmap/current-phase.md` - What we're working on

---

## 📋 Project Organization

### 🚨 **ALL project tracking lives in `context/`**

```
context/
├── QUICK_START.md      ← Start here! (5 min)
├── STATUS.md           ← Current status (updated weekly)
├── README.md           ← Full guide & templates
├── bugs/               ← Bug tracking (critical/high/medium-low)
├── features/           ← Feature backlog (in-progress/planned/ideas)
├── roadmap/            ← Planning (current/next/future phases)
└── decisions/          ← Architecture Decision Records (ADRs)
```

**Key Documents:**
- **[CLAUDE.md](CLAUDE.md)** - Complete guide for AI assistants
- **[.context-guide.md](.context-guide.md)** - Quick reference card
- **[context/](context/)** - All project tracking (bugs, features, roadmap)

---

## 🎯 What Is This App?

**Psycheteleos** helps people integrate transformative psychedelic experiences through:

- 📝 **Guided Journaling** - AI-assisted reflection and processing
- 🧠 **Nervous System Mapping** - Polyvagal state tracking and regulation
- 🎯 **Intention Setting** - Preparation tools for sessions
- 📚 **Educational Content** - Evidence-based integration practices
- 🔄 **Daily Practices** - Breathwork, meditation, somatic exercises
- 🌟 **Progress Tracking** - Glimmers, triggers, habits, curriculum

**Core Philosophy:**
- Privacy and user agency first
- Evidence-based approaches (IFS, polyvagal theory, trauma-informed)
- Supportive, not prescriptive
- Beautiful, intuitive design

---

## 🛠️ Tech Stack

**Frontend:**
- React Native 0.81.5
- Expo ~54.0.25
- React Navigation (stack + tabs)
- React Native Paper (UI components)

**Backend:**
- Supabase (database, auth)
- PostgreSQL (via Supabase)

**AI:**
- Anthropic Claude API
- Specialized AI services for different features

**State Management:**
- React hooks
- AsyncStorage (local persistence)

---

## 📁 Project Structure

```
psychedelic-integration-app/
├── components/           # Reusable UI components
├── enhanced-components/  # AI-enhanced components
├── screens/             # Main app screens
├── lib/                 # Services (API, database, AI)
├── theme/               # Design system (colors, styles)
├── content/             # Educational content, exercises
├── knowledge-base/      # Research, protocols, source materials
├── context/             # 🚨 PROJECT TRACKING (bugs, features, roadmap)
├── docs/                # Technical documentation
├── design/              # Design system, Figma files
├── database/            # SQL migration scripts
└── scripts/             # Utility scripts
```

---

## 🎨 Design System

**Noesis Aesthetic:**
- Background: `#1a1a2e` (deep indigo)
- Cards: `#252542`
- Primary: `#9d84b7` (lavender)
- Text: `#f4f1de` (warm cream)
- Success: `#6b8e6b`
- Warning: `#d4a574`
- Error: `#c17b7b`

**Design Files:** `design/` directory

---

## 🔧 Development

### Prerequisites

- Node.js 16+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app (for testing on device)

### Environment Setup

1. Copy `.env.example` to `.env`
2. Add your API keys:
   - `ANTHROPIC_API_KEY` - Claude API
   - `SUPABASE_URL` - Supabase project URL
   - `SUPABASE_ANON_KEY` - Supabase anonymous key

### Running the App

```bash
# Start development server
npx expo start

# Clear cache if needed
npx expo start -c

# Run on specific platform
npx expo start --android
npx expo start --ios
```

### Testing on Device

1. Install Expo Go from App Store (iOS) or Play Store (Android)
2. Scan QR code from terminal
3. App loads on device

---

## 📚 Documentation

### Getting Started
- **[CLAUDE.md](CLAUDE.md)** - AI assistant guide (start here!)
- **[context/QUICK_START.md](context/QUICK_START.md)** - 5-minute orientation
- **[.context-guide.md](.context-guide.md)** - Quick reference

### Project Tracking (context/)
- **[context/STATUS.md](context/STATUS.md)** - Current project status
- **[context/bugs/](context/bugs/)** - Bug tracker
- **[context/features/](context/features/)** - Feature backlog
- **[context/roadmap/](context/roadmap/)** - Project roadmap
- **[context/decisions/](context/decisions/)** - Decision log (ADRs)

### Technical Guides
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Deployment instructions
- **[knowledge-base/](knowledge-base/)** - Research and protocols
- **[docs/](docs/)** - Technical documentation

### Archived Documentation
- **BUGS_AND_FEATURE_REQUESTS.md** → See `context/bugs/`
- **ACTION_PLAN.md** → See `context/roadmap/`

---

## 🐛 Reporting Bugs

1. Check if it's already reported: `context/bugs/INDEX.md`
2. Determine priority (P0-P3): see `context/bugs/INDEX.md`
3. Add to appropriate file:
   - `context/bugs/critical.md` (P0 - security, crashes)
   - `context/bugs/high.md` (P1 - major issues)
   - `context/bugs/medium-low.md` (P2-P3 - minor)
4. Use template from `context/README.md`

---

## ✨ Suggesting Features

1. Check existing features: `context/features/`
2. Add to `context/features/ideas.md`
3. Use template from `context/README.md`
4. Discuss in planning meetings
5. May move to `context/features/planned.md` if accepted

---

## 🤝 Contributing

### For Developers

1. Read **[CLAUDE.md](CLAUDE.md)** for project overview
2. Review **[context/QUICK_START.md](context/QUICK_START.md)**
3. Check **[context/roadmap/current-phase.md](context/roadmap/current-phase.md)** for priorities
4. Pick a task from bugs or features
5. Create a branch, make changes, test thoroughly
6. Update `context/` with your changes
7. Submit pull request

### For AI Assistants

**Required reading:**
1. **[CLAUDE.md](CLAUDE.md)** - Complete project guide
2. **[context/STATUS.md](context/STATUS.md)** - Current state
3. **[context/QUICK_START.md](context/QUICK_START.md)** - Navigation guide

**Key rules:**
- Always use the context system in `context/`
- Keep context files under 300 lines
- Use provided templates
- Update STATUS.md weekly
- Create ADRs for big decisions

---

## 📊 Project Status

**Current Phase:** Context System Setup & Foundation (Feb 7-21)

**Focus:**
1. ✅ Context management system (complete!)
2. Fix critical security bugs
3. Repository cleanup
4. Define next phase priorities

**See:** [context/STATUS.md](context/STATUS.md) for details

**Next Phase:** UX Polish & Core Features (Feb 21 - Mar 21)

**See:** [context/roadmap/INDEX.md](context/roadmap/INDEX.md) for full roadmap

---

## 🚨 Important Notes

### Security
- Never commit `.env` file (contains API keys)
- Never commit SSH keys or credentials
- See `context/bugs/critical.md` for current security issues

### Context System
- **ALL project tracking in `context/`**
- Max 300 lines per file
- Use templates for consistency
- Update weekly

### Code Standards
- Use Noesis color scheme (see theme/colors.js)
- Test on actual device, not just emulator
- Follow React Native best practices
- Comment complex logic

---

## 📞 Getting Help

**For AI Assistants:**
→ Read [CLAUDE.md](CLAUDE.md) first!

**Quick Questions:**
→ Check [.context-guide.md](.context-guide.md)

**Current Work:**
→ See [context/roadmap/current-phase.md](context/roadmap/current-phase.md)

**Project Status:**
→ Read [context/STATUS.md](context/STATUS.md)

**Decision History:**
→ Browse [context/decisions/](context/decisions/)

---

## 📄 License

Proprietary - All rights reserved

---

## 🙏 Acknowledgments

Built with ❤️ to support meaningful integration of transformative experiences.

**Grounded in:**
- Internal Family Systems (IFS)
- Polyvagal Theory
- Somatic approaches
- Evidence-based psychedelic integration research

---

## 🔗 Quick Links

| Resource | Link |
|----------|------|
| **AI Assistant Guide** | [CLAUDE.md](CLAUDE.md) |
| **Quick Start** | [context/QUICK_START.md](context/QUICK_START.md) |
| **Current Status** | [context/STATUS.md](context/STATUS.md) |
| **Bug Tracker** | [context/bugs/INDEX.md](context/bugs/INDEX.md) |
| **Feature Backlog** | [context/features/INDEX.md](context/features/INDEX.md) |
| **Roadmap** | [context/roadmap/INDEX.md](context/roadmap/INDEX.md) |
| **Decisions** | [context/decisions/INDEX.md](context/decisions/INDEX.md) |
| **Quick Reference** | [.context-guide.md](.context-guide.md) |

---

**Last Updated:** 2026-02-07
**Maintained By:** Development Team
**Questions?** Check context/ or CLAUDE.md
