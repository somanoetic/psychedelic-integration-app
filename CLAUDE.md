# Psycheteleos - Claude Instructions

React Native + Expo ~54.0.25 | Supabase | Claude API | React Navigation

## Before Starting Work

Read `context/STATUS.md` and `context/roadmap/current-phase.md` to understand current priorities.
Check `context/bugs/INDEX.md` and `context/features/INDEX.md` for known issues and backlog.

## Design System

Use warm cream aesthetic (NOT dark indigo). See `theme/colors.js` for current palette.
Background: #F5F1E8 (warm cream) | Primary: #9d84b7 (lavender) | Text: dark on light

## Context System

All project tracking lives in `context/`. Use it:
- Bugs: `context/bugs/` (P0=critical, P1=high, P2-P3=medium-low)
- Features: `context/features/` (planned → in-progress → complete)
- Decisions: `context/decisions/` (create ADRs for significant choices)
- Update `context/STATUS.md` after making progress
- Keep context files under 300 lines

## Security

Never commit `.env`, API keys, secrets, or user data. Use environment variables.

## Commits

Use descriptive messages: `Fix BUG-003: Resolve VM connectivity with EAS`

## Key Directories

- `lib/` - Services (claudeService, supabase, AI services)
- `screens/` - App screens
- `components/` + `enhanced-components/` - UI components
- `content/` - Educational content, exercises
- `knowledge-base/` - Research, protocols
