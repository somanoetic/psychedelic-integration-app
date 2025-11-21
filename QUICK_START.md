# Quick Start - Integration Features

## 🚀 Get Started in 3 Steps

### Step 1: Create Database Tables (5 minutes)

Open your Supabase dashboard and run these SQL files:

1. ✅ `database/create_ifs_parts_inventory_table.sql`
2. ✅ `database/create_daily_glimmers_table.sql`
3. ✅ `database/create_post_session_journals_table.sql`
4. ✅ `database/create_baseline_logs_table.sql`
5. ✅ `database/create_session_intentions_table.sql`

**How to run:**
- Supabase Dashboard → SQL Editor → New Query
- Copy/paste each file → Run
- Verify no errors

---

### Step 2: Test a Component (10 minutes)

Pick any component to test first. Here's the simplest one:

```javascript
import IFSPartsInventory from './components/IFSPartsInventory';

// In your screen/component:
<IFSPartsInventory
  onComplete={(data) => console.log('Done!', data)}
  onSkip={() => console.log('Skipped')}
/>
```

**Test it:**
1. Add import to a test screen
2. Render the component
3. Go through the flow
4. Check Supabase to see if data saved

---

### Step 3: Integrate into App Flow (varies)

Add components where they make sense:

**Education Screen:**
- IFSPartsInventory

**Home Screen:**
- DailyGlimmersPractice (as daily widget)

**Preparation Screen:**
- PreTreatmentBaselineLog
- IntentionSetting

**Session Detail Screen:**
- PostSessionIntegrationJournal

---

## 📋 Component Quick Reference

| Component | Purpose | When to Use | Time to Complete |
|-----------|---------|-------------|------------------|
| **IFSPartsInventory** | Identify protective & vulnerable parts | First time / periodic | 10-15 min |
| **DailyGlimmersPractice** | Track micro-moments of safety | Daily | 3-5 min |
| **PostSessionIntegrationJournal** | Process session experiences | After each session | 20-30 min |
| **PreTreatmentBaselineLog** | Establish baseline metrics | Before treatment series | 15-20 min |
| **IntentionSetting** | Set session intentions | Before each session | 10-15 min |

---

## 🎯 Recommended User Journey

### Before First Session
1. ✅ Complete **PreTreatmentBaselineLog** (baseline)
2. ✅ Complete **IFSPartsInventory** (self-awareness)
3. ✅ Complete **IntentionSetting** (prepare mindset)

### Before Each Session
1. ✅ Complete **IntentionSetting** (set intention)
2. ✅ Add today's glimmers in **DailyGlimmersPractice**

### After Each Session
1. ✅ Complete **PostSessionIntegrationJournal** (within 24-72 hours)
2. ✅ Add 3+ glimmers daily in **DailyGlimmersPractice** (especially first 3 days)

### Periodic Check-ins
1. ✅ Review **PreTreatmentBaselineLog** monthly
2. ✅ Update **IFSPartsInventory** as you notice new parts

---

## 🧪 Testing Checklist

**Database Connection:**
- [ ] Supabase tables created
- [ ] RLS policies active
- [ ] User authenticated
- [ ] Can read/write data

**Component Rendering:**
- [ ] No console errors
- [ ] UI looks correct
- [ ] Navigation works
- [ ] Progress bars accurate

**Data Persistence:**
- [ ] Data saves to Supabase
- [ ] Data loads on revisit
- [ ] User can only see their data
- [ ] Updates work correctly

---

## 🐛 Common Issues & Fixes

### "Could not save data"
**Problem:** Database connection or RLS policy issue
**Fix:**
1. Check Supabase is connected
2. Verify user is authenticated
3. Check RLS policies are enabled
4. Test query in Supabase SQL editor

### "Component not found"
**Problem:** Import path wrong
**Fix:** Verify path is correct:
```javascript
import IFSPartsInventory from './components/IFSPartsInventory';
// or
import IFSPartsInventory from '../components/IFSPartsInventory';
```

### "Permission denied"
**Problem:** RLS policy blocking access
**Fix:**
1. Check user is authenticated
2. Verify auth.uid() matches user_id in policy
3. Re-run SQL file to recreate policies

---

## 📚 Documentation Files

**Quick Reference (this file):**
- `QUICK_START.md` ← You are here

**Complete Implementation Guide:**
- `INTEGRATION_FEATURES_GUIDE.md` (detailed docs)

**Summary:**
- `IMPLEMENTATION_SUMMARY.md` (overview + next steps)

**Source PDFs:**
- `IFS integration part.pdf`
- `Ketamine Integration Guide.pdf`

---

## 💡 Pro Tips

**For Development:**
- Test one component at a time
- Use React DevTools to debug
- Check Network tab for API calls
- Console.log the data to verify structure

**For Users:**
- Make components easy to find
- Provide gentle reminders (not pushy)
- Allow skipping (never force)
- Explain the "why" (education)

**For Data:**
- Auto-save frequently (prevent loss)
- Show loading states (user feedback)
- Handle errors gracefully (try/catch)
- Allow data export (future feature)

---

## 🎨 UI Patterns Used

All components follow these patterns:

**Header:**
- Close/back button (top-left)
- Title + step counter (top-right)
- Progress bar (below header)

**Content:**
- ScrollView (for long content)
- Centered emojis (visual appeal)
- Clear section titles (hierarchy)
- Helper text (context)

**Footer:**
- Back button (left)
- Next/Complete button (right)
- Loading states (when saving)

**Colors:**
- Purple (#a855f7) - spiritual/transformation
- Green (#10b981) - growth/healing
- Blue (#3b82f6) - clarity/insight
- Amber (#f59e0b) - awareness/attention
- Red (#dc2626) - intensity/activation

---

## 🔧 Code Examples

### Basic Usage
```javascript
import DailyGlimmersPractice from './components/DailyGlimmersPractice';

function HomeScreen() {
  return (
    <DailyGlimmersPractice
      onComplete={(data) => {
        console.log('Glimmers captured:', data.glimmers);
      }}
      onSkip={() => {
        console.log('User skipped');
      }}
    />
  );
}
```

### With State Management
```javascript
const [showComponent, setShowComponent] = useState(false);
const [completedData, setCompletedData] = useState(null);

return (
  <View>
    <Button onPress={() => setShowComponent(true)}>
      Start Practice
    </Button>

    {showComponent && (
      <IFSPartsInventory
        onComplete={(data) => {
          setCompletedData(data);
          setShowComponent(false);
          // Navigate or show success
        }}
        onSkip={() => setShowComponent(false)}
      />
    )}
  </View>
);
```

### With Session Linking
```javascript
<PostSessionIntegrationJournal
  sessionId={currentSession.id}
  onComplete={(journalData) => {
    // Link journal to session
    updateSession(currentSession.id, {
      journal_id: journalData.id,
      integrated: true
    });
  }}
/>
```

---

## 📊 Data Structures

**IFS Parts:**
```javascript
{
  managers: ['Achiever', 'People Pleaser'],
  firefighters: ['Escape Artist'],
  exiles: ['Hurt Child', 'Creative One']
}
```

**Daily Glimmers:**
```javascript
{
  glimmer_text: 'Morning coffee in quiet',
  context: 'Before work at home',
  created_at: '2025-10-28T10:00:00Z'
}
```

**Baseline:**
```javascript
{
  sleep: { sleep_quality: 7, sleep_hours: '7-8', ... },
  energy: { energy_level: 6, ... },
  mood: { overall_mood: 5, ... }
}
```

**Intentions:**
```javascript
{
  goals: ['Feel less anxious', 'Heal trauma'],
  intentions: ['Be open', 'Meet myself with compassion'],
  openness: 'I am willing to...',
  surrender: 'I will practice letting go...'
}
```

---

## ✅ Success Checklist

You're done when:

- [x] All 5 database tables created
- [x] All 5 components working
- [x] Data saves to Supabase
- [x] Data loads on revisit
- [x] Users can complete flows
- [x] Navigation makes sense
- [x] No console errors
- [x] Users find value

---

## 🚦 Priority Order

If time is limited, implement in this order:

**Priority 1 (Core Integration):**
1. ✅ Daily Glimmers Practice (daily habit)
2. ✅ Post-Session Integration Journal (core feature)

**Priority 2 (Preparation):**
3. ✅ Intention Setting (pre-session)
4. ✅ Pre-Treatment Baseline (progress tracking)

**Priority 3 (Deep Work):**
5. ✅ IFS Parts Inventory (self-awareness)

---

## 🎓 Learning Resources

**IFS (Internal Family Systems):**
- Book: "No Bad Parts" by Richard Schwartz
- Website: ifs-institute.com

**Polyvagal Theory:**
- Book: "The Polyvagal Theory" by Stephen Porges
- Book: "Anchored" by Deb Dana (Glimmers)

**Integration:**
- Book: "The Psychedelic Explorer's Guide" by James Fadiman
- Website: MAPS.org (research)

---

## 🤝 Support

**For technical questions:**
- Check `INTEGRATION_FEATURES_GUIDE.md`
- Review component source code
- Check Supabase docs

**For content questions:**
- Review original PDFs
- Research IFS and polyvagal theory
- Consult integration literature

**For user questions:**
- Provide in-app guidance
- Add tooltips and helpers
- Consider onboarding flow

---

## 🎉 You're Ready!

Everything is built and documented. Just:

1. Run the SQL scripts
2. Import a component
3. Test the flow
4. Integrate into your app

**Time to implementation:** 1-2 hours for basic setup, 1-2 days for full integration.

**Questions?** Check the full documentation in `INTEGRATION_FEATURES_GUIDE.md`

Happy integrating! 🌈✨
