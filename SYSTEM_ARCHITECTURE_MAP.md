# System Architecture Map - Integration Features

## 📂 Complete File Structure

```
psychedelic-integration-app/
│
├── 📱 COMPONENTS (React Native UI)
│   ├── components/IFSPartsInventory.js              ✨ NEW - IFS parts identification
│   ├── components/DailyGlimmersPractice.js          ✨ NEW - Daily glimmers tracking
│   ├── components/PostSessionIntegrationJournal.js  ✨ NEW - Post-session journal
│   ├── components/PreTreatmentBaselineLog.js        ✨ NEW - Baseline assessment
│   ├── components/IntentionSetting.js               ✨ NEW - Intention setting
│   │
│   └── components/ (existing)
│       ├── IFSPartsEducationWidget.js               📚 Existing - IFS education
│       ├── PolyvagalEducationWidget.js              📚 Existing - Nervous system education
│       ├── TriggersAndGlimmersWidget.js             📚 Existing - Triggers mapping
│       └── HuxleyCornerWidget.js                    📚 Existing - AI assistant
│
├── 🗄️ DATABASE SCRIPTS (SQL)
│   └── database/
│       ├── create_ifs_parts_inventory_table.sql      ✨ NEW - Stores IFS parts data
│       ├── create_daily_glimmers_table.sql           ✨ NEW - Stores glimmers
│       ├── create_post_session_journals_table.sql    ✨ NEW - Stores journals
│       ├── create_baseline_logs_table.sql            ✨ NEW - Stores baselines
│       ├── create_session_intentions_table.sql       ✨ NEW - Stores intentions
│       │
│       └── (existing tables)
│           ├── create_education_progress_table.sql   📚 Existing
│           ├── training_scenarios_schema.sql         📚 Existing
│           └── user_roles_schema.sql                 📚 Existing
│
├── 🖥️ SCREENS (Navigation)
│   └── screens/
│       ├── EducationScreen.js                        🎯 Add IFSPartsInventory here
│       ├── OrganizedHomeScreen.js                    🎯 Add DailyGlimmersPractice here
│       ├── ConversationalHomeScreen.js               🎯 Or add DailyGlimmersPractice here
│       ├── PreparationScreen.js                      🎯 Add Baseline & Intention here
│       ├── SessionPreparationScreen.js               🎯 Or add Intention here
│       ├── SessionDetailScreen.js                    🎯 Add PostSessionJournal here
│       └── AllSessionsScreen.js                      🎯 Link to journals
│
├── 📚 DOCUMENTATION
│   ├── INTEGRATION_FEATURES_GUIDE.md                 ✨ Complete implementation guide
│   ├── IMPLEMENTATION_SUMMARY.md                     ✨ Summary & next steps
│   ├── QUICK_START.md                                ✨ Quick reference
│   └── SYSTEM_ARCHITECTURE_MAP.md                    ✨ This file
│
├── 📖 SOURCE PDFs
│   ├── IFS integration part.pdf                      📄 Source material
│   └── Ketamine Integration Guide.pdf                📄 Source material
│
└── 🔧 SERVICES (existing)
    └── lib/
        ├── supabase.js                                🔌 Database connection
        └── educationProgressService.js                🔌 Progress tracking
```

---

## 🗺️ Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                             │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  PHASE 1: PREPARATION (Before Session)                          │
└──────────────────────────────────────────────────────────────────┘

  📱 screens/EducationScreen.js
      │
      ├──> 📦 components/IFSPartsInventory.js
      │         │
      │         └──> 🗄️ database: ifs_parts_inventory
      │                   │
      │                   └── Stores: managers[], firefighters[], exiles[]
      │
  📱 screens/PreparationScreen.js
      │
      ├──> 📦 components/PreTreatmentBaselineLog.js
      │         │
      │         └──> 🗄️ database: baseline_logs
      │                   │
      │                   └── Stores: sleep, energy, mood, relationships, etc.
      │
      └──> 📦 components/IntentionSetting.js
                │
                └──> 🗄️ database: session_intentions
                          │
                          └── Stores: goals[], intentions[], openness, surrender

┌──────────────────────────────────────────────────────────────────┐
│  PHASE 2: DAILY PRACTICE (Ongoing)                              │
└──────────────────────────────────────────────────────────────────┘

  📱 screens/OrganizedHomeScreen.js  OR  ConversationalHomeScreen.js
      │
      └──> 📦 components/DailyGlimmersPractice.js
                │
                └──> 🗄️ database: daily_glimmers
                          │
                          └── Stores: glimmer_text, context, created_at

┌──────────────────────────────────────────────────────────────────┐
│  PHASE 3: POST-SESSION (After Session)                          │
└──────────────────────────────────────────────────────────────────┘

  📱 screens/SessionDetailScreen.js  OR  AllSessionsScreen.js
      │
      └──> 📦 components/PostSessionIntegrationJournal.js
                │
                └──> 🗄️ database: post_session_journals
                          │
                          └── Stores: 13 categories of experience data
                                session_info, visuals, movements, somatic,
                                emotions, relationships, nature_elements,
                                textures, colors, shapes_patterns,
                                darkness_void, realizations, integration
```

---

## 🔗 Component → Database Mapping

| Component | Database Table | Key Fields |
|-----------|----------------|------------|
| **IFSPartsInventory** | `ifs_parts_inventory` | `parts: {managers[], firefighters[], exiles[]}`, `custom_notes` |
| **DailyGlimmersPractice** | `daily_glimmers` | `glimmer_text`, `context`, `created_at` |
| **PostSessionIntegrationJournal** | `post_session_journals` | `session_id`, `responses` (JSONB with 13 categories) |
| **PreTreatmentBaselineLog** | `baseline_logs` | `responses` (JSONB with 7 domains) |
| **IntentionSetting** | `session_intentions` | `goals[]`, `intentions[]`, `openness`, `surrender` |

---

## 🎯 Recommended Screen Integration

### 1. Education Screen
**Path:** `screens/EducationScreen.js`

```javascript
import IFSPartsInventory from '../components/IFSPartsInventory';

// Add as education module:
{
  id: 'ifs_parts',
  title: 'Identify Your Parts',
  icon: '👥',
  component: IFSPartsInventory
}
```

**Why here:** Educational, one-time/periodic, fits with existing education modules

---

### 2. Home Screen (Daily Widget)
**Path:** `screens/OrganizedHomeScreen.js` OR `components/ConversationalHomeScreen.js`

```javascript
import DailyGlimmersPractice from '../components/DailyGlimmersPractice';

// Add as daily prompt widget:
<Card>
  <Text>✨ Today's Glimmers</Text>
  <Button onPress={() => navigation.navigate('GlimmersPractice')}>
    Add Glimmers
  </Button>
</Card>
```

**Why here:** Daily habit, frequent access, part of routine

---

### 3. Preparation Screen
**Path:** `screens/PreparationScreen.js` OR `screens/preparation/SessionPreparationScreen.js`

```javascript
import PreTreatmentBaselineLog from '../components/PreTreatmentBaselineLog';
import IntentionSetting from '../components/IntentionSetting';

// Add to preparation checklist:
const preparationSteps = [
  {
    id: 'baseline',
    title: 'Establish Baseline',
    component: PreTreatmentBaselineLog,
    frequency: 'monthly'
  },
  {
    id: 'intention',
    title: 'Set Intention',
    component: IntentionSetting,
    frequency: 'per-session'
  }
];
```

**Why here:** Pre-session preparation, structured flow

---

### 4. Session Detail Screen
**Path:** `screens/SessionDetailScreen.js`

```javascript
import PostSessionIntegrationJournal from '../components/PostSessionIntegrationJournal';

// Add post-session action:
{session.completed && !session.journaled && (
  <Button
    icon="book"
    onPress={() => navigation.navigate('IntegrationJournal', {
      sessionId: session.id
    })}
  >
    Complete Integration Journal
  </Button>
)}
```

**Why here:** Session-specific, post-completion action

---

## 🔄 Complete User Flow Example

### Scenario: User's First Psychedelic Session

```
┌─────────────────────────────────────────────────────────────────┐
│  WEEK 1: PREPARATION                                            │
└─────────────────────────────────────────────────────────────────┘

Day 1: User signs up
    ↓
📱 OnboardingCarousel (existing)
    ↓
📱 EducationScreen
    ↓
📦 IFSPartsInventory (15 min)
    → Identifies: "Achiever", "People Pleaser", "Hurt Child"
    → Saves to: ifs_parts_inventory table

Day 2-6: Daily practice
    ↓
📱 HomeScreen (daily)
    ↓
📦 DailyGlimmersPractice (3-5 min/day)
    → Captures: "Morning sun", "Dog wagging tail", "Warm tea"
    → Saves to: daily_glimmers table

Day 7: Session preparation
    ↓
📱 PreparationScreen
    ↓
📦 PreTreatmentBaselineLog (20 min)
    → Rates: Sleep(6), Energy(5), Mood(4), etc.
    → Saves to: baseline_logs table
    ↓
📦 IntentionSetting (10 min)
    → Goal: "Heal my anxiety"
    → Intention: "Be curious about my anxiety"
    → Saves to: session_intentions table

┌─────────────────────────────────────────────────────────────────┐
│  WEEK 2: SESSION DAY                                            │
└─────────────────────────────────────────────────────────────────┘

Morning: Review intention
    ↓
📱 SessionPreparationScreen
    → Shows saved intention
    ↓
[Session happens...]
    ↓
📱 SessionDetailScreen
    → Marks session as complete

┌─────────────────────────────────────────────────────────────────┐
│  WEEK 2-3: INTEGRATION (24-72 hour window)                     │
└─────────────────────────────────────────────────────────────────┘

Day 1 post-session:
    ↓
📱 SessionDetailScreen
    ↓
📦 PostSessionIntegrationJournal (30 min)
    → Records: Visuals, emotions, realizations, etc.
    → Saves to: post_session_journals table

Days 1-3 post-session (CRITICAL):
    ↓
📱 HomeScreen (3x daily)
    ↓
📦 DailyGlimmersPractice
    → Captures: 3+ glimmers per day
    → Saves to: daily_glimmers table

Week 2-4: Continued practice
    ↓
📱 HomeScreen (daily)
    ↓
📦 DailyGlimmersPractice
    → Maintains daily practice
    → Neuroplasticity continues

┌─────────────────────────────────────────────────────────────────┐
│  ONGOING: TRACKING PROGRESS                                     │
└─────────────────────────────────────────────────────────────────┘

Monthly check-in:
    ↓
📱 AllSessionsScreen
    → Reviews all journal entries
    → Compares baselines over time
    → Notices patterns and growth
```

---

## 🗃️ Database Schema Summary

### Table: `ifs_parts_inventory`
```sql
CREATE TABLE ifs_parts_inventory (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  parts JSONB DEFAULT '{"managers": [], "firefighters": [], "exiles": []}',
  custom_notes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id)
);
```
**Location:** `database/create_ifs_parts_inventory_table.sql`

---

### Table: `daily_glimmers`
```sql
CREATE TABLE daily_glimmers (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  glimmer_text TEXT NOT NULL,
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
**Location:** `database/create_daily_glimmers_table.sql`

---

### Table: `post_session_journals`
```sql
CREATE TABLE post_session_journals (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_id UUID,
  session_title TEXT NOT NULL,
  responses JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```
**Location:** `database/create_post_session_journals_table.sql`

---

### Table: `baseline_logs`
```sql
CREATE TABLE baseline_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  responses JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ
);
```
**Location:** `database/create_baseline_logs_table.sql`

---

### Table: `session_intentions`
```sql
CREATE TABLE session_intentions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_id UUID,
  goals TEXT[] DEFAULT '{}',
  intentions TEXT[] DEFAULT '{}',
  openness TEXT,
  surrender TEXT,
  created_at TIMESTAMPTZ
);
```
**Location:** `database/create_session_intentions_table.sql`

---

## 🔐 Security: Row Level Security (RLS)

All tables have identical RLS policies:

```sql
-- Users can only read their own data
CREATE POLICY "Users can read own [table]"
  ON [table]
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own data
CREATE POLICY "Users can insert own [table]"
  ON [table]
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own data
CREATE POLICY "Users can update own [table]"
  ON [table]
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own data
CREATE POLICY "Users can delete own [table]"
  ON [table]
  FOR DELETE
  USING (auth.uid() = user_id);
```

**Result:** Complete data isolation between users

---

## 📊 Data Flow Visualization

```
┌───────────────────────────────────────────────────────────────────┐
│                       USER DEVICE (React Native)                  │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  📱 Screen Layer                                                  │
│  ├── EducationScreen.js                                          │
│  ├── OrganizedHomeScreen.js                                      │
│  ├── PreparationScreen.js                                        │
│  └── SessionDetailScreen.js                                      │
│                          │                                        │
│                          ▼                                        │
│  📦 Component Layer                                               │
│  ├── IFSPartsInventory.js           ◄── User interacts           │
│  ├── DailyGlimmersPractice.js       ◄── User fills forms         │
│  ├── PostSessionIntegrationJournal.js ◄── User submits data      │
│  ├── PreTreatmentBaselineLog.js                                  │
│  └── IntentionSetting.js                                         │
│                          │                                        │
│                          ▼                                        │
│  🔌 Service Layer                                                 │
│  └── lib/supabase.js                ◄── Handles auth & queries   │
│                          │                                        │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           │ HTTPS (Encrypted)
                           │
                           ▼
┌───────────────────────────────────────────────────────────────────┐
│                    SUPABASE CLOUD (Database)                      │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  🛡️ Authentication Layer                                          │
│  └── auth.users                     ◄── User authentication      │
│                          │                                        │
│                          ▼                                        │
│  🔐 Row Level Security                                            │
│  └── RLS Policies                   ◄── Data access control      │
│                          │                                        │
│                          ▼                                        │
│  🗄️ Database Tables                                               │
│  ├── ifs_parts_inventory            ◄── Stores IFS data          │
│  ├── daily_glimmers                 ◄── Stores glimmers          │
│  ├── post_session_journals          ◄── Stores journals          │
│  ├── baseline_logs                  ◄── Stores baselines         │
│  └── session_intentions             ◄── Stores intentions        │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🔍 How Data Moves Through System

### Example: User Completes IFS Parts Inventory

```
1. USER ACTION
   └── User opens Education Screen
       └── Taps "Identify Your Parts"

2. COMPONENT LOADS
   └── IFSPartsInventory.js renders
       └── Shows: Managers, Firefighters, Exiles
       └── User selects: "Achiever", "People Pleaser", "Hurt Child"
       └── User adds notes

3. AUTO-SAVE TRIGGERS
   └── Component calls: saveInventory()
       └── Function in IFSPartsInventory.js

4. SUPABASE SERVICE
   └── lib/supabase.js handles request
       └── Authenticates user (auth.uid())
       └── Sends data to Supabase

5. DATABASE OPERATION
   └── Supabase receives request
       └── RLS checks: Is auth.uid() === user_id? ✅
       └── UPSERT into ifs_parts_inventory
       └── Returns success

6. UI FEEDBACK
   └── Component shows: "Saved ✓"
       └── User continues to next step
```

---

## 📱 Screen Navigation Map

```
App.js (Root)
│
├── Auth Flow
│   └── AuthScreen.js ──────────► (Login/Signup)
│       │
│       └── OnboardingCarousel.js ──► (First-time users)
│
└── Main App Flow (After Auth)
    │
    ├── MainTabs (Bottom Navigation)
    │   ├── Tab: Home
    │   │   └── ConversationalHomeScreen.js
    │   │       └── 🎯 ADD: DailyGlimmersPractice widget
    │   │
    │   ├── Tab: Learn
    │   │   └── EducationScreen.js
    │   │       └── 🎯 ADD: IFSPartsInventory module
    │   │
    │   └── Tab: Sessions
    │       └── ConversationalAllSessions.js
    │           └── SessionDetailScreen.js
    │               └── 🎯 ADD: PostSessionIntegrationJournal button
    │
    └── Stack Screens (Full Screen)
        │
        ├── PreparationScreen.js
        │   ├── 🎯 ADD: PreTreatmentBaselineLog
        │   └── 🎯 ADD: IntentionSetting
        │
        ├── SessionPreparationScreen.js
        │   └── 🎯 ADD: IntentionSetting (alternative location)
        │
        └── ExerciseLibraryScreen.js
            └── Could link to DailyGlimmersPractice
```

---

## 🎨 Component Hierarchy

```
IFSPartsInventory
├── Header (progress bar)
├── ScrollView (content)
│   ├── Intro slide
│   ├── Manager parts (7 parts)
│   ├── Firefighter parts (5 parts)
│   ├── Exile parts (9 parts)
│   ├── Self qualities (8 C's)
│   └── Summary
└── Footer (navigation)

DailyGlimmersPractice
├── Header (progress bar)
├── ScrollView (content)
│   ├── Intro
│   ├── Education (neuroplasticity)
│   ├── Examples (4 categories)
│   ├── Capture form
│   ├── Practice guidance
│   └── Summary
└── Footer (navigation)

PostSessionIntegrationJournal
├── Header (progress bar)
├── ScrollView (content)
│   ├── Session info
│   ├── Visuals
│   ├── Movements
│   ├── Somatic
│   ├── Emotions
│   ├── Relationships
│   ├── Nature elements
│   ├── Textures
│   ├── Colors
│   ├── Shapes/patterns
│   ├── Darkness/void
│   ├── Realizations
│   └── Integration notes
└── Footer (navigation)

PreTreatmentBaselineLog
├── Header (progress bar)
├── ScrollView (content)
│   ├── Intro
│   ├── Sleep domain
│   ├── Energy domain
│   ├── Mood domain
│   ├── Relationships domain
│   ├── Work domain
│   ├── Self-care domain
│   ├── Symptoms domain
│   └── Summary
└── Footer (navigation)

IntentionSetting
├── Header (progress bar)
├── ScrollView (content)
│   ├── Intro
│   ├── Goals vs Intentions education
│   ├── Goals capture
│   ├── Transformation guidance
│   ├── Intentions capture
│   ├── Openness reflection
│   ├── Surrender reflection
│   └── Summary
└── Footer (navigation)
```

---

## 📍 Quick Reference: File Locations

### Need to edit a component?
```
components/IFSPartsInventory.js
components/DailyGlimmersPractice.js
components/PostSessionIntegrationJournal.js
components/PreTreatmentBaselineLog.js
components/IntentionSetting.js
```

### Need to run SQL scripts?
```
database/create_ifs_parts_inventory_table.sql
database/create_daily_glimmers_table.sql
database/create_post_session_journals_table.sql
database/create_baseline_logs_table.sql
database/create_session_intentions_table.sql
```

### Need to integrate into screens?
```
screens/EducationScreen.js              ← Add IFSPartsInventory
screens/OrganizedHomeScreen.js          ← Add DailyGlimmersPractice
screens/PreparationScreen.js            ← Add Baseline & Intention
screens/SessionDetailScreen.js          ← Add PostSessionJournal
```

### Need documentation?
```
INTEGRATION_FEATURES_GUIDE.md           ← Full details
IMPLEMENTATION_SUMMARY.md               ← Overview
QUICK_START.md                          ← Quick reference
SYSTEM_ARCHITECTURE_MAP.md              ← This file
```

---

## 🚀 Implementation Checklist

- [ ] **Step 1:** Run 5 SQL scripts in Supabase
- [ ] **Step 2:** Verify tables created (check Supabase Table Editor)
- [ ] **Step 3:** Test one component standalone
- [ ] **Step 4:** Add IFSPartsInventory to EducationScreen
- [ ] **Step 5:** Add DailyGlimmersPractice to HomeScreen
- [ ] **Step 6:** Add Baseline & Intention to PreparationScreen
- [ ] **Step 7:** Add PostSessionJournal to SessionDetailScreen
- [ ] **Step 8:** Test complete user flow
- [ ] **Step 9:** Deploy and monitor

---

## 📞 Need Help?

**Can't find a file?**
- Check the file structure above
- Use search: `Ctrl+P` in VS Code

**SQL scripts not working?**
- Check Supabase connection
- Verify user has permissions
- Run scripts one at a time

**Component not rendering?**
- Check import path
- Verify component is exported
- Check for console errors

**Data not saving?**
- Check RLS policies
- Verify user is authenticated
- Check Network tab for errors

---

This map should help you navigate the entire system! Let me know if you need clarification on any part.
