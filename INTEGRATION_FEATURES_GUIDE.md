# Integration Features Implementation Guide

## Overview

This guide documents the new integration features implemented from the IFS Integration and Ketamine Integration Guide PDFs. These features provide comprehensive support for psychedelic preparation, session tracking, and integration.

## Implemented Features

### 1. IFS Parts Inventory

**Location:** `components/IFSPartsInventory.js`
**Database:** `database/create_ifs_parts_inventory_table.sql`

A comprehensive Internal Family Systems (IFS) parts identification tool that helps users recognize and understand their internal protectors and vulnerable parts.

#### Features:
- **Manager Parts** (Proactive Protectors):
  - Achiever
  - People Pleaser
  - Controller
  - Caretaker
  - Strong One
  - Critic
  - Vigilant One

- **Firefighter Parts** (Reactive Protectors):
  - Rager
  - Escape Artist
  - Rebel
  - Chaos Creator
  - Indulger

- **Exile Parts** (Vulnerable Parts):
  - Hurt Child
  - Scared One
  - Angry One
  - Sad One
  - Lonely One
  - Joyful One
  - Creative One
  - Wild One
  - Wise One

#### Implementation Details:
- Each part includes description and reflection questions
- Users can add custom notes for each identified part
- Progress is saved to Supabase database
- Introduces the 8 C's of Self-Leadership (Curious, Compassionate, Calm, Connected, Courageous, Creative, Clarity, Confidence)

#### How to Use:
```javascript
import IFSPartsInventory from './components/IFSPartsInventory';

<IFSPartsInventory
  onComplete={(selectedParts) => {
    console.log('User identified parts:', selectedParts);
  }}
  onSkip={() => {
    console.log('User skipped parts inventory');
  }}
/>
```

---

### 2. Daily Glimmers Practice

**Location:** `components/DailyGlimmersPractice.js`
**Database:** `database/create_daily_glimmers_table.sql`

Tracks micro-moments of safety, joy, and connection to help rewire the nervous system toward regulation. Based on polyvagal theory and neuroplasticity principles.

#### Features:
- Educational content about glimmers and neuroplasticity
- Examples organized by category:
  - Sensory Glimmers
  - Connection Glimmers
  - Nature Glimmers
  - Simple Pleasures
- Daily tracking with context
- Integration window awareness (24-72 hours post-session)
- Practice guidance and reminders

#### Implementation Details:
- Glimmers stored with timestamp and optional context
- Loads today's glimmers automatically
- Encourages 3+ glimmers per day
- Emphasizes importance during integration windows

#### How to Use:
```javascript
import DailyGlimmersPractice from './components/DailyGlimmersPractice';

<DailyGlimmersPractice
  onComplete={(data) => {
    console.log('Today\'s glimmers:', data.glimmers);
  }}
  onSkip={() => {
    console.log('User skipped glimmers practice');
  }}
/>
```

---

### 3. Post-Session Integration Journal

**Location:** `components/PostSessionIntegrationJournal.js`
**Database:** `database/create_post_session_journals_table.sql`

Comprehensive multi-sensory tracking for deep integration of psychedelic experiences. Includes 13 tracking categories.

#### Features:

**1. Session Information**
- Date, substance/dose, setting, overall quality

**2. Visuals**
- Colors, shapes, landscapes, beings, symbols

**3. Movements & Impulses**
- Spontaneous movements, urges, posture changes

**4. Somatic Sensations**
- Temperature, pressure, textures, pain/pleasure, energy

**5. Emotions**
- Primary emotions, complex feelings, waves and shifts

**6. Relationships & Connection**
- Who appeared, quality of relating, sense of being held

**7. Nature Elements**
- Water, earth, fire, air, plants, animals

**8. Textures**
- Surface qualities, density, movement qualities

**9. Colors & Their Meaning**
- Emotional and energetic information from colors

**10. Shapes & Patterns**
- Geometric, organic, repeating motifs

**11. Darkness / Void / Nothing**
- Experiences of emptiness or apparent "nothingness"

**12. Realizations & Insights**
- Aha moments, downloads, understanding

**13. Integration Notes**
- What stands out, action steps, support needed

#### Implementation Details:
- Step-by-step guided journaling
- Prompting questions for each category
- Saves comprehensive JSONB data to database
- Links to session IDs for tracking over time

#### How to Use:
```javascript
import PostSessionIntegrationJournal from './components/PostSessionIntegrationJournal';

<PostSessionIntegrationJournal
  sessionId={currentSessionId}
  onComplete={(journalData) => {
    console.log('Journal saved:', journalData);
  }}
  onSkip={() => {
    console.log('User skipped journaling');
  }}
/>
```

---

### 4. Pre-Treatment Baseline Log

**Location:** `components/PreTreatmentBaselineLog.js`
**Database:** `database/create_baseline_logs_table.sql`

Establishes baseline measurements across life domains before psychedelic sessions to track changes and progress.

#### Features:

**Tracked Domains:**
1. **Sleep** - Quality, hours, patterns
2. **Energy & Vitality** - Energy levels, fatigue, what boosts vitality
3. **Mood & Emotions** - Overall mood, predominant emotions, reactivity
4. **Relationships** - Satisfaction, connection quality, challenges
5. **Work & Purpose** - Satisfaction, sense of meaning, stress
6. **Self-Care & Health** - Care practices, physical health concerns
7. **Symptom Tracking** - Anxiety, depression, other symptoms (1-10 scales)

#### Implementation Details:
- Uses 1-10 rating scales for quantitative tracking
- Open-ended text fields for qualitative data
- Loads previous baseline for comparison
- Recommended 1-2 days before session

#### How to Use:
```javascript
import PreTreatmentBaselineLog from './components/PreTreatmentBaselineLog';

<PreTreatmentBaselineLog
  onComplete={(baselineData) => {
    console.log('Baseline established:', baselineData);
  }}
  onSkip={() => {
    console.log('User skipped baseline');
  }}
/>
```

---

### 5. Intention Setting

**Location:** `components/IntentionSetting.js`
**Database:** `database/create_session_intentions_table.sql`

Helps users distinguish between goals (outcome-focused) and intentions (process-focused) for psychedelic sessions.

#### Features:

**Educational Components:**
- Goals vs Intentions comparison
- Transformation guidance (goals → intentions)
- Openness to experience
- Surrender and trust practices

**Tracking:**
- User goals (what they want to achieve)
- User intentions (how they want to be)
- Openness reflection
- Surrender reflection

#### Implementation Details:
- Step-by-step guided process
- Stores both goals and intentions as arrays
- Linked to specific session IDs
- Encourages process over outcome focus

#### How to Use:
```javascript
import IntentionSetting from './components/IntentionSetting';

<IntentionSetting
  sessionId={upcomingSessionId}
  onComplete={(intentionData) => {
    console.log('Intentions set:', intentionData);
  }}
  onSkip={() => {
    console.log('User skipped intention setting');
  }}
/>
```

---

## Database Setup

### Running the SQL Scripts

All database tables need to be created in your Supabase project. Run these SQL files in order:

1. `database/create_ifs_parts_inventory_table.sql`
2. `database/create_daily_glimmers_table.sql`
3. `database/create_post_session_journals_table.sql`
4. `database/create_baseline_logs_table.sql`
5. `database/create_session_intentions_table.sql`

### Row Level Security (RLS)

All tables have RLS enabled with the following policies:
- Users can only read their own data
- Users can only insert their own data
- Users can only update their own data
- Users can only delete their own data

### Indexes

Each table includes indexes for:
- `user_id` - for efficient user-specific queries
- `created_at` - for chronological sorting
- Additional relationship indexes where applicable

---

## Integration Points

### Where to Add These Components

#### 1. IFS Parts Inventory
**Recommended locations:**
- Education Screen
- Pre-Session Preparation
- Onboarding flow

```javascript
// In EducationScreen.js or PreparationScreen.js
import IFSPartsInventory from '../components/IFSPartsInventory';

// Add as a module or screen option
```

#### 2. Daily Glimmers Practice
**Recommended locations:**
- Home Screen (daily prompt)
- Session Tools
- Integration reminders

```javascript
// In OrganizedHomeScreen.js or SessionToolsScreen.js
import DailyGlimmersPractice from '../components/DailyGlimmersPractice';

// Add as a daily practice widget
```

#### 3. Post-Session Integration Journal
**Recommended locations:**
- Immediately after session completion
- Session detail screen
- All Sessions screen (as action)

```javascript
// In SessionDetailScreen.js
import PostSessionIntegrationJournal from '../components/PostSessionIntegrationJournal';

// Show after session ends
```

#### 4. Pre-Treatment Baseline Log
**Recommended locations:**
- Before starting new treatment series
- Pre-session checklist
- Preparation hub

```javascript
// In PreparationScreen.js
import PreTreatmentBaselineLog from '../components/PreTreatmentBaselineLog';

// Show before first session or periodically
```

#### 5. Intention Setting
**Recommended locations:**
- Session preparation
- Before each session
- Preparation checklist

```javascript
// In SessionPreparationScreen.js
import IntentionSetting from '../components/IntentionSetting';

// Show before session starts
```

---

## Recommended User Flow

### Pre-Session Flow
1. **Establish Baseline** (first session or monthly)
   - Complete Pre-Treatment Baseline Log

2. **Identify Parts** (one-time or periodic)
   - Complete IFS Parts Inventory

3. **Set Intention** (before each session)
   - Complete Intention Setting

4. **Practice Glimmers** (daily, especially before sessions)
   - Add daily glimmers

### Post-Session Flow
1. **Integration Journal** (within 24-72 hours)
   - Complete Post-Session Integration Journal

2. **Daily Glimmers** (especially important first 3 days)
   - Track glimmers 3+ times daily

3. **Review Progress** (weekly)
   - Compare to baseline
   - Review journal entries
   - Notice shifts and changes

---

## Component Props Reference

### Common Props Pattern
All components follow this pattern:

```typescript
interface ComponentProps {
  onComplete?: (data: any) => void;  // Called when user completes the component
  onSkip?: () => void;                // Called when user skips
  sessionId?: string;                 // Optional session linking
}
```

### Data Structures

#### IFS Parts Inventory Response
```typescript
{
  managers: string[];        // Array of selected manager parts
  firefighters: string[];    // Array of selected firefighter parts
  exiles: string[];         // Array of selected exile parts
}
```

#### Daily Glimmers Response
```typescript
{
  glimmers: Array<{
    id: string;
    user_id: string;
    glimmer_text: string;
    context?: string;
    created_at: string;
  }>;
}
```

#### Post-Session Journal Response
```typescript
{
  session_id?: string;
  session_title: string;
  responses: {
    session_info: object;
    visuals: object;
    movements: object;
    somatic: object;
    emotions: object;
    relationships: object;
    nature_elements: object;
    textures: object;
    colors: object;
    shapes_patterns: object;
    darkness_void: object;
    realizations: object;
    integration: object;
  };
}
```

#### Baseline Log Response
```typescript
{
  responses: {
    sleep: object;
    energy: object;
    mood: object;
    relationships: object;
    work: object;
    self_care: object;
    symptoms: object;
  };
}
```

#### Intention Setting Response
```typescript
{
  session_id?: string;
  goals: string[];
  intentions: string[];
  openness: string;
  surrender: string;
}
```

---

## Styling and Theming

All components use consistent styling:

### Color Palette
- **Primary Purple**: `#a855f7` (spiritual, transformation)
- **Success Green**: `#10b981` (growth, healing)
- **Info Blue**: `#3b82f6` (clarity, insight)
- **Warning Amber**: `#f59e0b` (attention, awareness)
- **Danger Red**: `#dc2626` (intensity, activation)
- **Neutral Grays**: `#1f2937` to `#f9fafb` (backgrounds, text)

### Typography
- **Headers**: 24px, 600 weight
- **Body**: 15-16px, 400 weight
- **Labels**: 14px, 600 weight
- **Helper Text**: 13-14px, 400 weight, italic

### Spacing
- Uses 4px base unit
- Common gaps: 8px, 12px, 16px, 20px, 24px
- Padding: 16px-24px for cards
- Margins: 12px-20px between sections

---

## Best Practices

### User Experience
1. **Save Progress Automatically** - All components auto-save to prevent data loss
2. **Allow Skipping** - Users shouldn't feel forced to complete everything
3. **Provide Context** - Each component explains why it's valuable
4. **Show Progress** - Progress bars help users see where they are
5. **Encourage but Don't Pressure** - Integration is personal

### Data Privacy
1. **All data is user-private** - RLS policies ensure data isolation
2. **No sharing by default** - Users control their data
3. **Optional therapist sharing** - Could be added as feature
4. **Secure storage** - Supabase handles encryption

### Performance
1. **Lazy load components** - Load when needed
2. **Debounce auto-save** - Prevent excessive writes
3. **Cache recent data** - Reduce database queries
4. **Optimize large text** - Use TextInput efficiently

---

## Future Enhancements

### Possible Additions
1. **Data Visualization** - Charts showing baseline changes over time
2. **Therapist Portal** - Share insights with trusted providers
3. **Reminders** - Push notifications for glimmers practice
4. **Templates** - Pre-filled prompts for common experiences
5. **Export** - PDF or CSV export of journals
6. **Search** - Full-text search across journals
7. **Tags** - Category tags for journal entries
8. **Analytics** - Personal insights dashboard

### Integration Opportunities
1. **Link to AI Coach** - Use journal data to inform conversations
2. **Pattern Recognition** - Identify recurring themes
3. **Progress Tracking** - Visualize growth over time
4. **Community** - Anonymous sharing of insights (opt-in)

---

## Troubleshooting

### Common Issues

**Database Connection Errors**
```
Error: Could not save data
Solution: Check Supabase connection in lib/supabase.js
```

**RLS Policy Errors**
```
Error: Permission denied
Solution: Verify RLS policies are created and auth is working
```

**Component Not Rendering**
```
Error: Component not found
Solution: Check import paths are correct
```

### Debugging Tips
1. Check browser console for errors
2. Verify Supabase connection in Network tab
3. Test RLS policies in Supabase SQL editor
4. Use React DevTools to inspect component state

---

## Support and Documentation

### Related Files
- **PDFs**: `IFS integration part.pdf`, `Ketamine Integration Guide.pdf`
- **Components**: All in `components/` directory
- **Database**: All SQL in `database/` directory
- **Theme**: `theme/colors.js`

### Key Concepts
- **IFS (Internal Family Systems)**: Therapeutic model recognizing different "parts" of self
- **Polyvagal Theory**: Understanding nervous system states (ventral vagal, sympathetic, dorsal vagal)
- **Glimmers**: Opposite of triggers - micro-moments of safety
- **Integration Window**: 24-72 hours post-session when brain is most receptive
- **Neuroplasticity**: Brain's ability to rewire through repeated experiences

---

## Credits and Attribution

These features are based on:
- **IFS Integration Part PDF** - Internal Family Systems framework
- **Ketamine Integration Guide PDF** - Comprehensive integration practices
- **Polyvagal Theory** - Dr. Stephen Porges
- **Glimmers Concept** - Deb Dana, LCSW
- **IFS Therapy** - Dr. Richard Schwartz

---

## License and Usage

This implementation is part of the Psychetelia psychedelic integration application.

**For users**: These features are designed to support your healing journey.
**For developers**: Feel free to adapt for your own integration apps with proper attribution.
**For therapists**: These tools can complement professional therapeutic support.

---

## Questions and Feedback

If you have questions about implementing or using these features, please refer to:
1. This documentation
2. The original PDF sources
3. Component source code comments
4. Supabase documentation for database questions

**Remember**: These tools support integration, but they don't replace professional therapeutic support when needed.
