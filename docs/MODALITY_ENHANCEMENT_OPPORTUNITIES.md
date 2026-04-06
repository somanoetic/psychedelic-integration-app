# Therapeutic Modality Enhancement Opportunities

**Created:** 2026-02-09
**Purpose:** Assess current app modalities and identify evidence-based enhancement opportunities similar to CBM integration

---

## 🎯 Overview

Following the research into **Cognitive Bias Modification (CBM)** integration, this document assesses ALL current therapeutic modalities in the app to identify similar opportunities for evidence-based, neuroscience-backed enhancements.

**Key Question:** Where else can we incorporate validated therapeutic techniques that leverage neuroplasticity and evidence-based protocols?

---

## 📊 Current Therapeutic Modalities

### 1. **Subliminal Priming** ✅ IMPLEMENTED
**Status:** Fully implemented in GlimmerSwiper game
**Evidence Base:** Strong (PMC 2018, 2019 studies)

**Implementation:**
- `lib/subliminalPrimingService.js` - Core service
- `components/SubliminalFlash.js` - Display component
- `components/GlimmerSwiper.js` - Swipe game with subliminal affirmations

**Technical Details:**
- 40ms flash duration (research-backed optimal)
- Random intervals (3-10 seconds)
- 8 affirmation themes (safety, worth, integration, presence, healing, connection, trust, release)
- Polyvagal state-specific affirmations
- IFS 8 C's affirmations (Calm, Curious, Clear, Compassionate, Confident, Creative, Courageous, Connected)
- User can enable/disable (ethical transparency)
- Effects last up to 25 minutes

**Innovation Level:** ⭐⭐⭐
- Research-backed implementation
- Integration with IFS and polyvagal states
- Psychedelic integration context

**Enhancement Opportunities:**
→ See detailed section below

---

### 2. **Internal Family Systems (IFS)**
**Status:** AI-guided implementation
**Evidence Base:** Strong clinical evidence, growing research base

**Implementation:**
- `lib/ifsAIService.js` - AI guidance for parts work
- `lib/ifsContextService.js` - Context management
- Parts identification, dialogue, unburdening protocols
- Integration with subliminal (8 C's)

**Current Approach:**
- AI-guided conversation
- Parts mapping and tracking
- Somatic awareness integration

**Enhancement Opportunities:**
→ **FEAT-314: Evidence-Based IFS Protocol Integration**

**Research Gap Identified:**
- **Chair Work Adaptation** - Empty chair technique for parts dialogue
  - Evidence: Strong for Gestalt therapy, adaptable to IFS
  - Implementation: Guided audio prompts for chair work
  - Integration: Pre-record or AI-generate dialogue prompts

- **Parts Mapping Visualization** - Visual "map" of internal system
  - Evidence: Art therapy research supports visual representation
  - Implementation: Interactive parts wheel/diagram
  - Benefits: Spatial understanding of system

- **Implicit Parts Work** - Subliminal exposure to C's and Self-energy
  - Evidence: Priming research + IFS theory
  - Implementation: Subliminal exposure to 8 C's during journaling
  - Already partially implemented in subliminal service

**Estimated Effort:** 2-3 weeks
**Priority:** Medium
**Research Base:** Strong clinical evidence, moderate research validation

---

### 3. **Polyvagal Theory / Nervous System Regulation**
**Status:** AI-guided state assessment and practices
**Evidence Base:** Strong (Stephen Porges, Deb Dana)

**Implementation:**
- `lib/polyvagalAIService.js` - State assessment
- `lib/nervousSystemMappingAIService.js` - Mapping service
- `lib/polyvagalContextService.js` - Context management
- `lib/triggersGlimmersAIService.js` - Trigger/glimmer mapping
- `lib/regulatingResourcesAIService.js` - Resource building

**Current Approach:**
- AI-based state assessment (dorsal, sympathetic, ventral)
- Polyvagal ladder visualization
- State-specific practices
- Trigger and glimmer identification

**Enhancement Opportunities:**
→ **FEAT-315: Biometric-Enhanced Polyvagal Tracking**

**Research-Backed Additions:**

**A. Heart Rate Variability (HRV) Integration**
- Evidence: HRV is gold standard for vagal tone measurement
- Implementation: Phone camera PPG (photoplethysmography) or wearable integration
- Benefits: Objective nervous system state measurement
- Complexity: Medium (camera-based) to High (wearable APIs)
- Similar Apps: HeartMath, Elite HRV

**B. Breathing Pattern Analysis**
- Evidence: Respiratory sinus arrhythmia (RSA) indicates vagal function
- Implementation: Audio analysis or manual breath tracking
- Benefits: Real-time state feedback during breathwork
- Complexity: Medium

**C. Polyvagal Exercises Protocol Library**
- Evidence: Deb Dana's polyvagal exercises, Stanley Rosenberg's vagus nerve work
- Implementation: Structured exercise library with video/audio guidance
  - Voo breath (ventral vagal toning)
  - Basic exercise (vagus nerve stimulation)
  - Social engagement exercises
  - Co-regulation practices
- Already partially implemented, could expand

**D. Neuroception Training**
- Evidence: Porges' neuroception concept
- Implementation: Guided practice for safety cue awareness
- Benefits: Improved automatic safety detection
- Complexity: Low-Medium

**Estimated Effort:** 3-4 weeks (without HRV), 6-8 weeks (with biometrics)
**Priority:** Medium-High
**Research Base:** Extremely strong

---

### 4. **Journaling / Reflective Writing**
**Status:** AI-guided prompts and analysis
**Evidence Base:** Strong (Pennebaker's expressive writing research)

**Implementation:**
- `lib/dailyJournalAIService.js` - AI prompts
- Integration with all other modalities
- Sentiment analysis potential

**Current Approach:**
- Open-ended journaling
- AI-generated prompts
- Context-aware suggestions

**Enhancement Opportunities:**
→ **FEAT-316: Evidence-Based Journaling Protocols**

**Research-Backed Additions:**

**A. Structured Expressive Writing Protocol (Pennebaker Method)**
- Evidence: 20+ years of research, proven mental/physical health benefits
- Implementation:
  - 4-day protocol (15-20 min/day)
  - Specific prompts about traumatic/difficult experiences
  - Progressive depth exploration
  - Integration phase prompts
- Benefits: Reduced PTSD symptoms, improved immune function, better integration
- Complexity: Low
- **This is a MAJOR opportunity - well-researched, easy to implement**

**B. Gratitude Journaling Protocol**
- Evidence: Strong positive psychology research (Emmons, McCullough)
- Implementation:
  - Daily "3 good things" practice
  - Gratitude letter writing
  - Integration-specific gratitude ("What am I grateful this experience taught me?")
- Benefits: Increased well-being, reduced depression
- Complexity: Very Low

**C. Meaning-Making Journaling (McAdams Narrative Identity)**
- Evidence: Narrative psychology research
- Implementation:
  - Life story chapters
  - Turning points identification
  - Redemption sequences
  - How psychedelic experience fits into life narrative
- Benefits: Enhanced integration, identity coherence
- Complexity: Medium

**D. Future Self Journaling**
- Evidence: Temporal self-continuity research, mental time travel
- Implementation:
  - Letter to/from future self
  - Timeline visualization
  - "Future me" dialogue
- Benefits: Behavior change, goal commitment
- Complexity: Low

**E. Ecological Momentary Assessment (EMA)**
- Evidence: Strong research methodology in psychology
- Implementation:
  - Random prompts throughout day
  - Brief mood/state check-ins
  - Track integration in real-time
- Benefits: Rich longitudinal data, pattern recognition
- Complexity: Medium

**Estimated Effort:** 2-3 weeks for core protocols
**Priority:** High (low-hanging fruit with strong evidence)
**Research Base:** Extremely strong (decades of research)

---

### 5. **Breathwork Practices**
**Status:** Guided practices available
**Evidence Base:** Strong (various traditions + modern research)

**Current Approach:**
- Audio-guided breathwork
- Box breathing, coherent breathing, etc.

**Enhancement Opportunities:**
→ **FEAT-317: Advanced Breathwork Protocols**

**Research-Backed Additions:**

**A. Resonance Frequency Breathing (Coherence Training)**
- Evidence: Strong HRV and vagal tone research
- Implementation:
  - Find user's resonance frequency (typically 5.5-6 breaths/min)
  - Visual/audio pacing
  - HRV feedback (if implemented)
- Benefits: Maximum vagal stimulation, optimal coherence
- Complexity: Medium

**B. Breathwork for Trauma Release (Tension & Trauma Releasing Exercises adapted)**
- Evidence: Somatic experiencing research, TRE® protocols
- Implementation:
  - Guided shaking/tremoring protocols
  - Breath patterns that facilitate release
  - Safety protocols and grounding
- Benefits: Trauma integration, somatic release
- Complexity: Medium-High (safety considerations)

**C. Wim Hof Method Integration**
- Evidence: Published research on immune function, inflammation
- Implementation:
  - Guided hyperventilation protocol
  - Breath retention timing
  - Cold exposure guidance (optional)
- Benefits: Resilience, energy, immune function
- Complexity: Medium
- **Safety note:** Requires clear contraindications

**D. Pranayama Protocols**
- Evidence: Ancient practices with growing research validation
- Implementation:
  - Nadi Shodhana (alternate nostril)
  - Bhramari (humming bee breath)
  - Ujjayi (ocean breath)
- Benefits: Nervous system regulation, meditation preparation
- Complexity: Low-Medium

**Estimated Effort:** 2-4 weeks
**Priority:** Medium
**Research Base:** Strong and growing

---

### 6. **Core Beliefs Work**
**Status:** AI-guided exploration
**Evidence Base:** Strong (CBT, schema therapy research)

**Implementation:**
- `lib/coreBeliefsAIService.js` - Belief exploration
- Socratic questioning
- Belief restructuring

**Enhancement Opportunities:**
→ **FEAT-318: Schema Therapy Integration**

**Research-Backed Additions:**

**A. Early Maladaptive Schemas (EMS) Assessment**
- Evidence: Schema therapy research (Young, Klosko)
- Implementation:
  - Young Schema Questionnaire (adapted)
  - 18 core schemas identification
  - Schema mode mapping
- Benefits: Deeper pattern understanding
- Complexity: Medium

**B. Schema Flashcard Intervention**
- Evidence: Schema therapy protocols
- Implementation:
  - Flashcard creation for schema challenges
  - Daily schema-busting affirmations
  - Integration with subliminal system
- Benefits: Active schema modification
- Complexity: Low-Medium

**C. Imagery Rescripting**
- Evidence: Strong research for trauma and schemas
- Implementation:
  - Guided imagery to "rescript" traumatic memories
  - Inner child work integration
  - Adult self intervenes in memory
- Benefits: Emotional processing, schema healing
- Complexity: Medium-High

**Estimated Effort:** 3-4 weeks
**Priority:** Medium
**Research Base:** Strong (schema therapy well-validated)

---

### 7. **Somatic Practices**
**Status:** Body scanning, somatic awareness
**Evidence Base:** Strong (somatic experiencing, EMDR, body psychotherapy)

**Current Approach:**
- Basic body scan guidance
- Integration with nervous system work

**Enhancement Opportunities:**
→ **FEAT-319: Advanced Somatic Integration**

**Research-Backed Additions:**

**A. EMDR-Inspired Bilateral Stimulation**
- Evidence: EMDR highly researched for trauma
- Implementation:
  - Audio bilateral tones (alternating ears)
  - Visual bilateral movement
  - Tactile bilateral tapping prompts
  - Integration with trauma processing
- Benefits: Trauma integration, emotional regulation
- Complexity: Medium
- **Legal note:** Can't call it "EMDR" without certification, but bilateral stimulation is public domain

**B. Somatic Experiencing (SE) Protocols**
- Evidence: Peter Levine's research
- Implementation:
  - Titration guidance (small doses)
  - Pendulation between activation and resource
  - Discharge completion prompts
  - Tracking sensations protocol
- Benefits: Trauma integration without re-traumatization
- Complexity: Medium-High

**C. Focusing (Gendlin)**
- Evidence: Research-validated body-oriented psychotherapy
- Implementation:
  - 6-step Focusing protocol
  - Felt sense exploration
  - Body wisdom accessing
- Benefits: Deeper self-awareness, emotional processing
- Complexity: Medium

**D. Progressive Muscle Relaxation (PMR)**
- Evidence: Strong anxiety research (Jacobson's method)
- Implementation:
  - Guided tension-release sequences
  - Full body protocol
  - Quick versions for acute anxiety
- Benefits: Anxiety reduction, body awareness
- Complexity: Low

**E. Trauma-Sensitive Yoga Principles**
- Evidence: Growing research base (TCTSY)
- Implementation:
  - Invitational language
  - Choice and agency emphasis
  - Interoceptive awareness
  - Gentle movement sequences
- Benefits: Embodiment, safety, empowerment
- Complexity: Medium

**Estimated Effort:** 4-6 weeks for comprehensive implementation
**Priority:** High (trauma is common in this population)
**Research Base:** Very strong

---

### 8. **Mindfulness / Meditation**
**Status:** Basic guided practices
**Evidence Base:** Extremely strong (thousands of studies)

**Current Approach:**
- Guided meditations available
- Mindfulness in breathwork

**Enhancement Opportunities:**
→ **FEAT-320: Evidence-Based Meditation Protocols**

**Research-Backed Additions:**

**A. Mindfulness-Based Stress Reduction (MBSR) Adapted**
- Evidence: Gold standard, Jon Kabat-Zinn's research
- Implementation:
  - 8-week MBSR-inspired program
  - Body scan, sitting meditation, mindful movement
  - Integration-specific adaptations
- Benefits: Stress reduction, emotional regulation, well-being
- Complexity: Medium
- **Major opportunity:** MBSR is perhaps the most well-researched intervention

**B. Loving-Kindness Meditation (Metta)**
- Evidence: Strong positive psychology and neuroscience research
- Implementation:
  - Guided metta practice
  - Self, loved ones, difficult people, all beings
  - Integration with parts work ("metta for my parts")
- Benefits: Self-compassion, empathy, positive emotion
- Complexity: Low

**C. Open Monitoring Meditation**
- Evidence: Advanced meditation research
- Implementation:
  - Choiceless awareness practice
  - Noting practice
  - Integration with psychedelic insights
- Benefits: Meta-awareness, insight, equanimity
- Complexity: Medium-High

**D. Meditation for Difficult Emotions (RAIN protocol)**
- Evidence: Tara Brach's work, mindfulness research
- Implementation:
  - Recognize, Allow, Investigate, Nurture
  - Guided difficult emotion practice
  - Integration-specific applications
- Benefits: Emotional regulation, self-compassion
- Complexity: Low-Medium

**Estimated Effort:** 2-4 weeks for core protocols
**Priority:** High (well-researched, highly requested)
**Research Base:** Extremely strong

---

### 9. **Psychedelic Integration Frameworks**
**Status:** AI-guided, multiple frameworks
**Evidence Base:** Emerging (clinical practice-based)

**Implementation:**
- `lib/enhancedClaudeService.js` - Integration guide
- `lib/experienceMappingService.js` - Robert Johnson's 4-step
- `lib/therapeuticIntegrationService.js` - Multi-framework

**Current Frameworks:**
- Robert Johnson's 4-step (Association, Interpretation, Embodiment, Ritual)
- General integration dialogue
- Meaning-making support

**Enhancement Opportunities:**
→ **FEAT-321: Evidence-Based Integration Protocols**

**Research-Backed Additions:**

**A. ACE (Accept, Connect, Embody) Model**
- Evidence: Emerging psychedelic integration research
- Implementation:
  - Structured ACE protocol
  - Accept: Non-judgmental acceptance of experience
  - Connect: Meaning-making and life connection
  - Embody: Behavioral integration
- Benefits: Structured integration pathway
- Complexity: Low-Medium

**B. EMBARK Model (Imperial College)**
- Evidence: Research-backed psychedelic therapy model
- Implementation:
  - Existential, Mindfulness, Body-aware, Affective, Relational, Keeping momentum
  - Each domain has specific practices
  - Long-term integration support
- Benefits: Comprehensive, evidence-based framework
- Complexity: Medium
- **This is cutting-edge psychedelic research**

**C. Integration Timeline Protocol**
- Evidence: Clinical consensus (Gorman et al., 2021)
- Implementation:
  - Immediate (0-24 hours): Rest, hydration, grounding
  - Acute (1-7 days): Processing, journaling, support
  - Short-term (1-4 weeks): Meaning-making, behavioral changes
  - Long-term (1+ months): Sustained integration, lifestyle changes
  - Automated timeline guidance
- Benefits: Structured expectations, reduced confusion
- Complexity: Low-Medium

**D. Psychedelic Integration Inventory (PII)**
- Evidence: Emerging assessment tool research
- Implementation:
  - Regular integration quality assessments
  - Track mystical experience, psychological insight, challenging content
  - Longitudinal tracking
- Benefits: Objective integration measurement
- Complexity: Low

**Estimated Effort:** 2-3 weeks for protocols
**Priority:** High (core to app mission)
**Research Base:** Emerging but growing rapidly

---

## 🎯 Priority Matrix

### Tier 1: High Priority, High Evidence, Low Complexity

| Feature | Evidence | Effort | Impact | Priority |
|---------|----------|--------|--------|----------|
| **FEAT-313: CBM Integration** | ⭐⭐⭐⭐⭐ | 4-5 months | High | **PLANNED** |
| **FEAT-316: Expressive Writing (Pennebaker)** | ⭐⭐⭐⭐⭐ | 2 weeks | High | **NEXT** |
| **FEAT-320: MBSR Adapted** | ⭐⭐⭐⭐⭐ | 3 weeks | High | **NEXT** |
| **FEAT-316: Gratitude Journaling** | ⭐⭐⭐⭐ | 1 week | Medium | **QUICK WIN** |
| **FEAT-321: Integration Timeline** | ⭐⭐⭐⭐ | 2 weeks | High | **QUICK WIN** |

### Tier 2: High Priority, High Evidence, Medium Complexity

| Feature | Evidence | Effort | Impact | Priority |
|---------|----------|--------|--------|----------|
| **FEAT-319: EMDR-Inspired Bilateral Stim** | ⭐⭐⭐⭐⭐ | 3 weeks | High | **SOON** |
| **FEAT-314: IFS Chair Work** | ⭐⭐⭐⭐ | 2 weeks | Medium | **SOON** |
| **FEAT-315: Polyvagal Exercise Library** | ⭐⭐⭐⭐⭐ | 3 weeks | High | **SOON** |
| **FEAT-321: EMBARK Model** | ⭐⭐⭐⭐ | 3 weeks | High | **SOON** |

### Tier 3: Medium Priority or Higher Complexity

| Feature | Evidence | Effort | Impact | Priority |
|---------|----------|--------|--------|----------|
| **FEAT-315: HRV Biometrics** | ⭐⭐⭐⭐⭐ | 6-8 weeks | High | **LATER** |
| **FEAT-319: Somatic Experiencing** | ⭐⭐⭐⭐ | 4 weeks | High | **LATER** |
| **FEAT-317: Wim Hof Method** | ⭐⭐⭐ | 3 weeks | Medium | **LATER** |
| **FEAT-318: Schema Therapy** | ⭐⭐⭐⭐ | 4 weeks | Medium | **LATER** |

---

## 🔬 Subliminal System: Current Status & Opportunities

### Current Implementation ✅

**What's Working:**
- 40ms optimal flash duration (research-backed)
- 8 comprehensive affirmation themes
- Polyvagal state-specific affirmations
- IFS 8 C's integration
- User control (ethical transparency)
- Implemented in GlimmerSwiper game

**Research Base:**
- "Subliminal Priming—State of the Art" (PMC, 2018)
- "Emotional priming depends on degree of conscious experience" (2019)
- Effects last up to 25 minutes

### Enhancement Opportunities for Subliminal System

→ **FEAT-322: Expanded Subliminal Integration**

**A. Subliminal Priming Throughout App**
**Current:** Only in GlimmerSwiper game
**Opportunity:** Integrate subliminal flashes across the app
- During journaling (self-worth affirmations)
- During breathwork (safety, presence)
- During meditation (relevant to practice)
- During integration reading (growth, trust)
**Effort:** 1-2 weeks
**Impact:** High (maximize exposure, maintain therapeutic dose)
**Evidence:** Research shows repeated exposure strengthens effect

**B. Context-Aware Subliminal Content**
**Current:** General affirmation pools
**Opportunity:** AI-selected subliminal content based on context
- User's nervous system state → relevant polyvagal affirmations
- Active IFS part → Self-energy C's for that part
- Core belief work → counter-schema affirmations
- Integration phase → phase-appropriate messages
**Effort:** 1 week (leverages existing context service)
**Impact:** High (personalization increases relevance)
**Innovation:** Novel AI + subliminal combination

**C. Subliminal Imagery (Beyond Text)**
**Current:** Text affirmations only
**Opportunity:** Brief image flashes
- Faces showing safety cues (smiles, warm eyes)
- Nature scenes (grounding, safety)
- Abstract art (meaning, beauty)
- Symbolic images (growth, healing)
**Effort:** 2-3 weeks (image curation + implementation)
**Impact:** Medium-High (visual system may be more powerful)
**Evidence:** Visual subliminal priming research exists
**Related to:** Attention Bias Modification (CBM-ABM)

**D. Subliminal + Explicit Priming Combo**
**Current:** Subliminal only
**Opportunity:** Combine subliminal with supraliminal
- Subliminal: "I am safe" (40ms)
- Followed by explicit: Breathing exercise or safety visualization
- Priming enhances conscious practice
**Effort:** 1 week
**Impact:** Medium (research shows combined effects)
**Evidence:** Priming research supports multilevel processing

**E. Measurement & Optimization**
**Current:** No outcome tracking for subliminal
**Opportunity:** A/B testing and effectiveness measurement
- Track mood before/after GlimmerSwiper sessions
- Compare subliminal-enabled vs disabled
- Optimize themes, frequency, timing
- Contribute to subliminal priming research
**Effort:** 2 weeks
**Impact:** High (data-driven optimization)
**Research Contribution:** Could publish findings

**F. Backward Masking Enhancement**
**Current:** Direct flash without masking
**Opportunity:** True backward masking protocol
- Flash affirmation (40ms)
- Immediately followed by masking pattern/image
- Strengthens subliminal effect per research
**Effort:** 1 week
**Impact:** Medium (research shows masking strengthens effect)
**Evidence:** Explicit in subliminal priming literature

### Estimated Total Effort for Subliminal Enhancements
**2-4 weeks** for high-priority items (A, B, E)
**4-6 weeks** for comprehensive implementation (all features)

**Priority:** Medium-High (existing system, easy to expand)

---

## 🚀 Recommended Implementation Order

### Phase 1: Quick Wins (Q2 2026)
1. **FEAT-313: CBM Integration** (already planned, 4-5 months)
2. **FEAT-316: Expressive Writing Protocol** (2 weeks) ⭐ High ROI
3. **FEAT-316: Gratitude Journaling** (1 week) ⭐ Quick win
4. **FEAT-321: Integration Timeline** (2 weeks) ⭐ Core mission

**Total:** 5-6 months parallel to CBM

### Phase 2: Evidence-Based Expansion (Q3 2026)
1. **FEAT-320: MBSR Adapted** (3 weeks) - Most researched intervention
2. **FEAT-322: Expanded Subliminal** (2 weeks) - Leverage existing
3. **FEAT-319: EMDR Bilateral Stim** (3 weeks) - High trauma relevance
4. **FEAT-315: Polyvagal Exercise Library** (3 weeks) - Complete existing work

**Total:** 11 weeks

### Phase 3: Advanced Modalities (Q4 2026)
1. **FEAT-321: EMBARK Model** (3 weeks) - Cutting-edge integration
2. **FEAT-314: IFS Chair Work** (2 weeks) - Deepen IFS
3. **FEAT-319: Somatic Experiencing** (4 weeks) - Trauma focus
4. **FEAT-315: HRV Biometrics** (6-8 weeks) - Major infrastructure

**Total:** 15-17 weeks

---

## 📈 Expected Outcomes

**User Benefits:**
- More evidence-based interventions
- Greater integration effectiveness
- Multiple modality options (personalization)
- Measurable outcomes
- Research-backed confidence

**App Differentiation:**
- Most comprehensive evidence-based integration app
- Research-backed approach (not just "vibes")
- Contribution to integration science
- Clinical credibility

**Research Opportunities:**
- Novel combinations (CBM + psychedelic, AI + subliminal)
- Effectiveness data collection
- Academic partnerships
- Published protocols

---

## 📚 Key Research Sources

**Cognitive Bias Modification:**
- Behavior Research and Therapy (2024) - CBM implementation
- JMIR Mental Health (2024) - Mobile CBM effectiveness

**Journaling:**
- Pennebaker, J. W. - Expressive writing paradigm
- Emmons & McCullough - Gratitude research

**Mindfulness:**
- Kabat-Zinn - MBSR protocols
- Tara Brach - RAIN protocol

**Somatic:**
- Levine, P. - Somatic Experiencing
- van der Kolk - Body Keeps the Score
- Gendlin - Focusing

**Polyvagal:**
- Porges, S. - Polyvagal theory
- Dana, D. - Clinical applications

**Psychedelic Integration:**
- Gorman et al. (2021) - Integration best practices
- EMBARK manual (Imperial College)
- ACE model (various sources)

**Subliminal:**
- PMC (2018) - "Subliminal Priming—State of the Art"
- Various backward masking research

---

## ✅ Action Items

1. **Review this document** with stakeholders
2. **Prioritize features** based on resources and mission
3. **Create feature specs** for Tier 1 priorities
4. **Update roadmap** to include selected enhancements
5. **Consider research partnerships** for novel combinations
6. **Budget allocation** for any required tools/resources

---

**Next Steps:**
- Add selected features to `context/features/planned.md`
- Update roadmap phases
- Begin with highest ROI items (Expressive Writing, Gratitude)
- Build incrementally while CBM is in development

**This represents a comprehensive evidence-based enhancement strategy for the entire app.**

---

**Created By:** Claude AI (Strategic Analysis)
**Status:** Ready for Review
**Related:** FEAT-313 (CBM Integration), All therapeutic modalities
