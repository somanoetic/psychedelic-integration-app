# Cognitive Bias Modification (CBM) Integration Strategy

**Created:** 2026-02-09
**Status:** Research & Planning Phase
**Priority:** Medium-High (Aligns with core mission)

---

## 🎯 Executive Summary

Cognitive Bias Modification (CBM) is an evidence-based digital intervention that retrains automatic cognitive biases associated with anxiety, depression, and trauma. Integrating CBM into Psycheteleos could significantly enhance the integration process by helping users modify rigid negative thought patterns that often surface after psychedelic experiences.

**Key Insight:** Psychedelics increase cognitive flexibility and "belief relaxation" - CBM could help users capitalize on this window of neuroplasticity to establish healthier cognitive patterns.

---

## 📚 What is Cognitive Bias Modification?

CBM is a computerized training technique that targets and modifies automatic cognitive biases through repeated practice. Unlike traditional therapy that relies on conscious reasoning, CBM works at the implicit, automatic level.

### Two Main Types

**1. Attention Bias Modification (ABM/ABMT)**
- Retrains where attention automatically goes
- Uses visual probe tasks (often gamified)
- Helps shift attention away from threat/negative stimuli
- Evidence: Reduces anxiety, stress, PTSD symptoms

**2. Interpretation Bias Modification (CBM-I)**
- Retrains how ambiguous situations are interpreted
- Uses word completion or scenario tasks
- Promotes benign/positive interpretations over threatening ones
- Evidence: Effective for anxiety, depression, obsessive beliefs, phobias

---

## 🔬 Evidence Base

### Recent Research (2024-2025)

**State of the Science (2024):**
- CBM has evolved from experimental method to promising digital mental health tool
- Particularly effective when combined with other therapeutic approaches
- Smartphone delivery makes it accessible and scalable
- Source: [Behavior Research and Therapy, 2024](https://www.sciencedirect.com/science/article/pii/S0005796724000846)

**Mobile Implementation (2024):**
- Smartphone-delivered ABMT shows promise for remote mental health support
- Gamification increases engagement and adherence
- Can be used in daily settings beyond clinical environments
- Source: [JMIR Mental Health, 2024](https://mental.jmir.org/2024/1/e56326)

**Interpretation Bias (2025):**
- CBM-I effective at improving interpretation biases and anxiety symptoms
- Treatment gains remain significant at 2-month follow-up
- Web-based delivery allows home-based training
- Challenge: Treatment dropout remains an issue
- Source: [Multiple studies, 2024-2025](https://www.tandfonline.com/doi/full/10.1080/21642850.2024.2396140)

### Target Conditions
- Anxiety disorders (GAD, social anxiety, phobias)
- Depression and negative thinking patterns
- PTSD and trauma-related attention biases
- Obsessive beliefs and contamination fears
- Substance use and addiction-related cues
- Chronic fatigue in long-term health conditions

---

## 🍄 Psychedelics + CBM: A Natural Synergy

### Why This Combination Makes Sense

**1. Belief Relaxation Window**
- Psychedelics induce temporary "belief relaxation" - making rigid beliefs more flexible
- This creates an optimal window for cognitive pattern change
- CBM could help establish new patterns during this neuroplastic state
- Source: [PMC - Learning to Let Go](https://pmc.ncbi.nlm.nih.gov/articles/PMC7046795/)

**2. Cognitive-Behavioral Integration**
- Psychedelic therapy increasingly incorporates CBT techniques
- CBM is a natural digital extension of CBT approaches
- Both target cognitive biases (negative bias in depression, threat bias in anxiety)
- Source: [Frontiers in Psychology, 2022](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2022.873279/full)

**3. Pattern Separation Enhancement**
- Psychedelics may enhance hippocampal pattern separation
- This mnemonic process helps distinguish similar inputs
- Impairment underlies negative cognitive bias in depression
- CBM + psychedelics could synergistically improve pattern separation
- Source: [ScienceDirect, 2021](https://www.sciencedirect.com/science/article/pii/S1074742721000897)

**4. Operant Conditioning During Integration**
- Psychedelics may increase motivation for acceptance through operant conditioning
- CBM provides repeated practice that reinforces new patterns
- Integration period is ideal for establishing these new habits

### Current Research Gap

**Important:** While research supports both psychedelics for cognitive flexibility AND CBM for bias modification, there are **no published studies specifically combining CBM with psychedelic integration**. This represents an innovative, evidence-informed approach rather than validated protocol.

---

## 🎮 Implementation Strategy for Psycheteleos

### Phase 1: Core CBM Features (MVP)

**A. Interpretation Bias Modification (CBM-I)**

**Format: Word Completion Scenarios**
```
Example scenario:
"You run into an acquaintance from a past integration circle.
They seem distant and don't stay to chat. You think..."

Options:
a) "They're probably busy and in a rush" ✓ (positive)
b) "They don't like me anymore" ✗ (negative)

User completes the positive interpretation.
Repeated practice trains positive interpretation bias.
```

**Implementation Details:**
- 10-15 minute sessions
- 60-80 scenarios per session
- Scenarios specific to integration experiences:
  * Social situations post-journey
  * Difficult emotions or sensations
  * Ambiguous spiritual/mystical experiences
  * Parts work and internal conflicts
  * Daily life challenges
- Progressive difficulty
- Track completion and improvement

**B. Attention Training (Visual Probe Task)**

**Format: Gamified Attention Retraining**
```
Example task:
Two images appear briefly (faces or scenes)
- One neutral/positive
- One negative/threatening

User taps location where probe appears
Probe consistently appears in positive location
Trains attention toward positive stimuli
```

**Integration-Specific Adaptation:**
- Use imagery relevant to integration:
  * Nature scenes (grounding)
  * Safe spaces vs. overwhelming spaces
  * Calm faces vs. anxious faces
  * Somatic cues (relaxed vs. tense body states)
- 5-10 minute sessions
- Can be done as daily "micro-practice"

### Phase 2: Integration-Enhanced Features

**A. Context-Aware CBM**

**Pre-Journey Preparation:**
- Focus on positive interpretation of challenging experiences
- Attention training for grounding anchors
- Reinforce trust, safety, openness

**Post-Journey Integration (0-7 days):**
- Scenarios about difficult experience content
- Interpretation bias toward meaning-making vs. rumination
- Attention training for somatic resources vs. anxiety cues

**Ongoing Integration (Week 2+):**
- Daily life scenarios with integration lens
- Attention to growth signals vs. threat signals
- Reinforcing new patterns and beliefs

**B. AI-Personalized Scenarios**

Use Claude API to generate personalized CBM-I scenarios based on:
- User's journal entries
- Identified cognitive patterns
- Specific integration challenges
- Core beliefs work
- Parts identified in IFS work

**Example Flow:**
```javascript
// User journals about social anxiety after journey
const journalEntry = "I feel like people can see through me now,
                      like they know I'm broken..."

// AI generates personalized CBM-I scenarios
const scenarios = await generateCBMScenarios({
  theme: 'social_anxiety',
  userContext: journalEntry,
  coreBeliefs: ['I am broken', 'Others will judge me'],
  count: 10
});

// Scenarios specifically address user's patterns
// while training positive interpretations
```

**C. Integration with Existing Features**

**Nervous System Mapping:**
- CBM session as regulation practice
- Track polyvagal state before/after
- Use CBM when in hyperarousal or hypoarousal

**Core Beliefs Work:**
- Target specific limiting beliefs with CBM-I
- Generate scenarios that challenge core beliefs
- Track belief flexibility over time

**Daily Journal:**
- Suggest CBM practice when negative patterns detected
- Journal reflections on CBM insights
- Track cognitive shift metrics

**Parts Work (IFS):**
- Create scenarios featuring different parts
- Practice compassionate interpretations toward parts
- Reinforce Self-energy and unburdening

### Phase 3: Advanced Features

**A. Adaptive Training**
- AI adjusts difficulty based on performance
- Identifies persistent biases needing more work
- Celebrates progress and shifts

**B. Micro-Dosing + CBM Protocol**
- For users micro-dosing during integration
- CBM sessions timed with micro-dose days
- Track synergistic effects

**C. Social CBM**
- Optional: Share progress with integration circles
- Group challenges and accountability
- Therapist/guide dashboard (future)

**D. Research Contribution**
- Opt-in anonymous data collection
- Contribute to CBM + psychedelic integration research
- Partner with research institutions

---

## 🎨 Design Considerations (Noesis Aesthetic)

### Visual Style
- Calm, spacious interface (#1a1a2e background)
- Gentle animations and transitions
- Lavender accents (#9d84b7) for positive choices
- Warm cream text (#f4f1de)
- Avoid harsh contrasts or aggressive timers

### Gamification Balance
- Progress tracking without pressure
- Gentle encouragement, not competition
- Optional streak tracking
- Focus on intrinsic motivation

### Accessibility
- Text size options
- Audio scenarios (optional)
- Colorblind-friendly visual probes
- Pause/resume capability

---

## 📊 Success Metrics

### User Engagement
- Session completion rate
- Daily/weekly practice frequency
- Time spent in CBM vs. other features
- User-reported helpfulness ratings

### Clinical Outcomes (Self-Report)
- Pre/post interpretation bias questionnaires
- Anxiety and depression symptom scales
- Integration quality ratings
- Cognitive flexibility self-assessment

### Behavioral Markers
- Changes in journal sentiment over time
- Shift in core beliefs scores
- Nervous system regulation improvements
- Reduced crisis/support requests

---

## 🛠️ Technical Implementation

### Architecture

```
components/cbm/
├── CBMIntro.js              # Onboarding and education
├── CBMSettings.js           # Preferences, difficulty
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

### Data Storage (Supabase)

```sql
-- CBM sessions table
CREATE TABLE cbm_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  session_type TEXT, -- 'interpretation' or 'attention'
  context TEXT, -- 'pre_journey', 'post_journey', 'ongoing'
  scenarios_completed INT,
  accuracy_rate FLOAT,
  response_times JSONB,
  created_at TIMESTAMPTZ
);

-- Scenario responses
CREATE TABLE cbm_responses (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES cbm_sessions(id),
  scenario_id TEXT,
  user_choice TEXT,
  correct_choice TEXT,
  response_time INT, -- milliseconds
  created_at TIMESTAMPTZ
);

-- Progress tracking
CREATE TABLE cbm_progress (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  total_sessions INT,
  streak_days INT,
  interpretation_bias_score FLOAT, -- tracking changes
  attention_bias_score FLOAT,
  last_session_at TIMESTAMPTZ,
  preferences JSONB
);
```

### Claude API Integration

**AI-Generated Scenarios:**
```javascript
const systemPrompt = `You are an expert in psychedelic integration and
cognitive bias modification. Generate CBM-I scenarios that:

1. Present ambiguous integration-related situations
2. Offer one positive/benign interpretation
3. Offer one negative/threatening interpretation
4. Are personally relevant to the user's journey
5. Reinforce growth-oriented meaning-making
6. Avoid toxic positivity or bypassing
7. Maintain psychological safety

User context: ${userJournalSummary}
Core beliefs: ${coreBeliefs}
Integration phase: ${integrationPhase}

Generate 10 scenarios in this format: [...]`;

const scenarios = await claudeService.generateScenarios(systemPrompt);
```

---

## 🚧 Potential Challenges & Mitigations

### Challenge 1: User Dropout
**Research Finding:** Dropout is common in digital CBM interventions

**Mitigations:**
- Keep sessions short (5-15 min)
- Gamify without pressure
- Integrate with existing app features
- Push notifications (gentle, optional)
- Show clear progress and impact
- Make it genuinely engaging, not just "homework"

### Challenge 2: Effectiveness Variability
**Research Finding:** Mixed results for smartphone-delivered ABMT

**Mitigations:**
- Offer multiple CBM types (interpretation + attention)
- Personalize with AI to increase relevance
- Combine with other therapeutic features
- Set realistic expectations (tool, not cure)
- A/B test different implementations
- Collect user feedback continuously

### Challenge 3: Spiritual Bypassing Risk
**Integration Concern:** Could CBM promote toxic positivity?

**Mitigations:**
- Frame as "flexibility training" not "positive thinking"
- Include scenarios that validate difficult emotions
- Emphasize both/and thinking, not either/or
- Integrate with IFS parts work (honoring all parts)
- Educational content on healthy vs. bypassing interpretations
- Therapist review of AI-generated scenarios

### Challenge 4: Research Gap
**Reality:** No published CBM + psychedelic studies

**Approach:**
- Transparent about evidence base
- Frame as evidence-informed innovation
- Built on solid foundations (CBM works, psychedelics increase flexibility)
- Invite research partnerships
- Rigorous internal evaluation
- User consent for research participation

---

## 📈 Roadmap

### Phase 1: Foundation (2-3 months)
- [ ] Research synthesis document (this file ✓)
- [ ] Create feature spec: `context/features/FEAT-301-cbm-integration.md`
- [ ] Design mockups (Noesis aesthetic)
- [ ] Build core CBM-I module (pre-built scenarios)
- [ ] Build basic attention training module
- [ ] Implement progress tracking
- [ ] Internal testing and refinement

### Phase 2: AI Enhancement (1-2 months)
- [ ] Develop Claude API scenario generation
- [ ] Integrate with journal and core beliefs
- [ ] Context-aware recommendations
- [ ] Personalization algorithms
- [ ] Beta user testing

### Phase 3: Integration (1 month)
- [ ] Connect with nervous system mapping
- [ ] Link to IFS parts work
- [ ] Journey timeline integration (pre/post/ongoing)
- [ ] Comprehensive user testing

### Phase 4: Polish & Launch (1 month)
- [ ] Refine based on feedback
- [ ] Educational content and onboarding
- [ ] Launch to existing users
- [ ] Monitor engagement and outcomes

### Phase 5: Research & Iteration (Ongoing)
- [ ] Partner with research institutions
- [ ] Collect efficacy data (with consent)
- [ ] Publish findings
- [ ] Continuous improvement based on data

**Total Timeline:** 5-7 months to full launch

---

## 💡 Innovation Opportunities

**1. First Psychedelic-Specific CBM Protocol**
- Create validated scenarios for integration context
- Publish protocol as open-source contribution
- Become reference implementation

**2. AI-Personalized Cognitive Training**
- Most CBM uses generic scenarios
- AI personalization could significantly boost efficacy
- Novel application of LLMs in mental health

**3. Multi-Modal Integration**
- CBM + nervous system regulation + IFS + journaling
- Holistic approach unique to Psycheteleos
- Evidence-based synergistic effects

**4. Research Contribution**
- Fill gap in psychedelic integration research
- Contribute to CBM effectiveness literature
- Potential academic partnerships

---

## 🎓 Educational Content Needed

**For Users:**
- "What is Cognitive Bias Modification?"
- "How CBM Supports Integration"
- "The Science Behind Attention & Interpretation Training"
- "CBM vs. Positive Thinking: Understanding the Difference"
- "Tracking Your Cognitive Flexibility"

**For Therapists/Guides:**
- "CBM in Integration Therapy"
- "Using CBM Data in Clinical Practice"
- "When to Recommend CBM Practice"
- "Interpreting CBM Progress Reports"

---

## 📚 Key Sources

### Recent Research
- [Towards implementation of CBM in mental health care (2024)](https://www.sciencedirect.com/science/article/pii/S0005796724000846)
- [Smartphone-Delivered ABMT: Systematic Review (2024)](https://mental.jmir.org/2024/1/e56326)
- [AR-Based Gamified Mood Intervention (2024)](https://www.mdpi.com/2674-113X/4/2/8)
- [Mental Health on the Go: Gamified ABM (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC4447237/)

### Psychedelic Therapy Connection
- [Learning to Let Go: CBT Model of Psychedelic Therapy (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC7046795/)
- [Psychedelics and Psychotherapy: Cognitive-Behavioral Approaches (Frontiers)](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2022.873279/full)
- [Improving Cognitive Functioning with Psychedelics (ScienceDirect)](https://www.sciencedirect.com/science/article/pii/S1074742721000897)

### Implementation Guides
- [Review of CBM Apps (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC5992457/)
- [Online Game-Based CBM-I (2024)](https://www.tandfonline.com/doi/full/10.1080/21642850.2024.2396140)
- [Web-Based Interpretation Bias Training (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12010707/)

---

## 🎯 Next Steps

**Immediate Actions:**
1. Review this strategy document with stakeholders
2. Decide: MVP (Phase 1 only) or full roadmap?
3. Create detailed feature spec: `FEAT-301-cbm-integration.md`
4. Design wireframes/mockups
5. Assess technical feasibility and timeline
6. Consider research partnerships early

**Decision Points:**
- **Scope:** Start with CBM-I only, or include ABM?
- **AI:** Build AI generation from start, or Phase 2?
- **Research:** Pursue IRB approval for formal research?
- **Beta:** Limited release to power users first?

**Recommendation:**
Start with **Phase 1** (CBM-I + basic attention training) as standalone feature. If users engage well and report value, proceed to AI enhancement. This validates the concept before heavy AI investment.

---

**Status:** Research Complete - Ready for Feature Planning
**Next Document:** `context/features/FEAT-301-cbm-integration.md`
**Timeline:** Q2 2026 (if prioritized)
