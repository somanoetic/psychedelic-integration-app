# Planned Features

**File Size Limit:** 300 lines
**Last Updated:** 2026-02-24

---

## High Priority - Next Phase (Weeks 1-4)

### FEAT-101: Complete Session Day Checklist ✅
**Priority:** High
**Status:** Complete
**Completed:** 2026-02-24

Implemented: SessionChecklistScreen, sessionChecklistService, useSessionChecklist hook.
See `context/features/in-progress.md` for details.

---

### FEAT-102: AI Guidance in Set Your Intention Screen ✅
**Priority:** High
**Status:** Complete
**Completed:** 2026-02-24

Implemented: SetIntentionScreen, intentionGuidanceAIService, intentionGuidanceService, IntentionConversation, IntentionMessageBubble.
See `context/features/in-progress.md` for details.
See ADR-007 for design decision (brevity over depth).

---

### FEAT-103: AI Nervous System & Parts Check-In
**Priority:** High
**Status:** Planned
**Target Phase:** Phase 1 (Week 3-4)
**Estimated Effort:** 4-5 days

**User Story:**
As a user, I want AI guidance to assess my nervous system state and IFS parts so that I understand my current state before/after sessions.

**Requirements:**
- [ ] Nervous system state assessment (polyvagal)
- [ ] IFS parts identification
- [ ] Body sensation mapping
- [ ] Visual state indicators
- [ ] State-specific guidance (dorsal, sympathetic, ventral)
- [ ] Tracking over time

**Visual Examples & Guidance:**
The mapping screen should include example visuals showing users *how* to create a nervous system map, with descriptions for each state:

- **Ventral Vagal (Safe & Social):** Show example body outline with warmth/openness markers — soft glow in chest, relaxed shoulders, open hands. Description: "Where do you feel safety in your body? Warmth, openness, softness?"
- **Sympathetic (Fight/Flight):** Show example with activation markers — tension in jaw/fists, heat in chest, buzzing energy. Description: "Where do you feel activation? Tightness, heat, restlessness, racing?"
- **Dorsal Vagal (Shutdown/Freeze):** Show example with heaviness/numbness markers — grey/cold areas, heaviness in limbs, fog in head. Description: "Where do you feel shutdown? Heaviness, numbness, disconnection, fog?"

Each example should use a simple body silhouette with color-coded overlays (warm colors for activation, cool colors for shutdown, soft colors for safety). Users can reference these while creating their own map — either by tapping body regions or drawing/annotating. Interactive body map (tap regions to mark sensations) is the goal, but can start with static reference visuals and iterate.

**Note:** User has reference visuals to provide when implementation begins — ask for them before starting design work.

**Technical Notes:**
- Simple questionnaire + visual body map component
- AI analyzes and identifies likely state
- Polyvagal ladder visualization
- Color-coded indicators
- Example images as onboarding/reference (could be static assets or animated walkthroughs)

**Dependencies:**
- Polyvagal mapping AI (see FEAT-104)

**Estimated Effort:** 4-5 days

---

### FEAT-104: Integrate Polyvagal Mapping AI
**Priority:** High
**Status:** Planned
**Target Phase:** Phase 2 (Week 5-6)
**Estimated Effort:** 5-7 days

**User Story:**
As a user, I want polyvagal state tracking integrated throughout the app so that I can understand my nervous system patterns.

**Requirements:**
- [ ] Port polyvagal mapping code from other project
- [ ] State assessment component
- [ ] Polyvagal ladder visualization
- [ ] Recommendation engine (practices per state)
- [ ] Integration points (pre/post session, daily check-in)
- [ ] State history tracking

**Polyvagal States:**
- **Dorsal Vagal**: Shutdown, freeze, dissociation
- **Sympathetic**: Fight-or-flight, activation
- **Ventral Vagal**: Safe and social, regulated

**Technical Notes:**
- Adapt AI model from existing project
- Create reusable components
- Store state history in database

**Dependencies:**
- Access to polyvagal mapping code
- Deb Dana resources for content

**Estimated Effort:** 5-7 days

---

## Medium Priority - Next Phase (Weeks 5-8)

### FEAT-201 (planned): Testing Infrastructure ✅
**Priority:** Medium
**Status:** Complete (delivered as FEAT-204 in AI System Improvements)
**Completed:** 2026-02-24

477 tests passing across 13 suites. Jest configured with shared fixtures.
See `context/features/ai-system-improvements.md` FEAT-204 for details.
Note: E2E tests (Detox/Maestro) still future work.

---

### FEAT-202: Enhanced UX Layouts
**Priority:** Medium
**Status:** Planned
**Target Phase:** Phase 2 (Week 7-8)
**Estimated Effort:** 5-7 days

**User Story:**
As a user, I want polished, intuitive layouts so that the app feels professional and easy to use.

**Requirements:**
- [ ] Complete Figma designs for all screens
- [ ] User testing with mockups
- [ ] Improve Home screen hierarchy
- [ ] Better Journal Entry form flow
- [ ] Enhanced navigation patterns
- [ ] Accessibility improvements

**Screens to Improve:**
- Home (featured actions)
- Journal Entry (multi-step vs. long form)
- Session Prep (visual checklist)
- Practice (immersive layout)
- Education (better organization)

**Dependencies:**
- Figma design system (FEAT-206)

**Estimated Effort:** 5-7 days

---

### FEAT-203: Improved Artwork & Visual Design
**Priority:** Medium
**Status:** Planned
**Target Phase:** Phase 2 (Week 7-8)
**Estimated Effort:** 5-7 days (ongoing)

**User Story:**
As a user, I want beautiful, meaningful visuals so that the app feels inspiring and professional.

**Requirements:**
- [ ] Custom icon set (replace generic icons)
- [ ] Empty state illustrations
- [ ] Practice exercise artwork (breathwork guides)
- [ ] Polyvagal state infographics
- [ ] IFS parts wheel visualization
- [ ] Breathing animations (expanding circle)

**Resources:**
- Illustration tools (Midjourney/DALL-E)
- Stock photos (Unsplash, Pexels)
- Animation libraries (Lottie)
- Budget: $500-2000 for custom work

**Dependencies:**
- Figma designs as reference

**Estimated Effort:** 5-7 days (design), ongoing implementation

---

### FEAT-204: Philosophical "Talkthroughs"
**Priority:** Medium
**Status:** Planned
**Target Phase:** Phase 3 (Week 9-10)
**Estimated Effort:** 7-10 days

**User Story:**
As a user, I want guided philosophical explorations so that I can deepen my understanding of psychedelic insights.

**Requirements:**
- [ ] Choose 5 initial topics
- [ ] Write/source content for each
- [ ] Decide format (audio/text/hybrid)
- [ ] Create interactive versions
- [ ] Add to app navigation

**Initial Topics:**
1. "Who Am I?" - Identity and self-inquiry
2. "The Nature of Consciousness"
3. "Unity and Separation" - Non-dual awareness
4. "Healing Trauma" - Integration and wholeness
5. "Mystery and Not-Knowing" - Embracing uncertainty

**Format Options:**
- Audio guided inquiry (10-20 min)
- Interactive text journey
- Hybrid: text + audio + journal prompts

**Dependencies:**
- Content creation resources
- Audio recording (if needed)

**Estimated Effort:** 7-10 days

---

### FEAT-205: Living Regulation Toolkit (Progress View)
**Priority:** Medium
**Status:** Planned
**Target Phase:** Phase 2-3
**Estimated Effort:** 3-5 days

**User Story:**
As a user, I want to see my regulation toolkit as a living document in the Progress/Insights area so I can track how my resources evolve over time.

**Requirements:**
- [ ] Dedicated screen showing current toolkit organized by NS state (sympathetic/dorsal/ventral)
- [ ] Resources ordered passive → active within each state
- [ ] Version history: see how toolkit changed across sessions
- [ ] Diff view: what was added, removed, or flagged between versions
- [ ] Visual indicators for resources flagged during review (dual-purpose, gaps)
- [ ] Quick-access from home screen or progress area

**Technical Notes:**
- Data already exists: `regulating_resources` table stores versioned snapshots (each session = new row)
- `session_type` field distinguishes 'initial' vs 'update' sessions
- `state_based_resources` JSON column has the state-organized data
- `polyvagal_patterns` table has the merged/current view
- Need: new screen component, navigation entry, version comparison logic

**Dependencies:**
- Regulating resources conversation flow (done)
- Versioned saving (done)

---

## Notes

**Lower Priority Features:**
See [ideas.md](ideas.md) for:
- FEAT-205: Offline Mode Support
- FEAT-206: Figma Design System
- Additional future features

**Planning Guidelines:**
- Keep this file to high/medium priority only
- Move low priority to ideas.md
- Target 6-8 features planned at a time
- Review and reprioritize monthly

**Movement:**
- Move to in-progress.md when starting
- Move to ideas.md if deferred
- Remove when complete (add to changelog)

---

**Current Count:** 5 features still planned (FEAT-103, 104, 202, 203, 204, 205), 3 completed
**File Status:** Under limit (300 max)
