# Integration Guide: Session Checklist Feature

Quick guide to integrate the Session Day Checklist into the app navigation.

---

## Step 1: Add Import to App.js

**File:** `App.js`
**Location:** Near line 72 (after other screen imports)

```javascript
import SessionChecklistScreen from './screens/SessionChecklistScreen';
```

---

## Step 2: Add to Navigation Stack

**File:** `App.js`
**Location:** After line ~349 (inside Stack.Navigator, after SessionPreparation screen)

```javascript
<Stack.Screen
  name="SessionChecklist"
  component={SessionChecklistScreen}
  options={{
    headerShown: false,
    title: 'Session Checklist'
  }}
/>
```

---

## Step 3: Add Navigation Link from Session Screens

### Option A: From SessionDetailScreen.js

**File:** `screens/SessionDetailScreen.js`
**Location:** In `sessionOptions` array, add new option:

```javascript
{
  id: 'checklist',
  title: 'Session Checklist',
  emoji: '✅',
  description: 'Prepare for your session with a comprehensive checklist',
  details: [
    'Physical preparation (fasting, hydration, rest)',
    'Safety & support (sitter, emergency contacts)',
    'Mental/emotional preparation (intentions, meditation)',
    'Practical logistics (space, supplies, music)',
    'Add custom preparation steps'
  ],
  estimatedTime: '10-20 min',
  color: colors.success,
  status: 'Not Started', // TODO: Check checklist completion status
  onPress: () => navigation.navigate('SessionChecklist', {
    sessionId: currentSession.id,
    sessionData: currentSession
  })
}
```

**Placement:** Before 'preparation' option (make it first in workflow)

---

### Option B: From SessionPreparationScreen.js

**File:** `screens/preparation/SessionPreparationScreen.js`
**Location:** Add button to navigate to checklist

```javascript
<TouchableOpacity
  style={styles.checklistButton}
  onPress={() => navigation.navigate('SessionChecklist', {
    sessionId: route.params.sessionId,
    sessionData: route.params.sessionData
  })}
>
  <MaterialIcons name="checklist" size={24} color={colors.primary} />
  <Text style={styles.checklistButtonText}>Session Day Checklist</Text>
</TouchableOpacity>
```

---

## Step 4: Test Navigation

### Test Flow:
1. Open app
2. Navigate to "Sessions" or "Home"
3. Select or create a session
4. Click "Session Checklist" option
5. Verify checklist loads with 18 default items
6. Test checkbox toggles
7. Test adding custom item
8. Navigate back and verify state persists

---

## Example Navigation Calls

### From any screen with navigation prop:

```javascript
// Basic navigation
navigation.navigate('SessionChecklist', {
  sessionId: 'uuid-here'
});

// With session data for header display
navigation.navigate('SessionChecklist', {
  sessionId: session.id,
  sessionData: {
    title: session.title,
    journey_date: session.journey_date
  }
});
```

---

## Verify Backend Connection

The checklist service is already implemented at:
```
lib/sessionChecklistService.js
```

Database tables should already exist:
- `session_checklists`
- `session_checklist_items`
- `checklist_template_items`

**To verify backend is ready:**
```javascript
import sessionChecklistService from './lib/sessionChecklistService';

// Test in a screen
const testChecklist = await sessionChecklistService.getOrCreateChecklist('session-id');
console.log('Checklist loaded:', testChecklist);
```

---

## Troubleshooting

### Checklist doesn't load
- Check console for errors
- Verify sessionId is valid UUID
- Check Supabase connection
- Verify RLS policies allow user access

### Items don't toggle
- Check network connection
- Verify Supabase client initialized
- Check console for service errors

### Can't add custom items
- Verify 50-item limit not reached
- Check input validation (200 char title, 500 char desc)
- Verify RLS policies allow inserts

### Navigation not working
- Verify screen imported in App.js
- Check Stack.Screen name matches navigation call
- Verify sessionId passed in params

---

## Complete Integration Example

**File:** `screens/SessionDetailScreen.js`

```javascript
// Add to imports
import { colors } from '../theme/colors';

// Modify sessionOptions array
const sessionOptions = [
  {
    id: 'checklist',
    title: 'Session Day Checklist',
    emoji: '✅',
    description: 'Prepare for your session with a comprehensive checklist',
    details: [
      'Physical preparation (fasting, hydration, rest)',
      'Safety & support (sitter, emergency contacts)',
      'Mental/emotional preparation (intentions, meditation)',
      'Practical logistics (space, supplies, music)',
      'Add custom preparation steps'
    ],
    estimatedTime: '10-20 min',
    color: colors.success,
    status: 'Not Started',
    onPress: () => navigation.navigate('SessionChecklist', {
      sessionId: currentSession.id,
      sessionData: currentSession
    })
  },
  {
    id: 'preparation',
    title: 'Session Preparation',
    emoji: '🎯',
    // ... existing preparation option
  },
  // ... other options
];
```

---

## Quick Start Commands

```bash
# 1. Verify files exist
ls screens/SessionChecklistScreen.js
ls components/checklist/
ls useSessionChecklist.js

# 2. Start dev server
npm start

# 3. Open app on device/emulator
# iOS: press 'i'
# Android: press 'a'

# 4. Test navigation
# Navigate to Sessions > Select Session > Session Checklist
```

---

**Integration Time:** ~15 minutes
**Testing Time:** ~30 minutes
**Ready to Ship:** After integration + testing complete

---

**Last Updated:** 2026-02-10
