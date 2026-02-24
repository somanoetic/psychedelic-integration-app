# High Priority Bugs (P1)

**File Size Limit:** 300 lines
**Last Updated:** 2026-02-24

---

## Active High Priority Bugs

### BUG-101: Screens Missing Noesis Aesthetic
**Priority:** P1 - High (UI/UX)
**Status:** Open
**Reported:** 2026-02-07 (migrated)
**Assigned:** Unassigned

**Description:**
Several screens still show old color scheme instead of Noesis aesthetic (deep indigo, lavender accents).

**Impact:**
- Inconsistent user experience
- Looks unpolished
- Affects user trust in app quality

**Affected Screens:**
- [ ] SessionPreparationScreen (confirmed)
- [ ] EducationScreen (needs verification)
- [ ] ProfileScreen (needs verification)
- [ ] Various modal dialogs (needs audit)
- [ ] Form inputs (needs audit)

**Target Colors:**
```
Background: #1a1a2e (deep indigo)
Cards: #252542
Primary: #9d84b7 (lavender)
Text: #f4f1de (warm cream)
Success: #6b8e6b
Warning: #d4a574
Error: #c17b7b
```

**Proposed Solution:**
1. Audit all screens systematically
2. Update colors file-by-file
3. Test on device after each change
4. Create checklist in this bug

**Estimated Effort:** 2-3 days

**Notes:**
- Most screens already updated
- Need systematic audit to catch all

---

### BUG-102: Android Keyboard Overlap
**Priority:** P1 - High (Platform)
**Status:** Open
**Reported:** 2026-02-07 (migrated)
**Assigned:** Unassigned

**Description:**
On some Android devices, navigation buttons may overlap with app content, especially text input fields.

**Impact:**
- Users can't see input fields they're typing in
- Affects usability on Android
- Platform-specific issue

**Environment:**
- Android devices with different navigation styles
- Affects phones with on-screen nav bar most

**Test Cases Needed:**
- [ ] Phones with physical buttons
- [ ] Phones with gesture navigation
- [ ] Phones with on-screen navigation bar
- [ ] Text inputs at bottom of screen
- [ ] Landscape mode

**Current Status:**
- SafeAreaProvider added but not fully tested
- May need KeyboardAvoidingView on specific screens

**Proposed Solution:**
1. Test on multiple Android devices/emulators
2. Add KeyboardAvoidingView where needed
3. Ensure proper SafeAreaView usage
4. Test landscape orientation

**Estimated Effort:** 2-3 days (including testing)

---

### BUG-103: Git Repository Disorganization
**Priority:** P1 - High (DevOps)
**Status:** ✅ RESOLVED
**Reported:** 2026-02-07 (migrated)
**Started:** 2026-02-08
**Resolved:** 2026-02-08
**Assigned:** Completed

**Description:**
Many untracked files, large binary files in repo, security files exposed.

**Resolution:**
1. ✅ Updated .gitignore - excluded knowledge-base/ (1.5GB), IFS-resources/ (828MB)
2. ✅ Removed junk files - deleted `nul` and `App.js.backup`
3. ✅ Committed documentation - all context files, CLAUDE.md, ADRs, new components
4. ✅ Organized commits - 5 logical commits grouping related changes
5. ✅ Removed large files from history - IFS-resources videos (668MB + 155MB)
6. ✅ Cleaned secrets from history - removed API keys using git-filter-repo
7. ✅ Updated repository URL - moved to somanoetic org
8. ✅ Force pushed to remote - successfully synced with GitHub

**Security Actions Taken:**
- Removed .env file from ALL git history (67 commits rewritten)
- Redacted Anthropic API key from documentation
- Redacted Supabase keys from git history
- Used git-filter-repo to clean entire repository history

**Outcome:**
Repository completely cleaned and secure! All secrets removed from history, large media files excluded, documentation committed, working tree clean. Successfully pushed to GitHub without violations.

**Actual Effort:** 2 hours (including complex security cleanup)

---

### BUG-104: PM2 Process High Restart Count
**Priority:** P1 - High (Infrastructure)
**Status:** Open
**Reported:** 2026-02-07 (migrated)
**Assigned:** Unassigned

**Description:**
PM2 process manager showing 438+ restarts for expo server, indicating instability.

**Impact:**
- Server instability
- Potential service interruptions
- Resource consumption
- Difficult debugging

**Symptoms:**
- PM2 keeps restarting process
- Multiple expo processes running
- Port conflicts from orphaned processes
- Hard to kill processes

**Environment:**
- Oracle Cloud VM
- PM2 managing start-expo.sh
- Ubuntu server

**Proposed Solution:**
1. Review PM2 configuration
2. Set max restart limit
3. Add exponential backoff
4. Improve error handling in start script
5. Add health check endpoint
6. Better logging for restart reasons

**Estimated Effort:** 2-3 days

**Notes:**
- May be related to BUG-003 (VM connectivity)
- Need to understand why it's restarting so often

---

### BUG-105: Session Creation Doesn't Navigate Into Session
**Priority:** P1 - High (Navigation/UX)
**Status:** ✅ RESOLVED
**Reported:** 2026-02-17
**Resolved:** 2026-02-24

**Resolution:** `AllSessionsScreen.createNewSession()` navigates directly to the new session after creation.

---

### BUG-106: Keyboard Covers Text Input in SetIntentionScreen
**Priority:** P1 - High (Usability)
**Status:** ✅ RESOLVED
**Reported:** 2026-02-17
**Resolved:** 2026-02-24

**Resolution:** `KeyboardAvoidingView` with proper `keyboardVerticalOffset` implemented in SetIntentionScreen. Also resolves BUG-102 for this screen.

---

### BUG-107: SetIntentionScreen Needs Huxley Theme + Avatar
**Priority:** P1 - High (Design/Branding)
**Status:** ✅ RESOLVED
**Reported:** 2026-02-17
**Resolved:** 2026-02-24

**Resolution:** Huxley avatar displayed in `IntentionMessageBubble` for AI messages. Noesis/Huxley theme applied throughout.

---

### BUG-108: Chat Doesn't Auto-Scroll When Huxley Responds
**Priority:** P1 - High (UX)
**Status:** ✅ RESOLVED
**Reported:** 2026-02-17
**Resolved:** 2026-02-24

**Resolution:** `IntentionConversation` implements auto-scroll on new messages, keyboard show, content size change, and input focus.

---

### BUG-109: Conversation Lost on Back Navigation (No Auto-Save)
**Priority:** P1 - High (Data Loss)
**Status:** ✅ RESOLVED
**Reported:** 2026-02-17
**Resolved:** 2026-02-24

**Resolution:** Draft persistence via AsyncStorage (`intention_draft_${userId}_${sessionId}`), back navigation "Save Draft?" alert, and persisted state across navigation.

---

## Recently Resolved

### BUG-100: EAS Build Validation Errors
**Priority:** P1 - High
**Status:** Resolved
**Resolved:** 2026-02-XX

**Description:**
Build validation failing for Android.

**Solution:**
Fixed Android version to 1.1.0 (build 4) in native code.

**Commit:** e8ad96e

---

## Migration Candidates (from old docs)

The following items from BUGS_AND_FEATURE_REQUESTS.md may belong here but need triage:

- Device cache persistence issues (may be resolved)
- TypeScript configuration updates (may be low priority)
- Cross-platform testing needs (feature, not bug)
- Testing strategy (feature/improvement, not bug)

Review these during next bug triage session.

---

**Current Count:** 3 active (BUG-101, BUG-102, BUG-104), 7 resolved
**File Status:** Under limit (300 max)
