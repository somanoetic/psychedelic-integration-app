# High Priority Bugs (P1)

**File Size Limit:** 300 lines
**Last Updated:** 2026-03-03

---

## Active High Priority Bugs

### BUG-101: Screens Missing Noesis Aesthetic
**Priority:** P1 - High (UI/UX)
**Status:** Resolved (2026-04-02)
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

**Resolution:**
Comprehensive audit completed. Only AdminMetricsDashboard.js was using the old dark Noesis palette (NOESIS_COLORS constant with #1a1a2e, #252542, etc.). Replaced all references with `colors.*` from theme/colors.js. No other screens use old colors — all other screens properly import from the theme system. Two minor screens (InteractiveSessionMindMap, QuickNetworkTest) use hardcoded colors but not the old dark palette; these are dev/debug screens.

---

### BUG-102: Android Keyboard Overlap
**Priority:** P1 - High (Platform)
**Status:** Resolved (2026-04-02)
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

**Resolution:**
- `softwareKeyboardLayoutMode: "resize"` confirmed set in app.json
- All 10 screens with TextInput have KeyboardAvoidingView
- Fixed ExperienceMappingScreen and TherapeuticIntegrationScreen: changed `behavior="padding"` (iOS-only) to `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}` with Android offset of 20
- Standardized keyboardVerticalOffset across ConversationScreen
- Remaining: manual QA on physical Android devices recommended

---

### BUG-104: PM2 Process High Restart Count
**Priority:** P1 - High (Infrastructure)
**Status:** Resolved (2026-04-02 — Oracle Cloud VM no longer in use)
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

### BUG-114: "Save Intention" Button Does Nothing
**Priority:** P1 - High (Core Feature)
**Status:** Resolved
**Reported:** 2026-03-03
**Resolved:** 2026-03-03

**Description:**
Tapping the "Save Intention" button on the Set Intention screen produces no visible response — no save, no navigation, no feedback.

**Impact:**
- Users cannot save their intentions
- Blocks a core session preparation flow (FEAT-102)
- No error in UI — appears broken/unresponsive

**Proposed Investigation:**
1. Check button's `onPress` handler in SetIntentionScreen
2. Verify Supabase insert/update call is wired up
3. Check for silent errors (missing params, RLS, etc.)

**Estimated Effort:** 1-2 hours

---

### BUG-215: Experience Processing Screen — Conversation Window Too Small
**Priority:** P1 - High (UX)
**Status:** Resolved (confirmed 2026-04-02)
**Reported:** 2026-03-08
**Assigned:** Unassigned

**Description:**
The Experience Processing conversation screen (`ExperienceMappingScreen.js`) has too many UI elements consuming vertical space, leaving a cramped conversation window.

**Elements eating space (~250px total on a ~700px screen):**
1. **Header bar** (~50px) — back button + title + "Switch to Integration" link
2. **Progress indicator** (~120-130px) — "Experience Processing:" label, 5 phase circles with names, phase summary text box, paper reminder (Phase 1)
3. **Per-message phase badges** (lines 551-565) — redundant "Phase X: Gathering Details" on every message bubble
4. **Input area bottom padding** (~70px) — extra padding between text input and navigation bar

**Impact:**
- Conversation area is roughly 1/3 of screen
- Users must scroll constantly
- Feels cramped during deep processing work
- Worse on smaller phones

**Proposed Solution:**
1. Make progress indicator collapsible/minimized (show only current phase dot, expand on tap)
2. Remove per-message phase badges (redundant with top progress indicator)
3. Reduce input container padding — tighten gap between text box and nav bar
4. Consider making header slimmer or auto-hiding on scroll

**Estimated Effort:** 1-2 days

**Related:** BUG-102 (Android keyboard overlap)

---

### BUG-216: Excessive Bottom Padding Below Input on Conversation Screens
**Priority:** P1 - High (UX)
**Status:** Resolved (confirmed 2026-04-02)
**Reported:** 2026-03-08
**Assigned:** Unassigned

**Description:**
There is extra padding/space between the bottom of the text input box and the top of the tab navigation bar on conversation screens (ExperienceMappingScreen and likely others).

**Impact:**
- Wastes vertical space on every conversation screen
- Compounds with BUG-215 to further shrink conversation area
- Particularly noticeable on smaller devices

**Likely Cause:**
- `SafeAreaView` with `edges={['top', 'bottom']}` adding bottom inset AND tab bar already accounts for safe area
- `inputContainer` has 16px padding on all sides
- `KeyboardAvoidingView` offset may add extra space

**Proposed Solution:**
1. Audit SafeAreaView bottom edge — may be double-accounting for tab bar
2. Reduce `inputContainer` bottom padding
3. Check if `paddingBottom: insets.bottom` in container style is redundant with SafeAreaView edges
4. Test fix across all conversation screens (ExperienceMapping, HuxleyChat, EnhancedConversation, etc.)

**Estimated Effort:** 0.5-1 day

**Related:** BUG-215, BUG-102

---

**Current Count:** 0 active
**Resolved bugs archived in:** [resolved.md](resolved.md)
