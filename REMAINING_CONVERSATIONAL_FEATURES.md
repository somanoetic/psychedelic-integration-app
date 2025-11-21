# Remaining Conversational Features Implementation

## Completed ✅
1. **Daily Journal** - Full conversational journaling with AI discussion and suggestions
2. **IFS Chat** - Updated to be open-ended and flexible (not rigid 6 F's)
3. **Nervous System Mapping AI Service** - Conversational exploration of polyvagal states

## To Complete

### 1. Nervous System Mapping Component
**File:** `components/ConversationalNervousSystemMapping.js`

**Features:**
- Chat interface similar to Daily Journal
- Guides through Ventral → Sympathetic → Dorsal states (or user's preferred order)
- After conversation, prompts: "Grab paper and crayons!"
- Guide user to draw body outline and color-code where each state lives
- Save both conversation and extracted data
- Show digital visual map after drawing exercise

**Database:**
- Saves to existing `polyvagal_patterns` table
- Stores conversation history in new `conversation` JSONB field (add migration)

---

### 2. Triggers & Glimmers Conversational Feature

**AI Service:** `lib/triggersGlimmersAIService.js`

**System Prompt Concept:**
```
You're helping someone identify:
- **Triggers**: Things that dysregulate their nervous system (push into Sympathetic/Dorsal)
- **Glimmers**: Small moments that bring regulation and safety (Ventral activation)

Explore conversationally:
- "What are some things that tend to throw you off balance?"
- "Tell me about small moments that help you feel safe and connected"
- Extract specific examples and patterns
```

**Component:** `components/ConversationalTriggersGlimmers.js`

**Features:**
- Start with: "Let's explore what impacts your nervous system"
- Conversationally build lists of triggers and glimmers
- AI helps spot patterns
- Saves to database with structured arrays

**Database:**
- Add `conversation` JSONB field to existing triggers/glimmers tables (or create new table)
- Store both raw conversation and extracted lists

---

### 3. Regulating Resources Conversational Discovery

**AI Service:** `lib/regulatingResourcesAIService.js`

**System Prompt Concept:**
```
You're helping someone discover their regulation toolkit - things that help them:
- Return to Ventral state when dysregulated
- Self-soothe
- Feel grounded
- Access safety

Categories to explore:
- Sensory (5 senses grounding)
- Movement (walking, stretching, dance)
- Connection (people, pets, nature)
- Creative (art, music, writing)
- Spiritual/Meaning-making

Ask about what actually works for THEM, not generic advice.
```

**Component:** `components/ConversationalRegulatingResources.js`

**Features:**
- Explore: "What helps you feel grounded when you're stressed?"
- Build personalized resource toolkit
- Categorize naturally through conversation
- Save as structured data

**Database:**
- New table or add to existing resources structure
- Store conversation + extracted resources by category

---

### 4. Core Beliefs Questionnaire + AI Discussion

**Component:** `components/CoreBeliefsAssessment.js`

**Two-Phase Approach:**

**Phase 1: Traditional Questionnaire**
- 100 questions from "Prisoners of Belief"
- 10 domains (10 questions each):
  1. Value/Worthiness
  2. Security/Safety
  3. Performance/Competence
  4. Control/Influence
  5. Love/Belonging
  6. Autonomy/Independence
  7. Justice/Fairness
  8. Belonging/Community
  9. Trust
  10. Standards/Expectations
- Score each domain (0-10)
- Save to `core_beliefs_assessments` table

**Phase 2: AI Discussion**
- After completing questionnaire, show results
- "Would you like to explore these results together?"
- AI discusses:
  - Domains with lowest scores (limiting beliefs)
  - Domains with highest scores (strengths)
  - How beliefs might be impacting their life
  - Strategies for shifting limiting beliefs
- Save discussion transcript

**AI Service:** `lib/coreBeliefsAIService.js`

**System Prompt:**
```
You're helping someone understand their core beliefs assessment results.

Their scores across 10 domains show which beliefs are:
- **Empowering** (high scores) - supporting their growth
- **Limiting** (low scores) - holding them back

Help them:
1. Understand what the scores mean
2. Explore where limiting beliefs came from
3. Question the validity of limiting beliefs
4. Develop more empowering beliefs
5. Create practices to shift beliefs over time

Use CBT, ACT, and narrative therapy techniques.
```

---

## Implementation Priority

1. **Nervous System Mapping Component** (highest impact, uses existing service)
2. **Triggers & Glimmers** (builds on NS mapping)
3. **Regulating Resources** (completes NS regulation toolkit)
4. **Beliefs Questionnaire** (complex, do last)

---

## Testing After Implementation

Update `COMPREHENSIVE_TESTING_GUIDE.md` with:

### New Test Scenarios

**Nervous System Conversational Mapping:**
- [ ] Conversation flows naturally between states
- [ ] Drawing prompt appears after all states mapped
- [ ] Data extracts correctly
- [ ] Saves to polyvagal_patterns table
- [ ] Shows digital visual map

**Triggers & Glimmers:**
- [ ] Identifies specific triggers vs generic
- [ ] Recognizes glimmer moments
- [ ] Categorizes appropriately
- [ ] Saves structured data

**Regulating Resources:**
- [ ] Discovers personalized (not generic) resources
- [ ] Categorizes naturally
- [ ] Builds comprehensive toolkit
- [ ] Saves in usable format

**Beliefs Questionnaire:**
- [ ] All 100 questions load
- [ ] Scoring calculates correctly
- [ ] Results display clearly
- [ ] AI discussion references specific scores
- [ ] Discussion provides actionable insights
- [ ] Saves both scores and discussion

---

## Database Migrations Needed

```sql
-- Add conversation field to polyvagal_patterns
ALTER TABLE polyvagal_patterns
ADD COLUMN IF NOT EXISTS conversation JSONB;

-- Create triggers_glimmers_conversations table (or add to existing)
CREATE TABLE IF NOT EXISTS triggers_glimmers_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  conversation JSONB,
  triggers TEXT[],
  glimmers TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create regulating_resources table
CREATE TABLE IF NOT EXISTS regulating_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  conversation JSONB,
  sensory_resources TEXT[],
  movement_resources TEXT[],
  connection_resources TEXT[],
  creative_resources TEXT[],
  spiritual_resources TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Core beliefs discussion
ALTER TABLE core_beliefs_assessments
ADD COLUMN IF NOT EXISTS discussion_transcript JSONB,
ADD COLUMN IF NOT EXISTS discussion_date TIMESTAMP WITH TIME ZONE;
```

---

## File Structure

```
lib/
  nervousSystemMappingAIService.js ✅ (created)
  triggersGlimmersAIService.js ⏳ (to create)
  regulatingResourcesAIService.js ⏳ (to create)
  coreBeliefsAIService.js ⏳ (to create)

components/
  ConversationalNervousSystemMapping.js ⏳ (to create)
  ConversationalTriggersGlimmers.js ⏳ (to create)
  ConversationalRegulatingResources.js ⏳ (to create)
  CoreBeliefsAssessment.js ⏳ (to create)

database/
  add_conversation_to_polyvagal.sql ⏳ (to create)
  create_triggers_glimmers_mapping.sql ⏳ (to create)
  create_regulating_resources.sql ⏳ (to create)
  update_core_beliefs_discussion.sql ⏳ (to create)
```

---

## Notes for Implementation

- **Reuse patterns** from DailyJournal.js for chat UI
- **Extraction logic** similar across all services
- **Consistent styling** with purple/indigo theme
- **Always save** both conversation and structured data
- **Master context integration** - all features should feed into master context
- **Error handling** - graceful fallbacks if AI unavailable
- **Progress indicators** - show what phase/state they're exploring
- **Completion flows** - clear "done" signals and save confirmations

---

**Next Steps:**
1. Create remaining AI services
2. Create React Native components
3. Create database migrations
4. Test each feature individually
5. Test cross-feature integration
6. Update comprehensive testing guide
7. Build and deploy to TestFlight

---

*This document serves as the implementation roadmap for completing the conversational UX transformation of Psychetelia.*
