# User Flow Diagram - Integration Features in App

## 🌊 Complete User Journey Through the App

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: FIRST TIME USER - ONBOARDING                          │
└─────────────────────────────────────────────────────────────────┘

📱 App Opens
    │
    ├─> AuthScreen (if not logged in)
    │       │
    │       └─> User signs up/logs in
    │
    └─> OnboardingCarousel (first time only)
            │
            └─> Shows app intro slides
                    │
                    └─> Completes onboarding
                            │
                            ▼

┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: MAIN APP - HOME SCREEN                                │
└─────────────────────────────────────────────────────────────────┘

📱 ConversationalHomeScreen / OrganizedHomeScreen
    │
    ├─> 🔔 Daily Reminder Widget: "✨ Add Today's Glimmers"
    │       │
    │       └─> [Tap] Opens DailyGlimmersPractice
    │               │
    │               ├─> View education about glimmers
    │               ├─> See examples
    │               ├─> Add 1-3 glimmers with context
    │               └─> [Complete] → Returns to Home
    │
    ├─> "Start New Session" button
    │       │
    │       └─> Goes to Session Preparation flow (see below)
    │
    └─> "Learn" tab in bottom navigation
            │
            └─> Goes to Education Screen (see below)

┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: EDUCATION SCREEN                                       │
└─────────────────────────────────────────────────────────────────┘

📱 EducationScreen (from "Learn" tab)
    │
    └─> Shows education modules:
            │
            ├─> 📚 Nervous System Education (existing)
            │       └─> PolyvagalEducationWidget
            │
            ├─> 👥 Identify Your Parts (NEW!)
            │       │
            │       └─> [Tap] Opens IFSPartsInventory
            │               │
            │               ├─> Step 1: Introduction to IFS
            │               ├─> Step 2: Manager Parts (select which apply)
            │               │       • Achiever
            │               │       • People Pleaser
            │               │       • Controller
            │               │       • Caretaker
            │               │       • Strong One
            │               │       • Critic
            │               │       • Vigilant One
            │               │       [Add notes for each]
            │               │
            │               ├─> Step 3: Firefighter Parts (select which apply)
            │               │       • Rager
            │               │       • Escape Artist
            │               │       • Rebel
            │               │       • Chaos Creator
            │               │       • Indulger
            │               │       [Add notes for each]
            │               │
            │               ├─> Step 4: Exile Parts (select which apply)
            │               │       • Hurt Child
            │               │       • Scared One
            │               │       • Angry One
            │               │       • Sad One
            │               │       • Lonely One
            │               │       • Joyful One
            │               │       • Creative One
            │               │       • Wild One
            │               │       • Wise One
            │               │       [Add notes for each]
            │               │
            │               ├─> Step 5: Learn about Self (8 C's)
            │               │       • Curious
            │               │       • Compassionate
            │               │       • Calm
            │               │       • Connected
            │               │       • Courageous
            │               │       • Creative
            │               │       • Clarity
            │               │       • Confidence
            │               │
            │               └─> Step 6: Summary of identified parts
            │                       │
            │                       └─> [Complete] → Saves to database
            │                               │
            │                               └─> Returns to Education Screen
            │
            ├─> ⚡ Triggers & Glimmers Mapping (existing)
            │       └─> TriggersAndGlimmersWidget
            │
            └─> 💚 Regulating Resources (existing)
                    └─> RegulatingResourcesWidget

┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: SESSION PREPARATION FLOW                               │
└─────────────────────────────────────────────────────────────────┘

📱 PreparationScreen (from Home "Start Session")
    │
    └─> Shows preparation checklist:
            │
            ├─> 📊 Establish Baseline (first time / monthly)
            │       │
            │       └─> [Tap] Opens PreTreatmentBaselineLog
            │               │
            │               ├─> Step 1: Introduction
            │               │
            │               ├─> Step 2: Sleep Assessment
            │               │       • Rate quality (1-10 scale)
            │               │       • Average hours
            │               │       • Sleep patterns notes
            │               │
            │               ├─> Step 3: Energy & Vitality
            │               │       • Overall energy (1-10)
            │               │       • What drains you
            │               │       • What energizes you
            │               │
            │               ├─> Step 4: Mood & Emotions
            │               │       • Overall mood (1-10)
            │               │       • Predominant emotions
            │               │       • Emotional reactivity
            │               │
            │               ├─> Step 5: Relationships
            │               │       • Satisfaction (1-10)
            │               │       • Connection quality
            │               │       • Current challenges
            │               │
            │               ├─> Step 6: Work & Purpose
            │               │       • Satisfaction (1-10)
            │               │       • Sense of purpose
            │               │       • Work stress
            │               │
            │               ├─> Step 7: Self-Care & Health
            │               │       • Self-care rating (1-10)
            │               │       • Current practices
            │               │       • Physical health concerns
            │               │
            │               ├─> Step 8: Symptom Tracking
            │               │       • Anxiety level (1-10)
            │               │       • Depression level (1-10)
            │               │       • Other symptoms
            │               │
            │               └─> Step 9: Summary
            │                       │
            │                       └─> [Save Baseline] → Saves to database
            │                               │
            │                               └─> Returns to Preparation Screen
            │
            ├─> 🎯 Set Your Intention (every session)
            │       │
            │       └─> [Tap] Opens IntentionSetting
            │               │
            │               ├─> Step 1: Introduction
            │               │       "Setting intention for your session"
            │               │
            │               ├─> Step 2: Goals vs Intentions Education
            │               │       • Learn the difference
            │               │       • Goals = outcomes ("I want to heal")
            │               │       • Intentions = qualities ("I intend to be open")
            │               │
            │               ├─> Step 3: Name Your Goals
            │               │       [Enter goals one by one]
            │               │       Examples:
            │               │       • "I want to feel less anxious"
            │               │       • "I want to heal my trauma"
            │               │       • "I want answers"
            │               │       [Can add multiple, can remove]
            │               │
            │               ├─> Step 4: Transform Goals → Intentions
            │               │       Shows your goals
            │               │       Guidance:
            │               │       • "I want to feel less anxious"
            │               │       →  "I intend to be curious about my anxiety"
            │               │
            │               ├─> Step 5: Your Intentions
            │               │       [Enter intentions one by one]
            │               │       Examples:
            │               │       • "I intend to be open"
            │               │       • "I intend to meet myself with compassion"
            │               │       • "I intend to trust the process"
            │               │       [Can add multiple, can remove]
            │               │
            │               ├─> Step 6: Openness to Experience
            │               │       Reflection prompt:
            │               │       "Are you willing to experience whatever
            │               │        arises - even if not what you expected?"
            │               │       [Text area for reflection]
            │               │
            │               ├─> Step 7: Surrender & Trust
            │               │       Reflection prompt:
            │               │       "Can you practice letting go of control
            │               │        and trusting the process?"
            │               │       [Text area for reflection]
            │               │
            │               └─> Step 8: Summary
            │                       Shows all intentions
            │                       Blessing message
            │                       │
            │                       └─> [Complete] → Saves to database
            │                               │
            │                               └─> Returns to Preparation Screen
            │
            ├─> 👥 Review Your Parts (optional)
            │       └─> Shows previously identified IFS parts
            │
            └─> ✅ Ready for Session
                    │
                    └─> [Start Session] → Goes to Session Screen
                            │
                            └─> [During Session...]
                                    │
                                    └─> Session completes
                                            │
                                            └─> Goes to Post-Session flow

┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: POST-SESSION INTEGRATION                               │
└─────────────────────────────────────────────────────────────────┘

📱 SessionDetailScreen (after session completes)
    │
    └─> Shows session details
            │
            ├─> "Complete Integration Journal" button (if not done yet)
            │       │
            │       └─> [Tap] Opens PostSessionIntegrationJournal
            │               │
            │               ├─> Category 1: Session Information
            │               │       • Session date
            │               │       • Substance & dose (optional)
            │               │       • Setting description
            │               │       • Overall quality
            │               │
            │               ├─> Category 2: Visuals 👁️
            │               │       Prompts:
            │               │       • What did you see?
            │               │       • What colors stood out?
            │               │       • Shapes, patterns, geometric forms?
            │               │       • Landscapes or environments?
            │               │       • Any beings? Symbols?
            │               │       [Large text area]
            │               │
            │               ├─> Category 3: Movements & Impulses 💫
            │               │       Prompts:
            │               │       • Did your body want to move?
            │               │       • Spontaneous movements?
            │               │       • Position changes?
            │               │       • Rocking, swaying, flowing?
            │               │       [Large text area]
            │               │
            │               ├─> Category 4: Somatic Sensations 🫀
            │               │       Prompts:
            │               │       • Physical feelings in body?
            │               │       • Temperature changes?
            │               │       • Pressure or heaviness?
            │               │       • Pain or pleasure?
            │               │       • Energy movement?
            │               │       [Large text area]
            │               │
            │               ├─> Category 5: Emotions ❤️
            │               │       Prompts:
            │               │       • What emotions were present?
            │               │       • Did they shift or wave?
            │               │       • Simple or complex feelings?
            │               │       • Old emotions resurface?
            │               │       [Large text area]
            │               │
            │               ├─> Category 6: Relationships & Connection 🤝
            │               │       Prompts:
            │               │       • Did anyone appear?
            │               │       • Living or deceased?
            │               │       • How did you relate?
            │               │       • Shifts or healing?
            │               │       • Sense of being held?
            │               │       [Large text area]
            │               │
            │               ├─> Category 7: Nature Elements 🌿
            │               │       Prompts:
            │               │       • Water, earth, fire, air?
            │               │       • Plants or trees?
            │               │       • Animals or creatures?
            │               │       • What was their message?
            │               │       [Large text area]
            │               │
            │               ├─> Category 8: Textures 🧶
            │               │       Prompts:
            │               │       • What textures encountered?
            │               │       • Smooth, rough, soft, sharp?
            │               │       • Dense or light?
            │               │       • Flowing or sticky?
            │               │       [Large text area]
            │               │
            │               ├─> Category 9: Colors & Meaning 🎨
            │               │       Prompts:
            │               │       • What colors were prominent?
            │               │       • What did each feel like?
            │               │       • Emotional qualities?
            │               │       • Color shifts?
            │               │       [Large text area]
            │               │
            │               ├─> Category 10: Shapes & Patterns ⬡
            │               │       Prompts:
            │               │       • What shapes appeared?
            │               │       • Geometric or organic?
            │               │       • Repeating patterns?
            │               │       • Morphing shapes?
            │               │       [Large text area]
            │               │
            │               ├─> Category 11: Darkness / Void / Nothing 🌑
            │               │       Prompts:
            │               │       • Darkness or void experience?
            │               │       • Quality of emptiness?
            │               │       • Peaceful or scary?
            │               │       • Anything emerge from nothing?
            │               │       [Large text area]
            │               │
            │               ├─> Category 12: Realizations & Insights 💡
            │               │       Prompts:
            │               │       • Any realizations?
            │               │       • What did you understand?
            │               │       • Downloads of information?
            │               │       • Messages or guidance?
            │               │       [Large text area]
            │               │
            │               └─> Category 13: Integration Notes 🌈
            │                       Prompts:
            │                       • What stands out most?
            │                       • What wants to be integrated?
            │                       • What needs more attention?
            │                       • How has this changed you?
            │                       • Action steps?
            │                       [Large text area]
            │                       │
            │                       └─> [Save Journal] → Saves to database
            │                               │
            │                               └─> Returns to Session Detail
            │
            └─> "View Journal" (if already completed)
                    └─> Shows completed journal entries

┌─────────────────────────────────────────────────────────────────┐
│  STEP 6: DAILY INTEGRATION PRACTICE (Days 1-3 post-session)    │
└─────────────────────────────────────────────────────────────────┘

📱 Home Screen shows reminder:
    │
    └─> "🔔 Integration Window Active! Add glimmers 3x today"
            │
            └─> [Tap] Opens DailyGlimmersPractice
                    │
                    ├─> Shows: "X glimmers captured today"
                    ├─> Add new glimmers (quick entry)
                    └─> [Save] → Returns to Home
                            │
                            └─> Repeat 3+ times daily

┌─────────────────────────────────────────────────────────────────┐
│  STEP 7: VIEWING PROGRESS                                       │
└─────────────────────────────────────────────────────────────────┘

📱 AllSessionsScreen (from "Sessions" tab)
    │
    └─> Shows list of all sessions
            │
            └─> [Tap any session] → SessionDetailScreen
                    │
                    ├─> View session details
                    ├─> View integration journal
                    ├─> View intention that was set
                    ├─> Compare to baseline
                    └─> See glimmers during integration window
```

---

## 🎯 Quick Navigation Map

```
Bottom Tab Navigation:
├─> 🏠 Home Tab → ConversationalHomeScreen / OrganizedHomeScreen
│       ├─> Daily Glimmers widget → DailyGlimmersPractice
│       └─> Start Session button → PreparationScreen
│
├─> 📚 Learn Tab → EducationScreen
│       └─> IFS Parts module → IFSPartsInventory
│
└─> 📖 Sessions Tab → ConversationalAllSessions
        └─> [Tap session] → SessionDetailScreen
                └─> Integration Journal button → PostSessionIntegrationJournal

Stack Screens (Full Screen):
├─> PreparationScreen
│       ├─> Baseline button → PreTreatmentBaselineLog
│       └─> Intention button → IntentionSetting
│
└─> SessionDetailScreen
        └─> Journal button → PostSessionIntegrationJournal
```

---

## 📱 Screen Hierarchy

```
App.js (Root)
│
├─> MainTabs (Bottom Tabs - Always visible)
│   │
│   ├─> Tab 1: "Home"
│   │   └─> ConversationalHomeScreen.js
│   │       └─> Widget: DailyGlimmersPractice
│   │
│   ├─> Tab 2: "Learn"
│   │   └─> EducationScreen.js
│   │       └─> Module: IFSPartsInventory
│   │
│   └─> Tab 3: "Sessions"
│       └─> ConversationalAllSessions.js
│           └─> SessionDetailScreen.js
│               └─> PostSessionIntegrationJournal
│
└─> Stack Screens (Modals/Full Screen)
    │
    ├─> PreparationScreen.js
    │   ├─> PreTreatmentBaselineLog
    │   └─> IntentionSetting
    │
    └─> SessionPreparationScreen.js
        └─> IntentionSetting (alternative location)
```

---

## 🔄 Typical User Session Flow

### First-Time User (Day 1)
```
1. Sign up / Login
2. Onboarding slides
3. Go to "Learn" tab
4. Complete IFS Parts Inventory (15 min)
5. Add first glimmers on Home screen (5 min)
```

### Preparing for Session (Day 7)
```
1. Go to Preparation screen
2. Complete Baseline Log (20 min) [if first session]
3. Complete Intention Setting (10 min)
4. Add glimmers (5 min)
5. Ready for session!
```

### After Session (Same Day)
```
1. Mark session as complete
2. Rest and integrate
3. Add glimmers 3x throughout day
```

### Integration Period (Days 1-3)
```
1. Complete Integration Journal (30 min)
2. Add glimmers 3x daily
3. Rest, reflect, integrate
```

### Ongoing Practice (Daily)
```
1. Open app
2. Add daily glimmers (3-5 min)
3. Review past journals when needed
```

---

## 🎨 Visual Flow for App Navigation

```
┌─────────────────────────────────────────────────────────────────┐
│                     BOTTOM TAB BAR (Always Visible)             │
│  [🏠 Home]  [📚 Learn]  [📖 Sessions]                           │
└─────────────────────────────────────────────────────────────────┘
       │          │            │
       │          │            └──> ConversationalAllSessions
       │          │                     └─> [Tap] SessionDetailScreen
       │          │                              └─> PostSessionIntegrationJournal (modal)
       │          │
       │          └──> EducationScreen
       │                   └─> IFSPartsInventory (modal)
       │
       └──> ConversationalHomeScreen
                ├─> DailyGlimmersPractice (widget/modal)
                └─> [Start Session] → PreparationScreen (full screen)
                                          ├─> PreTreatmentBaselineLog (modal)
                                          └─> IntentionSetting (modal)
```

---

## ⏱️ Time Commitments

| Activity | Frequency | Time | When |
|----------|-----------|------|------|
| **IFS Parts Inventory** | Once / Periodic | 15 min | First time, then as needed |
| **Pre-Treatment Baseline** | First session / Monthly | 20 min | Before sessions |
| **Intention Setting** | Every session | 10 min | Before each session |
| **Daily Glimmers** | Daily (3x) | 3-5 min | Throughout day |
| **Post-Session Journal** | After each session | 30 min | Within 24-72 hours |
| **Daily Glimmers (Integration)** | 3x daily for 3 days | 15 min total | Post-session window |

---

## 🎯 Priority Order for Implementation

**Phase 1 (Core):**
1. Add IFSPartsInventory to EducationScreen
2. Add DailyGlimmersPractice to HomeScreen

**Phase 2 (Preparation):**
3. Add PreTreatmentBaselineLog to PreparationScreen
4. Add IntentionSetting to PreparationScreen

**Phase 3 (Integration):**
5. Add PostSessionIntegrationJournal to SessionDetailScreen

This flow shows exactly how users move through your app and where each component fits in their journey!