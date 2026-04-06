# Resolved Bugs Archive

**File Size Limit:** 300 lines
**Last Updated:** 2026-03-03

---

## Purpose

This file archives resolved bugs that have been removed from the active tracking files (high.md, medium-low.md, critical.md) to keep those files under the 300-line limit. Each entry is a one-line summary.

---

## Resolved from critical.md (P0)

| Bug ID | Title | Resolved | Resolution |
|--------|-------|----------|------------|
| BUG-001 | Exposed API Keys in Git History | 2026-02-08 | Keys rotated, git history cleaned with git-filter-repo |
| BUG-002 | RLS Not Enabled on Tables | 2026-02-08 | RLS policies added to all tables |
| BUG-003 | VM Connectivity / EAS Build Issues | 2026-02-08 | Moved to EAS free tier builds |
| BUG-004 | Exposed .env File in Repository | 2026-02-08 | Removed from history, added to .gitignore |

---

## Resolved from high.md (P1)

| Bug ID | Title | Resolved | Resolution |
|--------|-------|----------|------------|
| BUG-100 | EAS Build Validation Errors | 2026-02-XX | Fixed Android version to 1.1.0 (build 4). Commit: e8ad96e |
| BUG-103 | Git Repository Disorganization | 2026-02-08 | .gitignore updated, large files removed, secrets cleaned from history |
| BUG-105 | Session Creation Doesn't Navigate Into Session | 2026-02-24 | AllSessionsScreen navigates directly to new session |
| BUG-106 | Keyboard Covers Text Input in SetIntentionScreen | 2026-02-24 | KeyboardAvoidingView with proper offset |
| BUG-107 | SetIntentionScreen Needs Huxley Theme + Avatar | 2026-02-24 | Huxley avatar in IntentionMessageBubble |
| BUG-108 | Chat Doesn't Auto-Scroll When Huxley Responds | 2026-02-24 | Auto-scroll on new messages, keyboard show, content size change |
| BUG-109 | Conversation Lost on Back Navigation | 2026-02-24 | Draft persistence via AsyncStorage + save draft alert |
| BUG-110 | Learn/Sessions Buttons Navigate to Wrong Route | 2026-02-25 | Updated routes to 'Learn' and 'History' |
| BUG-111 | Glimmer Swiper Crash on First Swipe | 2026-02-25 | deckRef/currentIndexRef to keep PanResponder in sync |
| BUG-112 | ExperienceMapping Shows "No Session Data" Error | 2026-02-25 | Screen auto-creates session if none provided |
| BUG-113 | Core Beliefs Assessment Crash on Completion | 2026-02-25 | Fetches user from supabase.auth.getUser() if prop missing |

---

## Resolved from medium-low.md (P2-P3)

| Bug ID | Title | Resolved | Resolution |
|--------|-------|----------|------------|
| BUG-200 | Old Color Scheme on Multiple Screens | 2026-01-XX | Systematically updated to Noesis aesthetic |
| BUG-201 | Device Cache Persisting Old UI | 2026-02-07 | Workaround documented (clear cache + rescan QR) |
| BUG-203 | Lack of Automated Testing | 2026-02-24 | Jest configured, 477 tests passing, 80%+ coverage |
| BUG-204 | Selectors Missing Visual Affordance | 2026-03-03 | Not applicable — pill-style buttons, not dropdowns |
| BUG-207 | Missing ai_metrics Table (PGRST205) | 2026-03-03 | Migration 20260303000001_ai_metrics_schema.sql |
| BUG-208 | Opening Statement Has No Variability | 2026-03-03 | Five distinct welcome approaches in buildIntentionPrompt() |
| BUG-209 | Journal Text Box Gap Above Keyboard | 2026-02-25 | KeyboardAvoidingView in ConversationalJournalEntry |
| BUG-210 | Regulating Resources Cut Off by Nav/Status Bars | 2026-02-25 | SafeAreaView with edges=['top', 'bottom'] |
| BUG-211 | Quick Grounding Goes to Main Exercise Library | 2026-02-25 | Passes { category: 'grounding' } params |
| BUG-212 | Exercise Library Has No Actual Instructions | 2026-02-25 | Structured exercise data with step-by-step instructions. Commit: d3bba84 |

---

**Total Resolved:** 25 bugs (4 P0, 11 P1, 10 P2-P3)
