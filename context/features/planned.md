# Planned Features

**File Size Limit:** 300 lines
**Last Updated:** 2026-02-07

---

## High Priority - Next Phase (Weeks 1-4)

### FEAT-101: Complete Session Day Checklist
**Priority:** High
**Status:** Planned
**Target Phase:** Phase 1 (Week 2)
**Estimated Effort:** 3-4 days

**User Story:**
As a user preparing for a psychedelic session, I want a comprehensive checklist so that I don't forget important preparation steps.

**Requirements:**
- [ ] Design checklist UI
- [ ] Physical preparation items (fasting, hydration, etc.)
- [ ] Safety & support items (sitter, emergency contacts)
- [ ] Mental/emotional preparation items
- [ ] Practical logistics items
- [ ] Customizable checklist per user
- [ ] Track completion status
- [ ] Save templates for different substances/settings

**Technical Notes:**
- Store checklist templates in database
- User can customize default template
- Progress tracking per session

**Dependencies:**
- Session preparation screen exists

**Estimated Effort:** 3-4 days

---

### FEAT-102: AI Guidance in Set Your Intention Screen
**Priority:** High
**Status:** Planned
**Target Phase:** Phase 1 (Week 3-4)
**Estimated Effort:** 4-5 days

**User Story:**
As a user, I want AI-powered guidance to help me formulate meaningful intentions so that I approach my session with clarity.

**Requirements:**
- [ ] Intention setting UI design
- [ ] Claude API integration for guidance
- [ ] Prompt templates based on session type
- [ ] Example intentions library
- [ ] Philosophical/therapeutic frameworks
- [ ] Privacy controls (optional storage)
- [ ] Gentle guidance, not prescriptive

**Example Prompts:**
- "What are you hoping to learn about yourself?"
- "What relationship or pattern are you exploring?"
- "What question are you bringing to this experience?"

**Technical Notes:**
- Use Claude API for personalized prompts
- Suggest intentions based on user's journal history (optional)
- Don't store raw intentions unless user opts in

**Dependencies:**
- Claude API setup (exists)
- Intention setting screen

**Estimated Effort:** 4-5 days

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

**Technical Notes:**
- Simple questionnaire
- AI analyzes and identifies likely state
- Polyvagal ladder visualization
- Color-coded indicators

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

### FEAT-201: Testing Infrastructure
**Priority:** Medium
**Status:** Planned
**Target Phase:** Phase 4 (Week 15-16)
**Estimated Effort:** 1 week

**User Story:**
As a developer, I want automated tests so that I can catch regressions and develop with confidence.

**Requirements:**
- [ ] Set up Jest for unit tests
- [ ] Set up Detox/Maestro for E2E tests
- [ ] Write tests for core functions
- [ ] Test critical user flows
- [ ] Add to CI/CD pipeline
- [ ] Document testing procedures

**Technical Notes:**
- Start with critical flows first
- Build coverage incrementally
- Aim for 50%+ coverage eventually

**Dependencies:**
- None

**Estimated Effort:** 1 week initial setup, ongoing

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

**Current Count:** 8 features planned
**File Status:** ✅ Under limit (< 300 lines)
