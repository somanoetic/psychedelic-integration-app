# Full-Stack Architecture: FEAT-101 Session Day Checklist

**Feature ID:** FEAT-101
**Architecture Version:** 1.0
**Date:** 2026-02-09
**Status:** Design Complete

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Backend Architecture](#backend-architecture)
3. [Frontend Architecture](#frontend-architecture)
4. [Data Flow](#data-flow)
5. [Security Architecture](#security-architecture)
6. [Error Handling Strategy](#error-handling-strategy)
7. [Risk Assessment](#risk-assessment)
8. [Implementation Checklist](#implementation-checklist)

---

## Architecture Overview

### System Context

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native App                         │
│                                                               │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │   Session    │────────▶│  Checklist   │                 │
│  │   Prep Flow  │         │   Screen     │                 │
│  └──────────────┘         └──────┬───────┘                 │
│                                    │                         │
│                            ┌───────▼────────┐               │
│                            │  Checklist     │               │
│                            │  Service       │               │
│                            └───────┬────────┘               │
└────────────────────────────────────┼────────────────────────┘
                                     │
                          ┌──────────▼───────────┐
                          │   Supabase Client    │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │   Supabase Backend   │
                          │                       │
                          │  ┌────────────────┐  │
                          │  │ PostgreSQL     │  │
                          │  │ - Templates    │  │
                          │  │ - Checklists   │  │
                          │  │ - Items        │  │
                          │  └────────────────┘  │
                          │                       │
                          │  ┌────────────────┐  │
                          │  │ RLS Policies   │  │
                          │  └────────────────┘  │
                          │                       │
                          │  ┌────────────────┐  │
                          │  │ Functions      │  │
                          │  │ - create_...   │  │
                          │  └────────────────┘  │
                          └───────────────────────┘
```

### Design Principles

1. **Simplicity First**: No over-engineering - use existing patterns from the codebase
2. **Offline-First**: AsyncStorage draft state for reliability
3. **Progressive Enhancement**: Start with basic CRUD, add real-time sync later
4. **Data Integrity**: Server-side validation and aggregate management
5. **User Experience**: Optimistic updates with rollback on failure

---

## Backend Architecture

### Service Layer Design

#### File: `lib/sessionChecklistService.js`

**Responsibilities**:
- Abstract Supabase client calls
- Handle error transformation
- Provide clean API for frontend components
- Manage optimistic update coordination

**Key Methods**:

```javascript
/**
 * Get or create checklist for a session
 * @param {string} sessionId - UUID of the session
 * @returns {Promise<Checklist>} - Full checklist with items
 */
async getOrCreateChecklist(sessionId)

/**
 * Get checklist with all items
 * @param {string} checklistId - UUID of the checklist
 * @returns {Promise<ChecklistWithItems>}
 */
async getChecklistWithItems(checklistId)

/**
 * Toggle item completion status
 * @param {string} itemId - UUID of the item
 * @param {boolean} isCompleted - New completion status
 * @returns {Promise<ChecklistItem>}
 */
async toggleItemCompletion(itemId, isCompleted)

/**
 * Add custom item to checklist
 * @param {string} checklistId - UUID of the checklist
 * @param {Object} itemData - { title, description, category }
 * @returns {Promise<ChecklistItem>}
 */
async addCustomItem(checklistId, itemData)

/**
 * Update item details
 * @param {string} itemId - UUID of the item
 * @param {Object} updates - { title?, description?, category? }
 * @returns {Promise<ChecklistItem>}
 */
async updateItem(itemId, updates)

/**
 * Delete item (custom items only)
 * @param {string} itemId - UUID of the item
 * @returns {Promise<void>}
 */
async deleteItem(itemId)
```

### Integration with Existing Database Schema

The database schema from Step 2 (02-database-design.md) includes:
- `checklist_template_items` - 18 default items seeded
- `session_checklists` - One per session with aggregate counters
- `session_checklist_items` - Individual items with custom support
- RLS policies for user ownership
- Triggers for auto-updating aggregates
- `create_session_checklist()` server function

---

## Frontend Architecture

### Component Hierarchy

```
SessionChecklistScreen (Container)
├── ChecklistHeader
│   ├── ProgressBar (completedItems / totalItems)
│   ├── ProgressText ("5 of 18 complete")
│   └── LastUpdatedText
│
├── ChecklistItemsList
│   ├── CategorySection (grouped by category)
│   │   ├── CategoryHeader ("Physical Preparation")
│   │   └── ChecklistItem (repeats)
│   │       ├── Checkbox (pressable)
│   │       ├── ItemContent
│   │       │   ├── Title (bold)
│   │       │   └── Description (expandable)
│   │       └── ItemActions (edit/delete for custom items)
│   │
│   └── AddCustomItemButton
│
└── AddItemModal
    ├── TitleInput
    ├── DescriptionInput
    ├── CategoryPicker
    └── SaveButton / CancelButton
```

### File Structure

```
screens/
  SessionChecklistScreen.js         # Main container component

components/checklist/
  ChecklistHeader.js                # Progress display
  ChecklistItemsList.js             # Grouped item list
  ChecklistItem.js                  # Individual item component
  AddItemModal.js                   # Custom item creation modal
  CategorySection.js                # Grouped section header

lib/
  sessionChecklistService.js        # API service layer

hooks/
  useSessionChecklist.js            # Custom hook for checklist state
```

### State Management Strategy

#### Custom Hook: `useSessionChecklist`

**Purpose**: Encapsulate checklist state management and business logic.

**Key Features**:
- AsyncStorage caching for offline support
- Optimistic updates with rollback
- Error handling and recovery
- Loading and syncing states

**Implementation Pattern**:

```javascript
export const useSessionChecklist = (sessionId) => {
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);

  // Load checklist on mount (with AsyncStorage cache)
  useEffect(() => {
    loadChecklist();
  }, [sessionId]);

  const loadChecklist = async () => {
    // 1. Try AsyncStorage first (instant display)
    // 2. Fetch from Supabase (authoritative)
    // 3. Update AsyncStorage cache
  };

  const toggleItem = useCallback(async (itemId, isCompleted) => {
    // 1. Optimistic update (instant UI)
    // 2. Persist to AsyncStorage
    // 3. Call server API
    // 4. On success: refresh from server
    // 5. On failure: rollback to previous state
  }, [checklist, sessionId]);

  return {
    checklist,
    loading,
    error,
    syncing,
    toggleItem,
    addCustomItem,
    updateItem,
    deleteItem,
    refresh: loadChecklist
  };
};
```

### Routing & Navigation

**Add to existing navigation stack**:

```javascript
<Stack.Screen
  name="SessionChecklist"
  component={SessionChecklistScreen}
  options={{
    title: 'Preparation Checklist',
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.text,
  }}
/>
```

**Navigate from SessionDetailScreen**:

```javascript
navigation.navigate('SessionChecklist', { sessionId: session.id })
```

---

## Data Flow

### Complete User Flow: Toggle Item

```
1. User taps checkbox on ChecklistItem
   ↓
2. ChecklistItem calls onToggle(itemId, isCompleted)
   ↓
3. useSessionChecklist.toggleItem() executes:

   a. Optimistic Update
      - Update local state (checklist.items, completedItems, progress)
      - Persist to AsyncStorage
      - Re-render UI with new state

   b. Server Sync
      - Call sessionChecklistService.toggleItemCompletion(itemId, isCompleted)
      - Service calls Supabase client UPDATE
      - RLS policy validates user ownership
      - Database trigger updates aggregate counts
      - Server returns updated item

   c. Reconciliation
      - Refresh full checklist from server
      - Update AsyncStorage with authoritative data
      - UI reflects final server state

   d. Error Handling (if server call fails)
      - Rollback local state to previous version
      - Restore AsyncStorage to previous version
      - Show error toast to user
      - Re-render UI with rolled-back state
```

### State Synchronization Strategy

**Three Sources of Truth**:
1. **Supabase Database** - Authoritative source
2. **React State** - UI render source
3. **AsyncStorage** - Offline draft source

**Consistency Rules**:
- Always treat Supabase as authoritative
- Use AsyncStorage for optimistic persistence
- Re-fetch from Supabase after mutations to ensure consistency
- On conflicts, server wins

---

## Security Architecture

### Authentication & Authorization

#### Authorization via RLS

**User Ownership Verification**:
- All RLS policies check `auth.uid() = user_id`
- Session ownership validated via JOIN to `sessions` table
- Checklist ownership validated via JOIN to `session_checklists` table

**Permission Matrix**:

| Resource                  | SELECT | INSERT | UPDATE | DELETE |
|---------------------------|--------|--------|--------|--------|
| checklist_template_items  | ✅ All | ❌     | ❌     | ❌     |
| session_checklists        | ✅ Own | ✅ Own | ✅ Own | ✅ Own |
| session_checklist_items   | ✅ Own | ✅ Own | ✅ Own | ✅ Own |

### Input Validation

#### Frontend Validation

```javascript
const validateItemData = (data) => {
  const errors = {};

  if (!data.title || data.title.trim().length === 0) {
    errors.title = 'Title is required';
  }
  if (data.title && data.title.length > 500) {
    errors.title = 'Title must be under 500 characters';
  }
  if (data.description && data.description.length > 2000) {
    errors.description = 'Description must be under 2000 characters';
  }
  if (!['physical', 'mental', 'safety', 'practical'].includes(data.category)) {
    errors.category = 'Invalid category';
  }

  return errors;
};
```

#### Backend Validation (Database Constraints)

```sql
-- Title constraints
CHECK (length(title) >= 1 AND length(title) <= 500)

-- Description constraints
CHECK (length(description) >= 0 AND length(description) <= 2000)

-- Aggregate constraints
CHECK (completed_items >= 0)
CHECK (total_items >= 0)
CHECK (completed_items <= total_items)
```

---

## Error Handling Strategy

### Error Categories

#### 1. Network Errors
**Handling**:
- Fall back to AsyncStorage cached data
- Show "offline mode" banner
- Provide retry button

#### 2. Authorization Errors
**Handling**:
- Refresh JWT session
- Redirect to login if refresh fails

#### 3. Validation Errors
**Handling**:
- Show inline form errors
- Prevent submission until fixed

#### 4. Server Errors
**Handling**:
- Log to error tracking service
- Show generic error message
- Provide retry option

---

## Risk Assessment

### Technical Risks

#### 1. Database Performance
**Risk**: Large checklists (50+ items) slow down queries
**Mitigation**: Indexed queries, 50-item limit enforced

#### 2. Optimistic Update Conflicts
**Risk**: User toggles item, server fails, rollback confusing
**Mitigation**: Clear loading states, toast on rollback, retry mechanism

#### 3. RLS Policy Bugs
**Risk**: Users access other users' checklists
**Mitigation**: Comprehensive RLS testing, security audit

---

## Implementation Checklist

### Phase 1: Database Setup (Day 1)
- [ ] Run migration from 02-database-design.md
- [ ] Verify tables, indexes, RLS policies created
- [ ] Test server function `create_session_checklist()`
- [ ] Verify 18 template items seeded

### Phase 2: Backend Service (Day 1-2)
- [ ] Create `lib/sessionChecklistService.js`
- [ ] Implement all service methods
- [ ] Add error handling and data transformers
- [ ] Test integration with Supabase

### Phase 3: Frontend Hooks (Day 2)
- [ ] Create `hooks/useSessionChecklist.js`
- [ ] Implement state management with AsyncStorage
- [ ] Add optimistic updates with rollback
- [ ] Test hook with mock service

### Phase 4: UI Components (Day 2-3)
- [ ] Create ChecklistHeader, ChecklistItem, CategorySection
- [ ] Create ChecklistItemsList, AddItemModal
- [ ] Apply Noesis color scheme
- [ ] Test components in isolation

### Phase 5: Main Screen (Day 3)
- [ ] Create SessionChecklistScreen
- [ ] Integrate useSessionChecklist hook
- [ ] Implement loading/error states
- [ ] Test full user flows

### Phase 6: Navigation Integration (Day 3)
- [ ] Add route to navigator
- [ ] Add button to SessionDetailScreen
- [ ] Test navigation flow

### Phase 7: Testing (Day 4)
- [ ] Test on iOS/Android
- [ ] Test offline behavior
- [ ] Test optimistic updates
- [ ] Security testing

### Phase 8: Polish & Documentation (Day 4)
- [ ] Add animations and haptics
- [ ] Add accessibility labels
- [ ] Update context files
- [ ] Create demo materials

---

## Success Metrics (Post-Launch)

**Target KPIs (Month 1)**:
- 70%+ of sessions have associated checklists
- 80%+ item completion rate
- 3+ custom items per checklist
- <5% error rate

---

**End of Architecture Document**
