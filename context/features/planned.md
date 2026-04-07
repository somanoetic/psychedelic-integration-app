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

### FEAT-103: AI Nervous System & Parts Check-In ✅
**Priority:** High
**Status:** Complete
**Completed:** 2026-03-15 (approx)

Implemented: NervousSystemCheckin, PartsCheckin, NervousSystemSummaryScreen, PartsSummaryScreen, ConversationalNervousSystemMapping, education widgets, state indicators. 4 database tables with RLS. All navigation routes registered.

**Remaining polish (optional):** Interactive in-app body map (currently prompts pen/paper), polyvagal ladder visual component (currently text-based).

---

### FEAT-104: Integrate Polyvagal Mapping AI ✅
**Priority:** High
**Status:** Complete
**Completed:** 2026-03-15 (approx)

Implemented: polyvagalAIService, nervousSystemMappingAIService, polyvagalContextService. Three mode handlers: NervousSystemMappingModeHandler (full Deb Dana protocol), NervousSystemExplorationModeHandler (freeform), PolyvagalCheckinModeHandler (quick). Versioned pattern tracking with triggers, glimmers, resources, interventions.

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

**Current Count:** 4 features still planned (FEAT-202, 203, 204, 205), 5 completed
**File Status:** Under limit (300 max)
