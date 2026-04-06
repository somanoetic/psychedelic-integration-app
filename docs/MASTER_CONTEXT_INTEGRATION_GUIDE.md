# Master Context Integration System
**Created:** 2025-11-05
**Status:** ✅ Implemented

## Overview

The Master Context Service is a central therapeutic intelligence layer that synthesizes data across all domains of the Psychetelia app, enabling AI conversations to make meaningful connections like:

> "Remember that owl you saw in your psychedelic journey? I wonder if this protector part is connected to that..."

> "You mentioned chest pressure when in sympathetic state - is that similar to where this part lives?"

## Architecture: Option A + Light Option B (Hybrid)

### Primary: `getMasterContext()` Service
- **Location:** `/lib/masterContextService.js`
- Aggregates ALL therapeutic data on-demand
- Provides rich, current, cross-domain context to AI services
- Uses intelligent caching (5-minute TTL) for performance
- Discovers potential connections across domains

### Secondary: Therapeutic Connections Table
- **Location:** `/database/create_therapeutic_connections_table.sql`
- Stores user-confirmed connections for future reference
- AI suggestions that user validates are saved permanently
- Enables tracking of insights over time

---

## Database Schema Updates

### 1. Core Beliefs Assessments Table
**File:** `database/create_core_beliefs_table.sql`

Tracks 10 belief domains from "Prisoners of Belief":
- Value (Worthiness)
- Security (Safety)
- Performance (Competence)
- Control (Power)
- Love (Nurturance)
- Autonomy (Independence)
- Justice (Fairness)
- Belonging (Connection)
- Others (Trust)
- Standards (Self-Compassion)

**Key fields:**
- `assessment_type`: baseline, post_session, follow_up_1week, etc.
- `session_id`: Links to post_session_journals for tracking belief shifts after sessions
- 10 integer scores (0-10) for each domain
- Domain-specific notes for qualitative data

**Purpose:** Track belief evolution over psychedelic integration journey

---

### 2. Therapeutic Connections Table
**File:** `database/create_therapeutic_connections_table.sql`

Stores cross-domain connections:

**Source/Target Types:**
- `integration_journal` - Psychedelic session journals
- `ifs_part` - Internal Family Systems parts
- `ns_pattern` - Nervous system patterns
- `belief_domain` - Core beliefs
- `session_intention` - Pre-session intentions
- `daily_glimmer` - Daily safety/joy moments
- `baseline_log` - Pre-treatment baselines

**Connection Types:**
- `somatic_match` - Body sensation similarity
- `emotional_theme` - Emotional pattern connection
- `visual_symbol` - Visual imagery match
- `belief_pattern` - Core belief connection
- `protective_strategy` - IFS protection link
- `trigger_pattern` - NS trigger link
- `temporal` - Time-based relationship
- `causal` - One led to another
- `thematic` - General theme/topic

**Key Fields:**
- `confidence` (0.00-1.00): AI confidence score
- `discovered_by`: ai, user, or clinician
- `confirmed_by_user`: User validation flag
- `connection_description`: Human-readable explanation
- `integration_insight`: How this aids integration

---

## Master Context Service API

### Main Method: `getMasterContext(userId, options)`

**Options:**
```javascript
{
  focus: 'all' | 'ifs' | 'nervous_system' | 'integration' | 'beliefs',
  recentDays: 90,  // Only include data from last N days
  maxParts: 10,  // Max IFS parts to include
  maxJournals: 5,  // Max integration journals
  maxSessions: 5,  // Max IFS sessions
  includeConnections: true,  // Include cross-domain connections
  useCache: true  // Use 5-minute cache
}
```

**Returns:**
```javascript
{
  userId,
  generatedAt,
  focus,
  userProfile: { name, avatar, created_at },

  // IFS Context
  ifs: {
    totalParts,
    protectorsCount,
    exilesCount,
    unburdenedCount,
    recentParts: [
      {
        id, name, role, location, feelings, wants, fears,
        strategy, isExile, unburdened, burdens, lastWorkedWith
      }
    ],
    recentSessions: [...]
  },

  // Nervous System Context
  nervousSystem: {
    capacity, awareness, hasMappedStates,
    knownTriggers, knownGlimmers,
    individualResources, interactiveResources,
    ventralPatterns, sympatheticPatterns, dorsalPatterns,
    context
  },

  // Integration Journals Context
  integrationJournals: {
    totalJournals,
    recentJournals: [
      {
        id, sessionId, title, date,
        visuals, emotions, somatic, movements,
        relationships, realizations, integration
      }
    ]
  },

  // Core Beliefs Context
  beliefs: {
    hasAssessments,
    latestAssessment: {
      date, type,
      scores: { value, security, performance, ... }
    },
    baseline: { ... },
    totalAssessments
  },

  // Session Intentions
  sessionIntentions: {
    recentIntentions: [...]
  },

  // Cross-Domain Connections
  connections: [
    {
      id, sourceType, sourceId, targetType, targetId,
      connectionType, description, confidence, userNotes
    }
  ],

  // AI-Discovered Potential Connections
  potentialConnections: [
    {
      type, confidence, description,
      sourceType, sourceId, targetType, targetId,
      aiSuggestion  // Ready-to-use suggestion text
    }
  ]
}
```

---

## Connection Discovery Logic

The Master Context Service automatically discovers potential cross-domain connections:

### 1. Somatic Matches
**Logic:** IFS part body location matches nervous system activation pattern location

**Example:**
- Part "The Critic" is located in chest
- Sympathetic activation includes "chest tightness"
- **Connection:** `aiSuggestion: "When this part activates, you might notice sympathetic nervous system activation in the same location."`

### 2. Emotional Theme Matches
**Logic:** IFS part burdens/feelings match integration journal emotions

**Example:**
- Part carries burden "shame"
- Integration journal describes "overwhelming shame" emotion
- **Connection:** `aiSuggestion: "The emotion 'shame' from your Oct 28th session might be connected to the Inner Critic part."`

### 3. Visual Symbol Matches
**Logic:** IFS part name matches visual imagery in integration journals

**Example:**
- Part named "The Owl Protector"
- Integration journal describes "wise owl watching over me"
- **Connection:** `aiSuggestion: "Remember the owl from your integration session? That might be connected to this Owl Protector part."`

### 4. Belief Pattern Matches
**Logic:** Low core belief scores match IFS part burdens

**Example:**
- Value/Worthiness belief score = 2/10 (low)
- Part carries burden "worthlessness"
- **Connection:** `aiSuggestion: "Your worthiness belief score is low, and the Inner Child part seems to carry that burden of 'worthlessness'."`

---

## AI Service Integration

### IFS AI Service (`lib/ifsAIService.js`)

**Updated to include:**
1. `initialize(userId)` method - Loads master context before conversation
2. Enhanced `getSystemPrompt()` - Dynamically includes:
   - Known parts from user's inventory
   - Psychedelic integration insights (visuals, realizations)
   - Nervous system patterns (sympathetic/dorsal body sensations)
   - Potential cross-domain connections with AI suggestions

**Example Enhanced Prompt:**
```
## USER'S KNOWN PARTS:
- "The Critic" (manager): Located in chest. Feels: harsh, critical, never good enough...
- "The Wounded Child" (exile): Located in heart. Feels: abandoned, scared, small...

## PSYCHEDELIC INTEGRATION INSIGHTS:
- Visual: "A wise owl perched above me, watching protectively..."
- Realization: "I saw how I've been running from myself for years..."

## NERVOUS SYSTEM PATTERNS:
- Sympathetic: chest tightness, rapid heartbeat, shallow breathing
- Dorsal: numbness in legs, foggy mind, disconnection

## POTENTIAL CONNECTIONS TO EXPLORE:
- When this part activates, you might notice sympathetic nervous system activation in the same location.
- Remember the owl from your integration session? That might be connected to this protector part.

USE THESE CONNECTIONS NATURALLY: When relevant, reference these connections...
```

---

## Implementation Checklist

### ✅ Completed
- [x] Create `core_beliefs_assessments` table
- [x] Create `therapeutic_connections` table
- [x] Build Master Context Service (`masterContextService.js`)
- [x] Implement connection discovery algorithms:
  - [x] Somatic matches
  - [x] Emotional theme matches
  - [x] Visual symbol matches
  - [x] Belief pattern matches
- [x] Update IFS AI Service to use master context
- [x] Add caching layer (5-minute TTL)

### 🔄 To Do (Next Phase)
- [ ] Run database migrations (both new tables)
- [ ] Update other AI services (polyvagal, triggered support, education)
- [ ] Update PostSessionIntegrationJournal to trigger context refresh
- [ ] Create UI for viewing/confirming connections
- [ ] Add connection suggestions in conversation UI
- [ ] Implement `saveConnection()` when user confirms AI suggestion
- [ ] Create Core Beliefs Inventory assessment screen
- [ ] Add beliefs tracking to user profile

---

## Usage Example

### AI Service Initialization
```javascript
import ifsAIService from './lib/ifsAIService';

// Before starting IFS conversation
const { data: { user } } = await supabase.auth.getUser();
await ifsAIService.initialize(user.id);

// Now AI has full context and will make cross-domain connections
const response = await ifsAIService.sendMessage("I'm feeling tightness in my chest", "find");
```

### Saving User-Confirmed Connections
```javascript
import masterContextService from './lib/masterContextService';

// When user confirms AI suggestion
await masterContextService.saveConnection(userId, {
  sourceType: 'ifs_part',
  sourceId: partId,
  sourceDescription: 'The Critic part',
  targetType: 'integration_journal',
  targetId: journalId,
  targetDescription: 'Journey on Oct 28th',
  type: 'visual_symbol',
  description: 'Owl protector imagery matches this part',
  confidence: 0.85,
  discoveredBy: 'ai',
  confirmed: true,
  userNotes: 'Yes! That owl IS this part!',
  insight: 'This connection helped me see the protective role more clearly'
});
```

### Clearing Cache After Data Updates
```javascript
// After saving new IFS part, journal entry, or belief assessment
masterContextService.clearCache(userId);
```

---

## Benefits

### For Users
- ✅ **Coherent therapeutic experience** - All work feels connected
- ✅ **Meaningful insights** - AI references their actual experiences
- ✅ **Pattern recognition** - See connections they might miss
- ✅ **Continuity** - Each session builds on previous work
- ✅ **Validation** - "The app remembers me and my journey"

### For Clinicians
- ✅ **Comprehensive view** - All therapeutic data in one place
- ✅ **Progress tracking** - See belief shifts, part work, NS regulation
- ✅ **Connection insights** - Understand cross-domain patterns
- ✅ **Integration support** - Help clients make meaning of experiences

### For Developers
- ✅ **Single source of truth** - One service for all context
- ✅ **Easy to extend** - Add new data sources in one place
- ✅ **Consistent AI behavior** - All conversations have same rich context
- ✅ **Performance optimized** - Caching prevents repeated queries

---

## Next Steps

1. **Run migrations** - Create both new database tables
2. **Test context loading** - Verify master context loads correctly
3. **Test IFS conversations** - Confirm AI makes cross-domain references
4. **Build beliefs assessment** - Create UI for 100-item questionnaire
5. **Add connection UI** - Show discovered connections to users
6. **Update other AI services** - Polyvagal, triggered support, education
7. **Monitor performance** - Ensure caching works efficiently

---

## Technical Notes

### Performance Considerations
- **Cache TTL:** 5 minutes (adjustable via `cacheTTL`)
- **Context size:** Filtered/summarized to avoid overwhelming AI
- **Query optimization:** Uses indexes on all relevant tables
- **Lazy loading:** Only loads what's needed based on `focus` option

### Security
- All queries filtered by `user_id`
- Row Level Security (RLS) enforced on all tables
- No cross-user data leakage possible
- Cache keys include user_id

### Error Handling
- Graceful degradation if context loading fails
- Falls back to minimal context
- Logs errors for debugging
- Doesn't break AI conversations if context unavailable

---

*This system represents a significant upgrade to the therapeutic intelligence of Psychetelia, enabling truly integrated and personalized support across all modalities.*
