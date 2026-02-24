# FEAT-313: Cognitive Bias Modification Integration

**Priority:** Medium-High
**Status:** Idea
**Proposed:** 2026-02-09
**Target Phase:** Q2 2026 (Phase 4-5)
**Category:** AI/ML + Mental Health
**Related Strategy:** [CBM-strategy.md](CBM-strategy.md)

---

## User Story

As a user integrating psychedelic experiences, I want AI-powered cognitive bias modification training so that I can capitalize on the increased cognitive flexibility and establish healthier thought patterns during my integration journey.

---

## Value Proposition

**Problem:**
After psychedelic experiences, users often surface rigid negative thought patterns (negative interpretation biases, attention to threat) that interfere with integration. Traditional therapy helps, but is not always accessible between sessions.

**Solution:**
Cognitive Bias Modification (CBM) provides evidence-based, gamified training that retrains automatic cognitive biases through repeated practice. Combined with psychedelics' "belief relaxation" effect, CBM could help users establish healthier cognitive patterns during the neuroplastic integration window.

**Impact:**
- Reduce anxiety and negative thinking patterns
- Improve interpretation flexibility
- Enhance integration quality
- Provide daily self-guided therapeutic practice
- Fill research gap (no existing psychedelic + CBM protocols)

---

## Requirements

### Phase 1: Core CBM Features (MVP)

#### Interpretation Bias Modification (CBM-I)
- [ ] Scenario-based training interface (10-15 min sessions)
- [ ] 60-80 integration-specific scenarios per session
- [ ] Word completion format (resolve ambiguity positively)
- [ ] Progressive difficulty levels
- [ ] Session completion tracking
- [ ] Performance metrics (accuracy, response times)
- [ ] Integration context scenarios:
  - [ ] Social situations post-journey
  - [ ] Difficult emotions and sensations
  - [ ] Ambiguous spiritual/mystical experiences
  - [ ] Parts work and internal conflicts
  - [ ] Daily life challenges

#### Attention Bias Modification (ABM)
- [ ] Visual probe task implementation
- [ ] Gamified interface (5-10 min sessions)
- [ ] Integration-relevant imagery:
  - [ ] Nature scenes (grounding)
  - [ ] Safe vs. overwhelming spaces
  - [ ] Calm vs. anxious faces
  - [ ] Somatic cues (relaxed vs. tense)
- [ ] Response time tracking
- [ ] Adaptive difficulty

#### Progress Tracking
- [ ] Session history
- [ ] Performance analytics
- [ ] Bias score tracking over time
- [ ] Streak/consistency tracking
- [ ] Progress visualizations (Noesis aesthetic)

#### Onboarding & Education
- [ ] "What is CBM?" introduction
- [ ] Evidence base explanation
- [ ] How it supports integration
- [ ] Expected outcomes and timeline
- [ ] Privacy and data usage

### Phase 2: AI-Enhanced Features

#### Personalized Scenario Generation
- [ ] Claude API integration for scenario creation
- [ ] Generate scenarios from:
  - [ ] User's journal entries
  - [ ] Identified cognitive patterns
  - [ ] Core beliefs work
  - [ ] IFS parts identified
  - [ ] Integration challenges mentioned
- [ ] Quality control for generated scenarios
- [ ] Diversity and relevance scoring

#### Context-Aware Recommendations
- [ ] Pre-journey preparation focus
- [ ] Post-journey integration (0-7 days) scenarios
- [ ] Ongoing integration (Week 2+) scenarios
- [ ] Nervous system state-based suggestions
- [ ] Time-of-day optimization

#### Integration with Existing Features
- [ ] Nervous System Mapping integration
  - [ ] Track polyvagal state before/after CBM
  - [ ] Recommend CBM during dysregulation
  - [ ] Use CBM as regulation practice
- [ ] Core Beliefs integration
  - [ ] Target specific limiting beliefs
  - [ ] Track belief flexibility over time
- [ ] Daily Journal integration
  - [ ] Detect negative patterns → suggest CBM
  - [ ] Journal reflections on CBM insights
  - [ ] Track sentiment shifts
- [ ] IFS Parts Work integration
  - [ ] Scenarios featuring different parts
  - [ ] Practice compassionate interpretations
  - [ ] Reinforce Self-energy

### Phase 3: Advanced Features

#### Adaptive Training
- [ ] AI-adjusted difficulty based on performance
- [ ] Identify persistent biases needing focus
- [ ] Personalized training schedules
- [ ] Celebrate progress milestones

#### Research & Analytics
- [ ] Opt-in anonymous data collection
- [ ] Effectiveness metrics dashboard
- [ ] Contribute to research database
- [ ] Partner with research institutions

#### Optional Social Features
- [ ] Share progress with integration circles (opt-in)
- [ ] Group challenges and accountability
- [ ] Therapist/guide dashboard (future)

---

## Technical Implementation

### Architecture

```
components/cbm/
├── CBMIntro.js              # Onboarding and education
├── CBMSettings.js           # User preferences, difficulty
├── ScenarioTraining.js      # CBM-I implementation
├── AttentionTraining.js     # ABM implementation
├── ProgressTracking.js      # Stats and insights
└── AIScenarioGenerator.js   # Claude-powered scenarios

lib/cbm/
├── cbmService.js            # Core CBM logic
├── scenarioDatabase.js      # Pre-built scenarios
├── progressTracking.js      # Performance analytics
└── claudeCBMService.js      # AI scenario generation
```

### Database Schema (Supabase)

**New Tables:**

```sql
-- CBM sessions table
CREATE TABLE cbm_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('interpretation', 'attention')),
  context TEXT CHECK (context IN ('pre_journey', 'post_journey', 'ongoing', 'general')),
  scenarios_completed INT DEFAULT 0,
  accuracy_rate FLOAT,
  response_times JSONB,
  polyvagal_state_before TEXT,
  polyvagal_state_after TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Individual scenario responses
CREATE TABLE cbm_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES cbm_sessions(id) ON DELETE CASCADE,
  scenario_id TEXT NOT NULL,
  scenario_text TEXT,
  user_choice TEXT NOT NULL,
  correct_choice TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  response_time_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User progress tracking
CREATE TABLE cbm_progress (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_sessions INT DEFAULT 0,
  total_scenarios INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  last_session_at TIMESTAMPTZ,
  interpretation_bias_score FLOAT, -- -1 (negative) to +1 (positive)
  attention_bias_score FLOAT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-built scenario library
CREATE TABLE cbm_scenarios (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('interpretation', 'attention')),
  category TEXT, -- 'social', 'emotional', 'spiritual', etc.
  difficulty INT CHECK (difficulty BETWEEN 1 AND 5),
  context TEXT, -- 'pre_journey', 'post_journey', 'ongoing'
  scenario_text TEXT NOT NULL,
  positive_completion TEXT,
  negative_completion TEXT,
  metadata JSONB,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_cbm_sessions_user_id ON cbm_sessions(user_id);
CREATE INDEX idx_cbm_sessions_created_at ON cbm_sessions(created_at);
CREATE INDEX idx_cbm_responses_session_id ON cbm_responses(session_id);
CREATE INDEX idx_cbm_scenarios_type ON cbm_scenarios(type);
CREATE INDEX idx_cbm_scenarios_context ON cbm_scenarios(context);
```

### Claude API Integration

**AI Scenario Generation Service:**

```javascript
// lib/cbm/claudeCBMService.js

const generatePersonalizedScenarios = async ({
  userId,
  count = 10,
  context = 'ongoing',
  recentJournalEntries = [],
  coreBeliefs = [],
  identifiedParts = []
}) => {

  const systemPrompt = `You are an expert in psychedelic integration and
cognitive bias modification. Generate CBM-I scenarios that:

1. Present ambiguous integration-related situations
2. Offer one positive/benign interpretation
3. Offer one negative/threatening interpretation
4. Are personally relevant to the user's journey
5. Reinforce growth-oriented meaning-making
6. Avoid toxic positivity or spiritual bypassing
7. Maintain psychological safety
8. Are culturally sensitive and inclusive

Context: ${context}
Recent themes: ${extractThemes(recentJournalEntries)}
Core beliefs: ${coreBeliefs.join(', ')}
Active parts: ${identifiedParts.join(', ')}

Generate ${count} scenarios in this exact JSON format:
[
  {
    "scenario": "Ambiguous situation text ending in...",
    "positive_completion": "benign interpretation word/phrase",
    "negative_completion": "threatening interpretation word/phrase",
    "category": "social|emotional|spiritual|somatic|existential"
  }
]`;

  const response = await claudeService.generateContent(systemPrompt);
  return validateAndStoreScenarios(response);
};
```

### UI/UX Design (Noesis Aesthetic)

**Design Principles:**
- Calm, spacious layouts (#1a1a2e background)
- Lavender accents (#9d84b7) for positive choices
- Gentle animations and transitions
- No harsh timers or pressure
- Warm, encouraging feedback
- Progress celebration without competition

**Key Screens:**
1. **CBM Home** - Choose training type, view progress
2. **Scenario Training** - Clean text presentation, word completion
3. **Attention Training** - Minimalist visual probe task
4. **Progress Dashboard** - Charts showing bias score trends
5. **Settings** - Difficulty, frequency, notifications

---

## Success Metrics

### Engagement Metrics
- **Session completion rate:** Target 70%+
- **Daily/weekly active users:** Track adoption
- **Average sessions per week:** Target 3-5
- **Session length:** Avg 10-15 min
- **User-reported helpfulness:** Target 4+/5

### Clinical Outcomes (Self-Report)
- **Interpretation bias change:** Track score shift over time
- **Anxiety/depression symptoms:** Optional PHQ-9, GAD-7 integration
- **Integration quality ratings:** User self-assessment
- **Cognitive flexibility scores:** Pre/post questionnaires

### Behavioral Markers
- **Journal sentiment shift:** Analyze tone changes over time
- **Core beliefs score improvement:** Track belief flexibility
- **Nervous system regulation:** Polyvagal state improvements
- **Feature correlation:** CBM users vs. non-users outcomes

---

## Dependencies

**Must Have:**
- Claude API (exists ✓)
- Supabase database (exists ✓)
- User authentication (exists ✓)
- AsyncStorage for offline scenarios (exists ✓)

**Nice to Have:**
- Nervous System Mapping integration (FEAT-104)
- Core Beliefs tracking (exists ✓)
- IFS Parts work (exists ✓)
- Journey timeline (exists ✓)

**Future:**
- Testing infrastructure (FEAT-201)
- Analytics dashboard (future)

---

## Estimated Effort

### Phase 1: MVP (2-3 months)
- **Research & Planning:** 1 week (completed ✓)
- **Database schema & API:** 1 week
- **Core CBM-I component:** 2 weeks
- **Attention training component:** 1 week
- **Progress tracking:** 1 week
- **Pre-built scenario library:** 1 week (content creation)
- **UI/UX implementation:** 2 weeks
- **Testing & refinement:** 1-2 weeks

**Total Phase 1:** 9-11 weeks

### Phase 2: AI Enhancement (1-2 months)
- **Claude API scenario generation:** 1 week
- **Personalization algorithms:** 1 week
- **Integration with existing features:** 2 weeks
- **Testing & refinement:** 1 week

**Total Phase 2:** 5-6 weeks

### Phase 3: Advanced (1 month)
- **Adaptive training logic:** 1 week
- **Research dashboard:** 1 week
- **Polish & optimization:** 1-2 weeks

**Total Phase 3:** 3-4 weeks

**Grand Total:** 17-21 weeks (4-5 months)

---

## Risks & Mitigations

### Risk 1: User Dropout
**Likelihood:** Medium-High (common in digital CBM)
**Impact:** High (reduced effectiveness)

**Mitigations:**
- Keep sessions short (5-15 min)
- Gamification without pressure
- Integration with existing features (not standalone)
- Clear progress visualization
- Optional gentle notifications
- Make genuinely engaging, not just "homework"

### Risk 2: Effectiveness Variability
**Likelihood:** Medium (mixed research results for mobile CBM)
**Impact:** Medium (may not deliver expected outcomes)

**Mitigations:**
- Offer both CBM-I and ABM (multiple approaches)
- AI personalization (increase relevance)
- Combine with other therapeutic features
- Set realistic user expectations
- A/B test different implementations
- Continuous feedback collection

### Risk 3: Spiritual Bypassing
**Likelihood:** Low-Medium (integration context risk)
**Impact:** High (could harm users)

**Mitigations:**
- Frame as "flexibility training" not "positive thinking"
- Include scenarios validating difficult emotions
- Emphasize both/and thinking, not either/or
- Integrate with IFS (honor all parts)
- Educational content on healthy vs. bypassing
- Therapist review of AI scenarios
- User testing with integration experts

### Risk 4: Research Gap (No Published CBM + Psychedelic Studies)
**Likelihood:** N/A (reality, not risk)
**Impact:** Medium (credibility, user trust)

**Approach:**
- Transparent about evidence base
- Frame as evidence-informed innovation
- Built on solid foundations (separate evidence for each)
- Invite research partnerships
- Rigorous internal evaluation
- User consent for research participation

### Risk 5: AI-Generated Scenario Quality
**Likelihood:** Medium (AI can be unpredictable)
**Impact:** Medium-High (poor scenarios reduce effectiveness)

**Mitigations:**
- Extensive prompt engineering and testing
- Quality control validation layer
- Fall back to pre-built scenarios if AI fails
- Human review of AI-generated content
- User feedback on scenario relevance
- Scenario rating system

---

## Innovation Opportunities

**This feature represents:**
1. ✨ **First psychedelic-specific CBM protocol** - Pioneer new therapeutic ground
2. 🤖 **AI-personalized cognitive training** - Novel LLM application in mental health
3. 🧩 **Multi-modal integration** - Unique combination of therapeutic approaches
4. 🔬 **Research contribution** - Fill gap in integration literature
5. 🌍 **Open-source potential** - Could share protocol with community

---

## Open Questions

**Pre-Development:**
- [ ] Beta test with select users before full rollout?
- [ ] Pursue IRB approval for formal research?
- [ ] Partner with integration therapists for scenario review?
- [ ] Open-source the scenario database?
- [ ] Target specific user cohorts first (high anxiety, etc.)?

**During Development:**
- [ ] Optimal session length? (research says 10-25 min)
- [ ] How many scenarios per session? (research varies 60-80)
- [ ] Daily vs. 3x/week vs. on-demand?
- [ ] Audio scenarios or text-only?
- [ ] Gamification balance - how much?

**Post-Launch:**
- [ ] Measure effectiveness rigorously?
- [ ] Publish findings?
- [ ] Offer therapist access tier?
- [ ] Create certification program for integration guides?

---

## Alternatives Considered

### Alternative 1: Use Existing CBM App (e.g., Personal Zen)
**Pros:** Faster, validated
**Cons:** Not integrated, not personalized, not psychedelic-specific
**Decision:** Build custom for full integration

### Alternative 2: CBM-I Only (No Attention Training)
**Pros:** Simpler, faster to build
**Cons:** Less comprehensive, research shows both are valuable
**Decision:** Build both, prioritize CBM-I first

### Alternative 3: No AI Personalization (Pre-Built Only)
**Pros:** Simpler, less risk
**Cons:** Miss major innovation opportunity, lower relevance
**Decision:** Build pre-built first, add AI in Phase 2

### Alternative 4: Partner with Researchers First
**Pros:** Credibility, guidance
**Cons:** Slower, may require IRB, less agile
**Decision:** Build MVP, then seek partnerships

---

## Rollout Plan

### Beta Phase (1-2 months)
- [ ] 20-50 select users
- [ ] High engagement users preferred
- [ ] Collect detailed feedback
- [ ] Iterate rapidly
- [ ] Measure preliminary outcomes

### Limited Release (1 month)
- [ ] All existing users invited
- [ ] Prominent in-app placement
- [ ] Educational campaign
- [ ] Monitor engagement closely
- [ ] Support documentation

### General Availability
- [ ] Include in onboarding for new users
- [ ] Marketing: "Evidence-based cognitive training"
- [ ] Integration guide partnerships
- [ ] Research announcements
- [ ] Community case studies

---

## Documentation Needed

**For Users:**
- "What is Cognitive Bias Modification?" (in-app)
- "How CBM Supports Integration" (guide)
- "The Science Behind CBM" (evidence base)
- "CBM vs. Positive Thinking" (avoiding bypass)
- "Tracking Your Progress" (metrics explained)

**For Developers:**
- Technical implementation guide
- Database schema documentation
- Claude API integration patterns
- Scenario creation guidelines
- Testing procedures

**For Therapists/Guides:**
- "Using CBM in Clinical Practice"
- "Interpreting CBM Progress Reports"
- "When to Recommend CBM"
- "Integration with Other Modalities"

---

## Next Steps

1. ✅ **Research complete** (this document + strategy)
2. **Review & approve** feature with stakeholders
3. **Design mockups** (Noesis aesthetic)
4. **Create scenario content** (pre-built library)
5. **Technical architecture review**
6. **Move to in-progress** when ready to build
7. **Assign to appropriate plugin** for implementation

---

## Related Documents

- [CBM Strategy Document](CBM-strategy.md) - Full research synthesis
- [Feature Backlog](INDEX.md) - All features
- [Current Roadmap](../roadmap/current-phase.md) - Timeline
- [Status Overview](../STATUS.md) - Project status

---

**Proposed By:** Claude AI (Research)
**Stakeholder Approval:** Pending
**Technical Review:** Pending
**Design Review:** Pending

**Status:** Ready for Planning Discussion
