# Medium & Low Priority Bugs (P2-P3)

**File Size Limit:** 300 lines
**Last Updated:** 2026-03-03

---

## Medium Priority (P2)

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
**Status:** Resolved
**Reported:** 2026-02-17
**Resolved:** 2026-03-03
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

**Notes:**
- File: `data/glimmerSwiperImages.js`
- Currently uses `&crop=face` Unsplash param for better face framing
- Long-term: local images would be faster and work offline

**Estimated Effort:** 1-2 hours (manual curation) or 3-4 hours (bundle locally)

---

### BUG-214: Set Intention Chat Content Cut Off by Navigation Bar
**Priority:** P2 - Medium (UI/UX)
**Status:** Resolved
**Reported:** 2026-03-03
**Resolved:** 2026-03-03

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
- Export to PDF / JSON / CSV
- Share functionality

**Estimated Effort:** 3-4 days

**Notes:**
- See [FEAT-309](../features/ideas.md) for full feature spec

---

### BUG-215: Learning Hub Uses Generic Icon Instead of Huxley Avatar
**Priority:** P2 - Medium (UI/UX)
**Status:** Resolved
**Reported:** 2026-03-05
**Resolved:** 2026-03-05

**Description:**
The Learning Hub (ConversationalEducation) shows a MaterialIcons gear/brain icon for Huxley instead of the actual Huxley character image used elsewhere in the app.

**Fix:** Replaced MaterialIcons avatar with `huxley therapist.png` Image component, matching other conversational screens.

---

### BUG-216: Intention Conversation Closes Too Quickly
**Priority:** P2 - Medium (UX)
**Status:** Resolved
**Reported:** 2026-03-05
**Resolved:** 2026-03-05

**Description:**
The intention-setting conversation only had 3 stages (welcome, direction, confirm). After the opening prompt and one user response, Huxley would immediately try to name the intention and close. Not enough depth for meaningful exploration.

**Fix:** Added a 'deepen' stage between 'direction' and 'confirm'. Now requires 3 user messages before moving to confirm, giving more room for the intention to take shape.

---

### BUG-217: Set Intention Welcome Screen Cut Off by Nav Bar
**Priority:** P2 - Medium (UI/UX)
**Status:** Resolved
**Reported:** 2026-03-05
**Resolved:** 2026-03-05

**Description:**
The "Set Your Intention" welcome screen (with session type, framework, and action buttons) was cut off at the bottom by the navigation bar. SafeAreaView only protected top edges.

**Fix:** Added bottom safe area edge and increased scroll content bottom padding from 80 to 120.

---

### BUG-218: No Intention Templates Available
**Priority:** P2 - Medium (Content)
**Status:** Resolved
**Reported:** 2026-03-05
**Resolved:** 2026-03-05

**Description:**
The "Browse Templates" feature on the Set Intention screen showed "No Templates Found" because the `intention_templates` database table had no data.

**Fix:** Added 8 built-in fallback templates in `intentionGuidanceService.js` covering IFS, somatic, existential, spiritual, and general frameworks. Database templates are used when available, built-in templates serve as fallback.

---

### BUG-219: Cannot Type Follow-up While Huxley is Thinking
**Priority:** P2 - Medium (UX)
**Status:** Resolved
**Reported:** 2026-03-05
**Resolved:** 2026-03-05

**Description:**
When Huxley starts "thinking" after a user message, the input was disabled. If the user wanted to add more context or a follow-up, they couldn't type until Huxley finished responding.

**Fix:** Input stays enabled while Huxley is thinking. If user sends a follow-up, the previous AI request is cancelled and a new one is made with the full conversation history. Added 800ms debounce and "Huxley is waiting for you to finish..." indicator.

---

### BUG-220: Exercise Library IP Review Needed Before Production
**Priority:** P2 - Medium (Legal/Pre-Production Required)
**Status:** Open
**Reported:** 2026-03-08

**Description:**
The comprehensive exercise library (`content/exercises-comprehensive.js`) includes step-by-step reproductions of copyrighted/trademarked techniques. Must be resolved before public release.

**High Risk:**
- **Stutz & Michels "The Tools"** (JU-001 through JU-008) — branded visualization sequences reproduced verbatim from *The Tools* and *Coming Alive*
- "Reversal of Desire," "Active Love," "Inner Authority," "The Black Sun," "The Vortex," "The Mother," "The Tower" are proprietary names

**Moderate Risk:**
- Atomic Habits / Tiny Habits — specific framing of concepts
- IFS — trademark of IFS Institute (though techniques are widely practiced)

**Lower Risk:**
- Polyvagal, CBT, breathing, grounding, somatic, stoic — general therapeutic/philosophical techniques

**Options:**
1. Seek licensing/permission from authors
2. Genericize — describe the underlying principle without branded scripts
3. Reference only — name the tool and source, don't reproduce steps
4. Remove highest-risk entries entirely

**Estimated Effort:** Research + legal consultation, then 2-4 hours of edits

---

**Current Count:** 4 P2 active, 5 P3 active (9 total)
**Resolved bugs archived in:** [resolved.md](resolved.md)
