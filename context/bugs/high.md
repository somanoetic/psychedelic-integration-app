# High Priority Bugs (P1)

**File Size Limit:** 300 lines
**Last Updated:** 2026-02-07

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
**Status:** In Progress
**Reported:** 2026-02-07 (migrated)
**Started:** 2026-02-08
**Assigned:** Active - Git cleanup

**Description:**
Many untracked files, large binary files in repo, security files exposed.

**Impact:**
- Repository size growing
- Difficult to track actual changes
- Security risks (.env, ssh keys)
- Onboarding new developers harder

**Issues:**
- .env not in .gitignore (P0 - see critical.md)
- Many .md files untracked (should commit)
- PDF files in repo (should use LFS or external storage)
- android/ folder unclear if needed
- training-data/ unclear if should commit

**Proposed Solution:**
1. Update .gitignore properly
2. Remove sensitive files
3. Commit documentation files
4. Set up Git LFS for PDFs
5. Clean up unnecessary files
6. Organize folder structure

**Estimated Effort:** 1-2 days

**Notes:**
- Part of context system work
- Will improve after context migration

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

**Current Count:** 4 active, 1 resolved
**File Status:** Under limit (110 lines / 300 max)
