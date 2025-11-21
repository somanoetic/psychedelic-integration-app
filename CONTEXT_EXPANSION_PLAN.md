# Context System Expansion Plan

## Current Status

✅ **Phase 1 Complete: Foundation Built**
- IFS Parts Inventory context system (with automatic protector-exile linking)
- Polyvagal patterns context system
- Context services (ifsContextService, polyvagalContextService)
- Database tables created
- IFS Chat integrated with EducationScreen

🎯 **Phase 2: Cross-Component Integration**
- Enable AI to draw connections across different therapeutic modalities
- Use IFS/nervous system work as context for integration journals
- Incorporate assessment data (beliefs inventory, etc.) into AI guidance

---

## Vision: Unified Therapeutic Context

### The Goal
Create a system where ALL therapeutic work informs ALL other therapeutic work. When a user talks about their session experience, the AI can reference:
- Their known IFS parts
- Their nervous system patterns
- Their core beliefs from assessments
- Their baseline progress
- Their glimmer practices

**Example:**
```
User in Post-Session Journal: "I kept seeing images of being small and powerless"

AI Response: "I notice you're describing feelings of being small - this reminds me of
the **Wounded Child** exile we've worked with in IFS. That part carries beliefs about
powerlessness.

I also see from your Core Beliefs Inventory that you rated 'I am helpless' as
strongly held. This session seems to have brought you into contact with that
vulnerable place.

What did it feel like to be with that part during the journey?"
```

### Key Principles
1. **Context flows bidirectionally** - IFS informs integration journals, journals inform IFS work
2. **Assessments become living data** - Not static, referenced throughout therapy
3. **Patterns recognized across modalities** - Nervous system state during parts work noted
4. **AI as integrative therapist** - Draws connections user might miss

---

## Components Needing Context Systems

### CRITICAL PRIORITY (Implement Next)

These components involve core therapeutic work that users return to repeatedly and build upon over time.

#### 1. **Post-Session Integration Journal**
**File**: `components/PostSessionIntegrationJournal.js`
**Database**: `post_session_journals` (already exists)

**Why Critical**:
- Tracks 12+ sensory/emotional categories after each session
- Users return after multiple sessions
- Shows integration patterns over time
- Core therapeutic data

**Context Needs**:
- Previous session patterns
- Recurring themes (visuals, emotions, realizations)
- Integration progress across sessions
- Which domains show most change

**Proposed Table** (already exists, may need enhancement):
```sql
post_session_journals (
  user_id, session_date, session_number,
  visuals, movements, somatic_sensations, emotions,
  relationships, nature_elements, textures, colors,
  shapes, darkness_void, realizations, integration_notes
)
```

**Context Service Needed**: `postSessionContextService.js`
- Load previous sessions
- Identify recurring themes
- Track integration patterns
- Compare current to previous sessions

---

#### 2. **Daily Glimmers Practice**
**File**: `components/DailyGlimmersPractice.js`
**Database**: `daily_glimmers` (already exists)

**Why Critical**:
- Daily/multiple times daily practice
- 24-72 hour integration window
- Nervous system rewiring through repetition
- Builds safety capacity

**Context Needs**:
- User's accumulated glimmers
- Which glimmers are most meaningful
- Patterns: time of day, location, circumstances
- Frequency of practice

**Proposed Table** (already exists):
```sql
daily_glimmers (
  user_id, glimmer_date, glimmer_text,
  category, location, time_of_day, mood_before, mood_after
)
```

**Context Service Needed**: `glimmersContextService.js`
- Load user's glimmer history
- Identify favorite glimmers
- Track patterns (what helps most)
- Show progress over integration window

---

#### 3. **Pre-Treatment Baseline Log**
**File**: `components/PreTreatmentBaselineLog.js`
**Database**: `baseline_logs` (already exists)

**Why Critical**:
- Tracks progress across 8 life domains
- Before each session comparison
- Shows therapeutic effectiveness
- Objective progress measurement

**Context Needs**:
- Previous baseline scores
- Trends over time (improving/declining domains)
- Which areas change most after sessions
- Comparison to first baseline

**Proposed Table** (already exists):
```sql
baseline_logs (
  user_id, log_date, session_number,
  sleep_quality, energy_level, mood, relationships,
  work_productivity, self_care, symptoms, overall_wellbeing,
  notes
)
```

**Context Service Needed**: `baselineContextService.js`
- Load baseline history
- Calculate trends
- Compare to previous sessions
- Generate progress insights

---

#### 4. **Intention Setting**
**File**: `components/IntentionSetting.js`
**Database**: `session_intentions` (already exists)

**Why Critical**:
- Sets frame for each session
- Shows evolution of therapeutic focus
- Tracks growth from goals → intentions
- Pre-session preparation

**Context Needs**:
- Previous intentions
- Recurring themes in intentions
- Evolution from goals to openness
- Which intentions were most helpful

**Proposed Table** (already exists):
```sql
session_intentions (
  user_id, session_date, session_number,
  goals, intentions, openness_reflection,
  surrender_statement, created_at
)
```

**Context Service Needed**: `intentionsContextService.js`
- Load previous intentions
- Identify recurring themes
- Show evolution of intentions
- Suggest building on previous work

---

#### 5. **Therapeutic Integration Screen** (AI)
**File**: `screens/TherapeuticIntegrationScreen.js`

**Why Critical**:
- AI-guided integration conversations
- Multiple sessions over time
- Nervous system state tracking
- Core therapeutic process

**Context Needs**:
- Full conversation history
- Previous insights
- Nervous system patterns
- Intervention effectiveness
- Therapeutic progress

**Proposed Table**: `therapeutic_integration_sessions`
```sql
CREATE TABLE therapeutic_integration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_number INTEGER,

  -- Session Content
  conversation_transcript JSONB, -- Full AI conversation
  key_insights TEXT[],
  practices_completed TEXT[],

  -- Nervous System Tracking
  ns_state_start TEXT, -- ventral/sympathetic/dorsal
  ns_state_end TEXT,
  regulation_interventions TEXT[],

  -- Progress
  session_duration_minutes INTEGER,
  session_outcome TEXT,
  follow_up_needed BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Context Service Needed**: `therapeuticIntegrationContextService.js`

---

#### 6. **Experience Mapping Screen** (AI)
**File**: `screens/ExperienceMappingScreen.js`

**Why Critical**:
- AI-guided experience processing
- After each psychedelic session
- Progressive integration over time
- Connects experiences across sessions

**Context Needs**:
- Previous session experiences
- Recurring themes/symbols
- Integration progress
- User's unique associations

**Proposed Table**: `experience_mapping_sessions`
```sql
CREATE TABLE experience_mapping_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  psychedelic_session_date DATE,
  mapping_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Experience Data
  associations JSONB, -- Array of associations
  dynamics JSONB, -- Relational dynamics
  integrations JSONB, -- Integration insights
  ritual_data JSONB, -- Ritual elements

  -- Conversation
  conversation_transcript JSONB,
  key_insights TEXT[],

  -- Progress
  processing_phase TEXT, -- 'initial', 'deep', 'integrated'
  follow_up_date DATE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Context Service Needed**: `experienceMappingContextService.js`

---

### HIGH PRIORITY (Phase 2)

#### 7. **Conversational Journal Entry**
**File**: `components/ConversationalJournalEntry.js`

**Why High Priority**:
- Daily/frequent journaling
- Shows emotional journey
- Recurring themes emerge
- Integration work

**Proposed Table**: `journal_entries`
```sql
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  entry_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  entry_type TEXT, -- 'prompted', 'free_write'
  prompt_id TEXT, -- 'feelings', 'gratitude', 'insights', etc.
  entry_text TEXT,

  -- Metadata
  mood_before TEXT,
  mood_after TEXT,
  nervous_system_state TEXT,
  tags TEXT[],

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Context Service Needed**: `journalContextService.js`

---

#### 8. **IFS Parts Inventory Widget**
**File**: `components/IFSPartsInventory.js`

**Current**: Basic identification
**Enhancement**: Link to main IFS context system

**Integration Needed**:
- Use existing `ifs_parts_inventory` table
- Connect to `ifsContextService`
- Show evolution of parts over time
- Track which parts are most active

---

### MEDIUM PRIORITY (Phase 3)

#### 9-14. Other Components
Less critical but would benefit from tracking:
- IFS Parts Education progress
- Grounding exercise preferences
- Exercise library favorites
- Polyvagal education completion

---

---

## PHASE 2: Cross-Component Integration (NEW - HIGH PRIORITY)

### Core Concept: Unified Therapeutic Context

**Goal:** Enable AI to draw connections across all therapeutic modalities by giving it access to user's complete therapeutic history.

### New Feature Requirements

#### 1. **Universal Context Service**
**File**: `lib/universalContextService.js`

**Purpose:** Single entry point to fetch ALL user context for AI interactions

**API:**
```javascript
async loadUserTherapeuticContext(userId) {
  return {
    // IFS Work
    ifsParts: {
      allParts: [...],
      activeExiles: [...],
      protectorSystem: [...],
      recentSessions: [...]
    },

    // Nervous System
    nervousSystem: {
      patterns: {...},
      triggers: [...],
      glimmers: [...],
      resources: [...]
    },

    // Assessments
    assessments: {
      coreBeliefs: [...],
      baselineScores: {...},
      trends: {...}
    },

    // Integration Work
    integration: {
      recentJournals: [...],
      intentions: [...],
      sessionExperiences: [...]
    }
  }
}
```

#### 2. **Context-Aware AI Services**

Update ALL AI services to accept and use universal context:

**Files to Update:**
- `lib/ifsAIService.js` - Add nervous system + beliefs context
- `lib/polyvagalAIService.js` - Add IFS parts context
- `components/PostSessionIntegrationJournal.js` - Add IFS + beliefs context
- `components/ConversationalJournalEntry.js` - Add all context
- `screens/TherapeuticIntegrationScreen.js` - Add all context

**Pattern:**
```javascript
// Before
const aiResponse = await ifsService.sendMessage(userMessage, phase);

// After
const context = await universalContextService.loadUserTherapeuticContext(userId);
const aiResponse = await ifsService.sendMessageWithContext(userMessage, phase, context);
```

#### 3. **Enhanced System Prompts**

Each AI service gets enhanced prompt with relevant context:

**Example: Post-Session Integration Journal**
```javascript
getSystemPrompt(context) {
  let prompt = `You are guiding post-session integration...`;

  // Add IFS context
  if (context.ifsParts?.allParts.length > 0) {
    prompt += `\n\nKNOWN PARTS: The user has worked with these parts:
    ${context.ifsParts.allParts.map(p => `- ${p.part_name} (${p.part_role}): ${p.protective_strategy}`).join('\n')}

    If the user describes experiences that relate to these parts, make the connection gently.`;
  }

  // Add beliefs context
  if (context.assessments?.coreBeliefs.length > 0) {
    const strongBeliefs = context.assessments.coreBeliefs.filter(b => b.strength >= 4);
    prompt += `\n\nCORE BELIEFS: The user strongly holds these beliefs:
    ${strongBeliefs.map(b => `- "${b.belief}" (rated ${b.strength}/5)`).join('\n')}

    If session content relates to these beliefs, note the connection.`;
  }

  // Add nervous system context
  if (context.nervousSystem?.patterns) {
    prompt += `\n\nNERVOUS SYSTEM: Common patterns:
    - Triggers: ${context.nervousSystem.triggers.slice(0, 3).join(', ')}
    - Glimmers: ${context.nervousSystem.glimmers.slice(0, 3).join(', ')}

    Note if session experiences relate to these patterns.`;
  }

  return prompt;
}
```

#### 4. **Conversational Connections**

AI should actively draw connections:

**Example Responses:**

**During Post-Session Journal:**
```
User: "I kept feeling this crushing pressure to be perfect during the journey"

AI: "That crushing pressure to be perfect - I recognize that from your IFS work.
That sounds like **The Perfectionist**, the manager part you've been getting to know.

I also notice from your Core Beliefs Inventory that you strongly hold the belief
'I must be perfect to be worthy' (you rated it 5/5).

This journey seems to have brought you into direct contact with both that part
and that belief. What was it like to experience that pressure in this expanded state?"
```

**During IFS Work:**
```
User: "This anxious part is terrified of being rejected"

AI: "That fear of rejection makes so much sense. Looking at your recent integration
journals, you've described several experiences of feeling 'alone' and 'outside'
during your last session.

Your nervous system patterns also show that social situations are a major trigger,
often pushing you into sympathetic activation.

This anxious part seems to be working really hard to prevent that painful rejection
feeling. What does it need you to know about why it's so vigilant?"
```

**During Journal Entry:**
```
User: "I'm feeling really overwhelmed today"

AI: "I'm sorry you're feeling overwhelmed. Let me check in with what might be
contributing...

I notice you completed your baseline log yesterday and rated your stress level
as 8/10 - significantly higher than your previous 5/10.

Also, in your IFS work this week, **The Overwhelmed Manager** was very active,
trying to control multiple things at once.

Would it help to do a quick grounding practice, or would you rather explore what's
happening with that manager part?"
```

### Implementation Tasks

#### Task 1: Create Universal Context Service
- [ ] Create `lib/universalContextService.js`
- [ ] Implement `loadUserTherapeuticContext(userId)`
- [ ] Add caching for performance
- [ ] Write tests

#### Task 2: Create Assessments Context Service
- [ ] Create `lib/assessmentsContextService.js`
- [ ] Load Core Beliefs Inventory data
- [ ] Load other assessments (when built)
- [ ] Track assessment completion and scores

#### Task 3: Create Core Beliefs Inventory Table
```sql
CREATE TABLE core_beliefs_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Beliefs with ratings
  beliefs JSONB, -- Array: [{belief: "I am unworthy", strength: 5, category: "self"}]

  -- Summary
  strongest_beliefs TEXT[],
  belief_categories JSONB, -- {self: 4.5, others: 3.2, world: 4.0}

  -- Progress
  previous_assessment_id UUID REFERENCES core_beliefs_inventory(id),
  changes_noted JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Task 4: Update All AI Services
- [ ] Update `ifsAIService.js` to accept context
- [ ] Update `polyvagalAIService.js` to accept context
- [ ] Update `triggersGlimmersAIService.js` to accept context
- [ ] Update `regulatingResourcesAIService.js` to accept context
- [ ] Create new context-aware services for journals/integration

#### Task 5: Update Components
- [ ] `PostSessionIntegrationJournal.js` - Load and use context
- [ ] `ConversationalJournalEntry.js` - Load and use context
- [ ] `TherapeuticIntegrationScreen.js` - Load and use context
- [ ] `DailyGlimmersPractice.js` - Load previous glimmers
- [ ] `IntentionSetting.js` - Load previous intentions

#### Task 6: Testing
- [ ] Test IFS → Journal connection
- [ ] Test Beliefs → IFS connection
- [ ] Test Nervous System → All components
- [ ] Test cross-session pattern recognition
- [ ] Performance testing with large context

---

## Recommended Implementation Order (UPDATED)

### ✅ Completed (Phase 1)
1. ✅ **IFS Context System** - Full lifecycle tracking with auto-linking
2. ✅ **Polyvagal Context System** - Pattern accumulation
3. ✅ **IFS Chat Integration** - Context-aware with duplicate detection

### 🎯 Phase 2: Cross-Component Integration (HIGH PRIORITY - NEXT)
1. **Universal Context Service** (Week 1)
   - Create central context aggregator
   - Build caching layer
   - Test with existing services

2. **Core Beliefs Inventory Table + Service** (Week 1-2)
   - Create database table
   - Build assessmentsContextService
   - Implement beliefs loading

3. **Update AI Services with Context** (Week 2-3)
   - Add context parameters to all AI services
   - Enhance system prompts
   - Test connection-making

4. **Update Key Components** (Week 3-4)
   - Post-Session Journal with full context
   - Conversational Journal with full context
   - Therapeutic Integration with full context

### 🔄 Phase 3: Individual Component Context (ONGOING)
4. **Create IFS Exile Work Widget**

### Near-Term (Week 3-4)
5. **Post-Session Journal Context** - Most critical new system
6. **Daily Glimmers Context** - High frequency, integration window
7. **Baseline Log Context** - Progress measurement

### Medium-Term (Month 2)
8. **Therapeutic Integration Context** - AI conversation history
9. **Experience Mapping Context** - Session processing
10. **Intention Setting Context** - Pre-session preparation

### Long-Term (Month 3+)
11. **Journal Entry Context** - Daily practice tracking
12. **Exercise/Practice Preferences** - User favorites
13. **Cross-System Integration** - Link all contexts together

---

## Cross-System Context Integration

Eventually, all context systems should connect to provide:

### Unified User Profile
```javascript
{
  // IFS System
  parts: { managers: [], firefighters: [], exiles: [] },
  partsProgress: { discovered: 12, unburdened: 3, integrated: 2 },

  // Nervous System
  regulation_capacity: 'moderate',
  known_triggers: [...],
  known_glimmers: [...],
  regulation_resources: { individual: [...], interactive: [...] },

  // Integration Work
  sessions_completed: 5,
  baseline_trends: { mood: 'improving', sleep: 'stable', ... },
  recurring_insights: [...],

  // Daily Practice
  glimmers_this_week: 12,
  journal_entries_this_month: 15,
  practice_streak: 7,

  // Overall Progress
  therapeutic_capacity: 'developing',
  awareness_level: 'practiced',
  integration_progress: 'ongoing'
}
```

### AI Context Enhancement
All AI services (IFS, polyvagal, therapeutic integration, experience mapping) can access:
- User's complete therapeutic history
- Known parts, triggers, glimmers
- Previous insights and patterns
- What interventions work best
- Current capacity and needs

---

## Database Design Patterns

### Common Fields (All Context Tables)
```sql
-- Identity
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

-- Temporal
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

-- RLS
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access own data" ON [table_name]
  FOR ALL USING (auth.uid() = user_id);
```

### JSONB for Flexibility
Use JSONB for:
- Arrays of data that may grow
- Semi-structured data
- Data that may evolve
- Complex nested structures

Example:
```sql
-- Instead of fixed columns
conversation_transcript JSONB DEFAULT '[]'::jsonb

-- Allows flexible structure
[
  { role: 'user', content: '...', timestamp: '...' },
  { role: 'assistant', content: '...', timestamp: '...' }
]
```

---

## Service Architecture Pattern

All context services should follow this pattern:

```javascript
class [Feature]ContextService {
  // Load user's data
  async loadUserData(userId) { }

  // Save new entry
  async saveEntry(userId, data) { }

  // Update existing entry
  async updateEntry(entryId, updates) { }

  // Get patterns/insights
  async getPatterns(userId) { }

  // Get formatted for AI
  async getDataForAI(userId) { }

  // Get progress metrics
  async getProgress(userId) { }
}
```

---

## Benefits of Complete Context System

### For Users:
1. **See Progress**: Visual tracking of therapeutic growth
2. **Pattern Recognition**: "I notice this happens when..."
3. **Personalization**: App learns what works for them
4. **Continuity**: Pick up where they left off
5. **Motivation**: See accumulation of work

### For AI:
1. **Contextual Responses**: "Similar to what you shared before..."
2. **Pattern Identification**: "This is the third time..."
3. **Personalized Guidance**: Adapts to user's style
4. **Deeper Insights**: Connections across time
5. **Appropriate Pacing**: Knows user's capacity

### For Therapeutic Work:
1. **Non-Linear Process**: Can return to any part/practice
2. **Integration Over Time**: Shows 24-72 hour window
3. **Baseline Tracking**: Objective progress measurement
4. **Theme Emergence**: Patterns become clear over time
5. **Holistic View**: See whole system evolving

---

## Next Steps

1. **Run Database Migrations** (when ready):
   - `migrate_context_system.sql` (IFS & Polyvagal)
   - Create new migrations for other components

2. **Implement Critical Services**:
   - `postSessionContextService.js`
   - `glimmersContextService.js`
   - `baselineContextService.js`
   - `intentionsContextService.js`

3. **Update Widgets to Use Context**:
   - Load previous data at start
   - Save new data at completion
   - Show progress/patterns to user

4. **Create Context Viewers**:
   - Integration Dashboard (shows all contexts)
   - Progress Tracker (trends over time)
   - Pattern Viewer (insights from data)

---

## Summary

**Currently Have Context**:
- ✅ IFS Parts Inventory
- ✅ Polyvagal Patterns

**Should Add Context (Priority Order)**:
1. 🔴 Post-Session Integration Journal
2. 🔴 Daily Glimmers Practice
3. 🔴 Pre-Treatment Baseline Log
4. 🔴 Therapeutic Integration Screen (AI)
5. 🔴 Experience Mapping Screen (AI)
6. 🟡 Intention Setting
7. 🟡 Conversational Journal Entry
8. 🟢 Exercise/Practice preferences

**Result**: A truly intelligent therapeutic companion that grows with the user, recognizes patterns, and provides personalized support based on their unique therapeutic journey.
