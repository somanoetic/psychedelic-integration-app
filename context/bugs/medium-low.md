# Medium & Low Priority Bugs (P2-P3)

**File Size Limit:** 300 lines
**Last Updated:** 2026-03-03

---

## Medium Priority (P2)

### BUG-202: TypeScript Configuration Updates
**Priority:** P2 - Medium
**Status:** Resolved (2026-04-02)
**Reported:** 2026-02-07 (migrated)

**Resolution:**
`npx tsc --noEmit` now passes with zero errors. Added `exclude` to tsconfig.json for unused Expo starter template files (ExternalLink, HapticTab, HelloWave, ParallaxScrollView, Collapsible, ui/) and Supabase edge functions (Deno runtime, not Node).

---

### BUG-205: 'Learn More About Privacy' Not Linked
**Priority:** P2 - Medium (Pre-Production Required)
**Status:** Resolved
**Reported:** 2026-02-17
**Resolved:** 2026-04-01
**Screen:** SetIntentionScreen (privacy opt-in section)

**Description:**
The "Learn more about privacy" link in the intention saving section was not connected to any documentation.

**Resolution:**
Created PrivacyPolicyScreen.js with comprehensive privacy policy. "Learn more about privacy" link in IntentionPrivacyControls now navigates to PrivacyPolicy screen via React Navigation.

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
**Status:** Resolved (2026-04-02)
**Reported:** 2026-02-07 (migrated)

**Resolution:**
Analyzed bundle. Removed 4 unused dependencies: `@anthropic-ai/sdk` (migrated to proxy), `react-native-dotenv`, `react-native-web`, `react-dom`. Reduced from 29 to 25 deps. Assets total 3.6MB (reasonable). Glimmer Swiper images are bundled locally at 1.6MB total (40 images).

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
**Status:** Resolved
**Reported:** 2026-02-07 (migrated)
**Resolved:** 2026-04-01

**Description:**
No privacy policy or terms of service documents existed.

**Resolution:**
Created both as in-app screens:
- `screens/PrivacyPolicyScreen.js` — 11-section policy covering data collection, AI processing, storage, security, user rights, retention, age requirements, third parties
- `screens/TermsOfServiceScreen.js` — 14-section terms covering medical disclaimer, eligibility, content ownership, AI limitations, harm reduction commitment, liability
- Both registered in App.js navigation (PrivacyPolicy, TermsOfService routes)
- Privacy policy linked from IntentionPrivacyControls "Learn more about privacy" (BUG-205)

**Remaining:** Legal review recommended before production. Contact email addresses (privacy@, legal@alleviationtherapeutics.com) should be verified/configured.

---

### BUG-305: No User Data Export Feature
**Priority:** P3 - Low
**Status:** Resolved (2026-04-02)
**Reported:** 2026-02-07 (migrated)

**Resolution:**
- Created `lib/dataExportService.js` — exports all 19 user data tables as JSON via `expo-file-system` + `expo-sharing`
- Created `screens/SettingsScreen.js` — settings hub with Export My Data, Privacy Policy, Terms of Service, and Sign Out
- Added settings gear icon to GridHomeScreen header
- Registered Settings route in App.js
- Installed `expo-file-system` and `expo-sharing` dependencies

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
**Status:** Resolved
**Reported:** 2026-03-08
**Resolved:** 2026-04-01

**Description:**
The comprehensive exercise library (`content/exercises-comprehensive.js`) included step-by-step reproductions of copyrighted/trademarked techniques.

**Resolution:**
All 18 flagged exercises genericized (Option 2). Branded names, proprietary step sequences, and author attributions removed. Exercises rewritten with original language preserving the underlying therapeutic mechanism. Sources now reference general traditions (depth psychology, behavioral psychology, etc.). Category label renamed from "The Tools" to "Depth Psychology". Also cleaned `education.js` of branded references.

**Exercises rewritten:**
- JU-001 through JU-008 + SC-004 (Stutz & Michels)
- HAB-001 through HAB-007 + HAB-001.1 (Atomic Habits / Tiny Habits)

**Remaining lower risk (acceptable):**
- IFS — trademark of IFS Institute but techniques widely practiced; exercises teach general concepts
- Polyvagal, CBT, breathing, grounding, somatic, stoic — general therapeutic/philosophical techniques

---

### BUG-221: No Crash Reporting in Production (Sentry Removed)
**Priority:** P2 - Medium (Pre-Production Required)
**Status:** Resolved
**Reported:** 2026-04-02
**Resolved:** 2026-04-02

**Description:**
Sentry was removed (FEAT-203 work, 2026-02-24) because `@sentry/react-native 7.x` had a version mismatch with `@sentry/core 10.x` that caused Metro bundling failures. The package was uninstalled and the import commented out in App.js. There is currently **no crash reporting or error tracking** in the app.

**Impact:**
- Zero visibility into production crashes
- No way to know if users are hitting errors
- Can't prioritize bug fixes based on real crash data
- Flying blind once the app is in users' hands

**Proposed Solution:**
1. Check if `@sentry/react-native` has a compatible release now (v8+ may resolve the `@sentry/core` conflict)
2. If Sentry still incompatible, evaluate alternatives:
   - **Bugsnag** — React Native SDK, free tier available
   - **Firebase Crashlytics** — free, good React Native support via `@react-native-firebase/crashlytics`
   - **Datadog RUM** — if also want performance monitoring
3. Whichever tool: wire into App.js error boundary, test on both platforms
4. Verify it captures: JS exceptions, native crashes, unhandled promise rejections

**Estimated Effort:** 1-2 days
**Related:** FEAT-203 (monitoring), BUG-301 (performance monitoring)

**Resolution:**
Reinstalled `@sentry/react-native@7.2.0` (Expo SDK 54 compatible). All `@sentry/core` deps now resolve to 10.12.0 (no conflict). Created `lib/sentry.js` with `initSentry()`, `captureException()`, `setUser()` helpers. Wired into App.js: init at top, `Sentry.wrap(App)`, user set on auth state change. PII scrubbed from breadcrumbs via `beforeSend`. Disabled in `__DEV__`, active in production. Added `@sentry/react-native/expo` plugin to app.json. Jest mock added. 519 tests still passing.

**Remaining:** Create a Sentry project at sentry.io and set `SENTRY_DSN` in `.env`.

---

### BUG-306: iOS Beta Build Stale — Needs Rebuild and Testing
**Priority:** P2 - Medium (Pre-Production Required)
**Status:** Open
**Reported:** 2026-04-02

**Description:**
An earlier iOS build was distributed for beta testing, but significant changes have landed since then. The current beta build does not reflect the app's actual state. A fresh iOS build is needed to validate all recent work on a real device.

**Changes since last iOS build (non-exhaustive):**
- Exercise library (160 exercises) wired in
- RAG knowledge base integration (FEAT-205/206)
- Set Intention flow fixes (BUG-114, BUG-214, BUG-216–219)
- Privacy Policy + Terms of Service screens
- User data export (BUG-305)
- Settings screen
- Bundle optimization (4 deps removed)
- Keyboard overlap fixes for Android (BUG-102) — need iOS verification
- Noesis theme audit (BUG-101)
- Experience Processing conversation UX fixes (BUG-215, BUG-216)

**Steps to Rebuild:**
1. Run `eas build --platform ios --profile preview` (or internal distribution profile)
2. Upload to TestFlight or use ad-hoc distribution
3. Full regression pass on physical iOS device:
   - All conversation screens (Huxley, Intention, Experience Processing)
   - Exercise library browsing + guided exercise playback
   - Journal entry creation
   - Settings → Export Data, Privacy Policy, Terms of Service
   - Education/Learning Hub
   - Keyboard behavior on text inputs
   - Navigation and safe area insets (notch/Dynamic Island)
4. Document any iOS-specific issues as new bugs

**Estimated Effort:** 0.5 day (build) + 1-2 days (testing)
**Related:** BUG-102 (keyboard overlap needs iOS verification)

---

**Current Count:** 3 P2 active (BUG-213, BUG-221, BUG-306), 2 P3 active (BUG-301, BUG-303)
**Resolved bugs archived in:** [resolved.md](resolved.md)
