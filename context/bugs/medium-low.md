# Medium & Low Priority Bugs (P2-P3)

**File Size Limit:** 300 lines
**Last Updated:** 2026-02-24

---

## Medium Priority (P2)

### BUG-201: Device Cache Persisting Old UI
**Priority:** P2 - Medium
**Status:** Resolved (Workaround Documented)
**Reported:** 2026-02-07 (migrated)

**Description:**
After updating code, devices sometimes show old UI until cache is fully cleared.

**Workaround:**
1. Close Expo Go completely (swipe away)
2. Reopen Expo Go fresh
3. Delete project from project list
4. Rescan QR code

**Root Cause:**
- Expo Go aggressive caching
- Metro bundler cache not invalidating

**Prevention:**
- Use `--clear` flag when starting Metro after big changes
- Close/reopen Expo Go after major updates

**Status:** Acceptable workaround exists, low urgency to fix

---

### BUG-202: TypeScript Configuration Updates
**Priority:** P2 - Medium
**Status:** Open
**Reported:** 2026-02-07 (migrated)

**Description:**
tsconfig.json#include property updated during recent changes, need to verify all imports working correctly.

**Impact:**
- Potential import resolution issues
- May affect TypeScript features

**Testing Needed:**
- [ ] Verify all imports resolve
- [ ] Check no TS errors in console
- [ ] Test with fresh install

**Estimated Effort:** 1-2 hours

---

### BUG-203: Lack of Automated Testing
**Priority:** P2 - Medium (Technical Debt)
**Status:** ✅ RESOLVED
**Reported:** 2026-02-07 (migrated)
**Resolved:** 2026-02-24

**Description:**
No automated tests currently in project.

**Resolution:**
- ✅ Jest configured (jest.config.js, jest.setup.js)
- ✅ 477 tests passing across 13 suites
- ✅ 81 component tests properly skipped (need React Native renderer)
- ✅ Shared test fixtures created
- ✅ 80%+ coverage on 4 critical AI services
- See FEAT-204 in `context/features/ai-system-improvements.md`

---

### BUG-204: Selectors Missing Visual Affordance (Session Type & Framework)
**Priority:** P2 - Medium (UX Polish)
**Status:** Open
**Reported:** 2026-02-17
**Screen:** SetIntentionScreen

**Description:**
The session type and framework selector fields show no visual indicator that they have multiple options (e.g. no chevron ▼ or arrow). Users may not realise they are tappable/expandable dropdowns.

**Affected Fields:**
- Session type selector
- Framework selector

**Proposed Fix:**
Add a `▼` chevron icon (e.g. `MaterialIcons name="keyboard-arrow-down"`) to the right side of each selector field. Consider using `MaterialIcons name="expand-more"` consistently with the rest of the app.

**Estimated Effort:** 1-2 hours

---

### BUG-205: 'Learn More About Privacy' Not Linked
**Priority:** P2 - Medium (Pre-Production Required)
**Status:** Open
**Reported:** 2026-02-17
**Screen:** SetIntentionScreen (privacy opt-in section)

**Description:**
The "Learn more about privacy" link in the intention saving section is not connected to any documentation. Tapping it does nothing (or renders a placeholder).

**Impact:**
- Users cannot understand the privacy model before opting in
- Must be resolved before production release
- Relates to BUG-304 (Missing Privacy Policy)

**Proposed Fix:**
Link to: (a) an in-app privacy screen, or (b) a web URL with the privacy policy. At minimum, show a modal explaining the opt-in storage model until a full privacy policy exists.

**Estimated Effort:** 2-4 hours (in-app modal) or 30 min (link to URL once policy exists)

---

### BUG-206: VirtualizedList Nested in ScrollView Warning
**Priority:** P2 - Medium (Performance)
**Status:** Open
**Reported:** 2026-02-17
**Screen:** SetIntentionScreen

**Description:**
Console warning: `VirtualizedLists should never be nested inside plain ScrollViews with the same orientation`. A FlatList or similar VirtualizedList component is rendered inside a ScrollView in SetIntentionScreen.

**Impact:**
- Can break windowing/recycling — performance degrades with long lists
- Console noise
- May cause scroll jank on lower-end devices

**Proposed Fix:**
Replace the outer `ScrollView` with `FlatList` (using `ListHeaderComponent` / `ListFooterComponent` for non-list content), or use `ScrollView` throughout without any VirtualizedList nested inside it.

**Estimated Effort:** 2-4 hours

---

### BUG-208: Opening Statement Has No Variability
**Priority:** P2 - Medium (Experience Quality)
**Status:** Resolved
**Reported:** 2026-02-17
**Resolved:** 2026-03-03
**Screen:** SetIntentionScreen

**Description:**
Huxley's opening welcome message is always the same. Users who open the screen multiple times will see identical first messages, making Huxley feel scripted and robotic.

**Resolution:**
Fixed in `buildIntentionPrompt()` (`lib/intentionGuidanceAIService.js`, lines 554-562) as part of ADR-007 (Intention as Goalpost). Five distinct welcome approaches are randomly selected each session, adapted by framework and nervous system state.

---

### BUG-207: Missing ai_metrics Table (PGRST205 Error)
**Priority:** P2 - Medium (Observability)
**Status:** Resolved
**Reported:** 2026-02-17
**Resolved:** 2026-03-03 — Migration `20260303000001_ai_metrics_schema.sql`

**Description:**
Every AI call logs this error:
```
ERROR [Metrics] Error inserting metrics: {"code": "PGRST205", "message": "Could not find the table 'public.ai_metrics' in the schema cache"}
```
The `metricsService.logAIMetric()` call in `intentionGuidanceAIService.js` is trying to write to a `public.ai_metrics` table that doesn't exist in the database.

**Impact:**
- No AI usage metrics being tracked (cost, latency, token counts)
- Error noise in logs on every AI call
- Non-blocking — AI still works, metrics just don't persist

**Proposed Fix:**
Create the `ai_metrics` table via migration. Check `lib/metricsService.js` for the expected schema and create a matching Supabase migration.

**Estimated Effort:** 2-3 hours (schema + migration + RLS)

---

### BUG-214: Set Intention Chat Content Cut Off by Navigation Bar
**Priority:** P2 - Medium (UI/UX)
**Status:** Open
**Reported:** 2026-03-03

**Description:**
On the Set Intention screen, the bottom portion of the chat interface is hidden behind the bottom navigation bar. Users cannot see or interact with the lower part of the conversation.

**Impact:**
- Chat messages and input area partially obscured
- Reduces usable screen area
- Similar to resolved BUG-210 (RegulatingResources cut off)

**Proposed Fix:**
Add proper bottom padding or SafeAreaView inset to account for the tab bar height on the SetIntentionScreen chat area.

**Estimated Effort:** 1-2 hours

---

## Low Priority (P3)

### BUG-301: Missing Performance Monitoring
**Priority:** P3 - Low
**Status:** Open
**Reported:** 2026-02-07 (migrated)

**Description:**
No performance metrics or monitoring currently implemented.

**Missing Metrics:**
- Initial load time
- Screen transition performance
- Database query times
- Memory usage
- Bundle size tracking

**Proposed Solution:**
- Add React Native Performance Monitor
- Use Flipper for debugging
- Implement baseline measurements
- Track over time

**Estimated Effort:** 2-3 days

---

### BUG-302: Bundle Size Not Optimized
**Priority:** P3 - Low
**Status:** Open
**Reported:** 2026-02-07 (migrated)

**Description:**
Haven't analyzed or optimized app bundle size.

**Tasks:**
- [ ] Analyze bundle composition
- [ ] Remove unused dependencies
- [ ] Optimize images
- [ ] Implement code splitting (if needed)

**Estimated Effort:** 2-3 days

---

### BUG-303: Incomplete Documentation
**Priority:** P3 - Low (Ongoing)
**Status:** In Progress
**Reported:** 2026-02-07 (migrated)

**Description:**
Some documentation incomplete or outdated.

**Gaps:**
- Architecture overview (partial)
- Component documentation (minimal)
- API documentation (none)
- State management guide (none)
- Contribution guidelines (none)

**Solution:**
- Use context system for project tracking (in progress)
- Add component docs gradually
- Create architecture diagram
- Document as we code

**Notes:**
- This is ongoing maintenance, not a "bug" per se
- Tracked better in roadmap/features

---

### BUG-304: Missing Privacy Policy & Terms
**Priority:** P3 - Low (Required for Production)
**Status:** Open
**Reported:** 2026-02-07 (migrated)

**Description:**
No privacy policy or terms of service documents created yet.

**Impact:**
- Required for app store submission
- Legal requirement for data collection
- User trust and transparency

**Tasks:**
- [ ] Draft privacy policy
- [ ] Draft terms of service
- [ ] Add to app (link in settings)
- [ ] Legal review (if possible)

**Estimated Effort:** 1-2 days + legal review

**Notes:**
- Not urgent for current dev/testing phase
- Must have before public release

---

### BUG-305: No User Data Export Feature
**Priority:** P3 - Low
**Status:** Open
**Reported:** 2026-02-07 (migrated)

**Description:**
Users cannot export their journal entries or app data.

**Use Cases:**
- Sharing with therapist
- Backup
- Switching apps
- Data portability (GDPR)

**Proposed Solution:**
- Export to PDF
- Export to JSON
- Export to CSV
- Share functionality

**Estimated Effort:** 3-4 days

**Notes:**
- See [FEAT-309](../features/ideas.md) for full feature spec

---

### BUG-209: Journal Text Box Gap Above Keyboard
**Priority:** P2 - Medium (UX)
**Status:** RESOLVED
**Reported:** 2026-02-25
**Resolved:** 2026-02-25

**Description:** ConversationalJournalEntry had no KeyboardAvoidingView, causing empty space between text input and keyboard.
**Fix:** Added KeyboardAvoidingView wrapper inside SafeAreaView.

---

### BUG-210: Regulating Resources Screen Cut Off by Nav/Status Bars
**Priority:** P2 - Medium (UX)
**Status:** RESOLVED
**Reported:** 2026-02-25
**Resolved:** 2026-02-25

**Description:** ConversationalRegulatingResources used only KeyboardAvoidingView as root without SafeAreaView. Header hidden behind status bar, input hidden behind nav bar.
**Fix:** Wrapped in SafeAreaView with edges=['top', 'bottom']. Also fixed user prop same as BUG-113.

---

### BUG-211: Quick Grounding Goes to Main Exercise Library
**Priority:** P2 - Medium (Navigation)
**Status:** RESOLVED
**Reported:** 2026-02-25
**Resolved:** 2026-02-25

**Description:** "Quick Grounding" and "Exercise Library" both navigated to ExerciseLibrary with no filter.
**Fix:** Quick Grounding now passes `{ category: 'grounding' }` params. ConversationalExerciseLibrary auto-selects category from route params.

---

### BUG-213: Glimmer Swiper Needs Curated Smiling Face Photos
**Priority:** P2 - Medium (Content/UX)
**Status:** Open
**Reported:** 2026-02-25

**Description:**
The face photos in `data/glimmerSwiperImages.js` are Unsplash stock portraits. Some may not show clearly smiling/happy expressions. The game's therapeutic value depends on the faces being genuinely warm and smiling.

**Proposed Fix:**
1. Browse each face URL manually and verify expression
2. Replace non-smiling photos with clearly happy/smiling ones
3. Consider bundling images locally (in `assets/`) instead of loading from Unsplash to eliminate network dependency entirely
4. Unsplash source: https://unsplash.com — grab photo ID from URL

**Notes:**
- File: `data/glimmerSwiperImages.js`
- Currently uses `&crop=face` Unsplash param for better face framing
- Images are 400x400 with prefetching for performance
- Long-term: local images would be faster and work offline

**Estimated Effort:** 1-2 hours (manual curation) or 3-4 hours (bundle locally)

---

### BUG-212: Exercise Library Has No Actual Instructions
**Priority:** P2 - Medium (Content)
**Status:** RESOLVED
**Reported:** 2026-02-25
**Resolved:** 2026-02-25

**Description:** ConversationalExerciseLibrary lists exercise names (e.g., "54321 Grounding", "Body Scan") but has no actual instruction content. Users can browse categories but can't actually do any exercises.

**Fix:** Added structured exercise data with step-by-step instructions, guided exercise screen, and wired exercise library to real data.

**Commit:** d3bba84

---

## Archived/Resolved

### BUG-200: Old Color Scheme on Multiple Screens
**Status:** Resolved
**Resolved:** 2026-01-XX

**Description:**
Old color scheme across many screens.

**Solution:**
Systematically updated to Noesis aesthetic. A few screens remain (see BUG-101).

---

## Notes

**Medium Priority (P2):**
- Fix within 2-4 weeks
- Has workaround or lower impact
- Schedule when between high-priority work

**Low Priority (P3):**
- Fix when time permits
- Nice to have
- May defer multiple sprints
- Batch with similar work

**When to Bump Priority:**
- P3→P2: Affects multiple users regularly
- P2→P1: Workaround breaks, impact increases
- Any→P0: Becomes critical (security, crash, blocker)

---

**Current Count:** 5 P2 active, 5 P3 active (10 total), 2 resolved
**File Status:** Under limit (300 max)
