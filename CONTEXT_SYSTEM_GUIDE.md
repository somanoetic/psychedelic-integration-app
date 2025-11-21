# Context System Guide

## Overview

The Context System provides **persistent memory** for IFS work and nervous system awareness, allowing the app to build a living map of the user's inner world over time. This enables therapeutic continuity across sessions, pattern recognition, and personalized AI guidance.

---

## Database Tables

### 1. `ifs_parts_inventory`
Stores all IFS parts with full lifecycle tracking.

**Key Fields**:
- **Identity**: `part_name`, `part_role` (manager/firefighter/exile), `discovery_date`
- **Discovery Phase**: All 6 F's data (location, appearance, feelings, wants, fears, strategy)
- **Relationships**: `protects_which_exile`, `is_exile`, `protected_by_parts`
- **Exile Phase**: `original_wound_description`, `burdens_carried`
- **Unburdening Phase**: `unburdening_method`, `burdens_released`, `new_qualities`
- **Progress**: `work_phase` (discovery/accessing/unburdening/integrated), `sessions_count`

**File**: `database/create_ifs_parts_inventory_enhanced.sql`

### 2. `ifs_session_history`
Tracks every IFS session for continuity.

**Key Fields**:
- **Session Info**: `session_type` (discovery/check_in/exile_access/unburdening)
- **Content**: `starting_question`, `conversation_summary`, `key_insights`
- **Permissions**: `protector_permissions` (which protectors gave permission)
- **State**: `nervous_system_state_start/end`
- **Outcomes**: `session_outcome`, `next_steps`, `follow_up_needed`

**File**: `database/create_ifs_session_history.sql`

### 3. `polyvagal_patterns`
Accumulated nervous system patterns over time.

**Key Fields**:
- **State Patterns**: `ventral_patterns`, `sympathetic_patterns`, `dorsal_patterns` (each with situations, body sensations, thoughts, behaviors)
- **Triggers/Glimmers**: `most_common_triggers`, `most_reliable_glimmers`
- **Resources**: `individual_resources`, `interactive_resources`
- **Meta**: `personal_state_language`, `early_warning_signs`, `successful_interventions`
- **Capacity**: `regulation_capacity`, `awareness_level`
- **Counts**: `mapping_sessions_count`, `triggers_sessions_count`, `resources_sessions_count`

**File**: `database/create_polyvagal_patterns.sql`

### 4. `nervous_system_context`
High-level awareness tracking.

**Key Fields**:
- **Understanding**: `understands_three_states`, `can_identify_current_state`
- **Knowledge**: `knows_their_triggers`, `knows_their_glimmers`
- **Resources**: `has_individual_resources`, `has_interactive_resources`
- **Capacity**: `regulation_capacity`, `awareness_level`
- **Integration**: `can_stay_present_in_dysregulation`, `has_compassion_for_states`

**File**: `database/create_nervous_system_context.sql`

---

## Context Services

### `ifsContextService.js`

**Purpose**: Manage IFS parts inventory and session history.

**Key Methods**:

```javascript
// Load all parts for a user
await ifsContextService.loadUserParts(userId);
// Returns: { allParts, protectors, exiles, unburdenedExiles, recentParts }

// Find part by description
await ifsContextService.findPartByDescription(userId, "angry part");

// Save newly discovered part
await ifsContextService.savePart(userId, partData);

// Update existing part
await ifsContextService.updatePart(partId, updates);

// Mark exile as accessed
await ifsContextService.markExileAccessed(partId, accessData);

// Mark exile as unburdened
await ifsContextService.markExileUnburdened(partId, unburdeningData);

// Link protector to exile
await ifsContextService.linkProtectorToExile(protectorId, exileId);

// Save session
await ifsContextService.saveSession(userId, sessionData);

// Get session history for a part
await ifsContextService.getPartSessions(partId);

// Get exiles ready for work
await ifsContextService.getExilesReadyForWork(userId);
```

**File**: `lib/ifsContextService.js`

### `polyvagalContextService.js`

**Purpose**: Manage nervous system patterns over time.

**Key Methods**:

```javascript
// Load user's accumulated patterns
await polyvagalContextService.loadUserPatterns(userId);

// Update patterns after mapping session
await polyvagalContextService.updatePatternsFromMapping(userId, mappingData);

// Update triggers and glimmers
await polyvagalContextService.updateTriggersAndGlimmers(userId, triggersData);

// Update regulation resources
await polyvagalContextService.updateRegulatingResources(userId, resourcesData);

// Get nervous system context
await polyvagalContextService.getNervousSystemContext(userId);

// Get patterns formatted for AI
await polyvagalContextService.getPatternsForAI(userId);
```

**File**: `lib/polyvagalContextService.js`

---

## Universal IFS Session Flow

**Every IFS session should start the same way**:

```
┌─────────────────────────────────────────┐
│  "What part is showing up right now?"   │
│  (Always start with present moment)      │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  Search known parts by description       │
│  "Is this a part you know?"              │
└───────────┬────────────┬────────────────┘
            │            │
       NEW PART      KNOWN PART
            │            │
            ▼            ▼
    ┌──────────┐   ┌──────────┐
    │Discovery │   │Check-in  │
    │(6 F's)   │   │"What's it│
    │          │   │doing now?"│
    └────┬─────┘   └────┬─────┘
         │              │
         └──────┬───────┘
                │
                ▼
┌─────────────────────────────────────────┐
│   "What would you like to do with       │
│    this part today?"                    │
│                                          │
│   a) Continue discovering it            │
│   b) Ask if it's protecting an exile    │
│   c) Work with the exile (if ready)     │
│   d) Just be with it                    │
└─────────────────────────────────────────┘
```

**Key Points**:
- Discovery is **iterative** - users return to it often
- Can work with same part multiple times
- Exile work only when protectors give permission
- Context maintained across all sessions

---

## Integration with AI Services

### Enhanced IFS AI Service (Future)

The IFS AI service will be enhanced to:

1. **Load context at start**:
```javascript
await ifsAIService.loadUserContext(userId);
```

2. **Use context in system prompt**:
```javascript
getSystemPrompt() {
  let contextInfo = '';

  if (this.userContext?.knownParts.length > 0) {
    contextInfo = `\n\nUSER'S KNOWN PARTS:\n`;
    contextInfo += this.userContext.recentParts
      .map(p => `- ${p.part_name} (${p.part_role}): ${p.protective_strategy}`)
      .join('\n');
  }

  return basePrompt + contextInfo;
}
```

3. **Recognize connections**:
- "This sounds like the [PartName] you worked with before"
- "This protector might be protecting [ExileName]"

4. **Save after session**:
```javascript
await ifsContextService.savePart(userId, partData);
await ifsContextService.saveSession(userId, sessionData);
```

### Enhanced Polyvagal AI Service (Future)

1. **Load patterns at start**:
```javascript
await polyvagalAIService.loadUserPatterns(userId);
```

2. **Recognize familiar patterns**:
- "I notice this is similar to what you shared before about [trigger]"
- "This sounds like your [state] state that you described as..."

3. **Update after session**:
```javascript
await polyvagalContextService.updatePatternsFromMapping(userId, responses);
```

---

## Deployment

### Step 1: Run Database Migration

In Supabase SQL Editor, run:
```sql
-- Copy entire contents of:
database/migrate_context_system.sql
```

This creates all 4 tables with RLS policies.

### Step 2: Verify Tables

Check that tables exist:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('ifs_parts_inventory', 'ifs_session_history', 'polyvagal_patterns', 'nervous_system_context');
```

### Step 3: Test Services

```javascript
import ifsContextService from './lib/ifsContextService';
import polyvagalContextService from './lib/polyvagalContextService';

// Test IFS context
const parts = await ifsContextService.loadUserParts(userId);
console.log('User has', parts.allParts.length, 'parts');

// Test polyvagal context
const patterns = await polyvagalContextService.loadUserPatterns(userId);
console.log('Mapping sessions:', patterns.mapping_sessions_count);
```

---

## Next Steps

### Immediate (Required for IFS Session Flow)

1. **Update IFS Discovery Widget**:
   - Add "What part is coming up?" as first question
   - Check if part exists in database
   - If exists: Load context and start check-in
   - If new: Begin discovery
   - Save part at end
   - Detect exile indicators and offer exile work

2. **Create IFS Exile Work Widget**:
   - Phase 2: Accessing exiles (with protector permission)
   - Phase 3: Unburdening ceremony
   - Save exile data to context

3. **Create Parts Inventory Screen**:
   - View all parts
   - See part status (discovery/accessing/unburdening/integrated)
   - Continue work with any part
   - View session history

### Future Enhancements

4. **Update Polyvagal Widgets**:
   - Load existing patterns at start
   - Show "you've mentioned this before" recognition
   - Update patterns after completion

5. **Create Context Viewers**:
   - Nervous System Dashboard (visual map of patterns)
   - IFS System Map (protectors → exiles diagram)
   - Progress Tracking (capacity growth over time)

6. **Add Follow-up Prompts**:
   - "You worked with [Part] 3 days ago - want to check in?"
   - "You identified [trigger] last week - noticed it again?"

---

## Technical Notes

### Supabase Client

All services use:
```javascript
import { supabase } from './supabaseClient';
```

Ensure supabaseClient.js exists and is properly configured.

### Row Level Security

All tables have RLS enabled. Users can only:
- View their own data
- Insert their own data
- Update their own data
- Delete their own data

### JSONB Fields

Several fields use JSONB for flexible data storage:
- `burdens_carried`: Array of burden strings
- `new_qualities`: Array of quality strings
- `protector_permissions`: Array of permission objects
- State patterns: Objects with arrays

Query JSONB:
```sql
-- Find parts with specific burden
SELECT * FROM ifs_parts_inventory
WHERE burdens_carried @> '["shame"]'::jsonb;

-- Find parts with "overwhelm" in protective strategy
SELECT * FROM ifs_parts_inventory
WHERE protective_strategy ILIKE '%overwhelm%';
```

---

## Summary

The Context System provides:

✅ **Persistent Memory**: All parts and patterns saved across sessions
✅ **Therapeutic Continuity**: AI recognizes previous work
✅ **Pattern Recognition**: Accumulated understanding of user's unique expression
✅ **Progress Tracking**: See growth in awareness and regulation capacity
✅ **Iterative Discovery**: Return to parts work as often as needed
✅ **Relationship Mapping**: Track which protectors protect which exiles
✅ **Session History**: Complete record of therapeutic journey

This creates a **living therapeutic companion** that grows with the user.

---

**Files Created**:
- `database/create_ifs_parts_inventory_enhanced.sql`
- `database/create_ifs_session_history.sql`
- `database/create_polyvagal_patterns.sql`
- `database/create_nervous_system_context.sql`
- `database/migrate_context_system.sql` (combined migration)
- `lib/ifsContextService.js`
- `lib/polyvagalContextService.js`

**Next**: Implement widgets that use this context system.
