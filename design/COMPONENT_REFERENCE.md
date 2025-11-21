# Component Visual Reference

Quick visual reference for all components in the design system. Use this as a guide when building in Figma.

## Buttons

### Primary Button
```
┌────────────────────────────┐
│      Continue Journey      │  ← #9d84b7 background
└────────────────────────────┘     #1a1a2e text
 48px height, 8px radius           Title/Medium font
```

### Secondary Button
```
┌────────────────────────────┐
│      View All Entries      │  ← #303050 background
└────────────────────────────┘     #f4f1de text
 48px height, 8px radius           1px border #9d84b7 40%
```

### Text Button
```
  Learn More →                   ← #9d84b7 text
  Transparent background            Title/Medium font
```

## Input Fields

### Text Input (Empty)
```
┌────────────────────────────────────┐
│ Enter your name...                 │  ← #252542 background
└────────────────────────────────────┘     #f4f1de 50% placeholder
  56px height, 12px radius                 1px border #f4f1de 20%
  16px padding
```

### Text Input (Focused)
```
┌────────────────────────────────────┐
│ John Doe▊                          │  ← Border: #9d84b7
└────────────────────────────────────┘
```

### Text Input (Error)
```
┌────────────────────────────────────┐
│ jdoe                               │  ← Border: #c17b7b
└────────────────────────────────────┘
  ⚠ Username must be at least 5 characters
```

### Text Area
```
┌────────────────────────────────────┐
│ Describe your experience...        │
│                                    │
│                                    │
│                                    │  ← 120px min height
│                                    │     12px radius
│                                    │     16px padding
└────────────────────────────────────┘
```

## Cards

### Base Card
```
┌──────────────────────────────────────┐
│                                      │
│  Card Title                          │  ← #252542 background
│  This is the card content area.      │     12px radius
│  It can contain any type of content. │     20px padding
│                                      │     Shadow: Elevation 1
└──────────────────────────────────────┘
```

### Interactive Card
```
┌──────────────────────────────────────┐
│  📝                                  │
│  Journal Entry                       │  ← Same as base
│  Tap to record your insights     →   │     Hover: #2a2a48
│                                      │     Press: #222238
└──────────────────────────────────────┘
```

### Status Card - Active
```
┃┌─────────────────────────────────────┐
┃│  Integration Practice               │  ← 4px left border
┃│  In Progress                        │     #9d84b7 color
┃│  Last updated: 2 hours ago          │
┃└─────────────────────────────────────┘
```

### Status Card - Complete
```
┃┌─────────────────────────────────────┐
┃│  Morning Meditation                 │  ← 4px left border
┃│  ✓ Completed                        │     #6b8e6b color
┃│  Completed today at 7:30 AM         │
┃└─────────────────────────────────────┘
```

### Status Card - Warning
```
┃┌─────────────────────────────────────┐
┃│  Session Preparation                │  ← 4px left border
┃│  ⚠ Attention Required               │     #d4a574 color
┃│  Complete safety checklist          │
┃└─────────────────────────────────────┘
```

## Navigation

### Tab Bar
```
┌────────────────────────────────────────┐
│                                        │
│  🏠       🌟        🧘       👤        │  ← 24x24 icons
│ Home   Journey  Practice  Profile     │     Label/Small
│  ●                                     │     Active: #9d84b7
│                                        │     Inactive: #f4f1de 50%
└────────────────────────────────────────┘
  72px height, border-top 1px #f4f1de 10%
  Background: #252542
```

### Top Navigation Bar
```
┌────────────────────────────────────────┐
│  ←    Journal Entry              ✓     │  ← 56px height
└────────────────────────────────────────┘     Background: #1a1a2e
  24x24 icons, Headline/Small title            Border-bottom 1px
```

### Top Bar with Menu
```
┌────────────────────────────────────────┐
│  👤    Home                        ⋯    │
└────────────────────────────────────────┘
```

## Lists

### Basic List Item
```
┌────────────────────────────────────────┐
│  ┌────┐  Morning Session               │  ← 64px min height
│  │ 📝 │  Oct 19, 2025 · Meditation     │     16px padding
│  └────┘                                │     Icon: 40x40
└────────────────────────────────────────┘     Border-bottom 1px
  Title: Title/Large
  Subtitle: Body/Medium 70%
```

### List Item with Badge
```
┌────────────────────────────────────────┐
│  ┌────┐  Integration Practice      🔔  │
│  │ 🧘 │  Daily breathwork · 5 min       │
│  └────┘                                │
└────────────────────────────────────────┘
```

### List Item with Right Content
```
┌────────────────────────────────────────┐
│  ┌────┐  Core Beliefs Work      75%    │
│  │ 🎯 │  In progress                    │
│  └────┘                                │
└────────────────────────────────────────┘
```

### Expandable List Item
```
┌────────────────────────────────────────┐
│  ▼  Session Preparation                │
│     • Somatic grounding                │
│     • Intention setting                │
│     • Safety planning                  │
└────────────────────────────────────────┘
```

## Modals & Overlays

### Standard Modal
```
        Background overlay: #000000 50%

    ┌──────────────────────────────┐
    │                              │
    │  Confirm Action              │  ← #3a3a60 background
    │                              │     16px radius
    │  Are you sure you want to    │     24px padding
    │  delete this entry? This     │     Shadow: Elevation 3
    │  cannot be undone.           │     Max width: 90%
    │                              │
    │  ┌──────────┐  ┌──────────┐ │
    │  │  Cancel  │  │  Delete  │ │
    │  └──────────┘  └──────────┘ │
    │                              │
    └──────────────────────────────┘
```

### Bottom Sheet
```
┌────────────────────────────────────────┐
│                                        │
│        Content above                   │
│                                        │
├────────────────────────────────────────┤
│              ═════                     │  ← Drag handle
│                                        │     32px wide, 4px tall
│  Select Session Type                   │
│                                        │  ← #3a3a60 background
│  ○ Meditation                          │     16px top radius
│  ○ Breathwork                          │     24px padding
│  ○ Integration Practice                │     Slides from bottom
│  ○ Journaling                          │
│                                        │
│         [Confirm Selection]            │
│                                        │
└────────────────────────────────────────┘
```

### Action Sheet
```
┌────────────────────────────────────────┐
│  Edit Entry                            │
│  Share Entry                           │
│  Archive Entry                         │
│  ────────────────────────────          │
│  Delete Entry                          │  ← Destructive (red)
│  ────────────────────────────          │
│  Cancel                                │
└────────────────────────────────────────┘
```

## Progress Indicators

### Linear Progress Bar
```
Full width:
████████████░░░░░░░░░░░  45%
↑ #9d84b7    ↑ #f4f1de 20%
4px height, 2px radius
```

### Segmented Progress
```
Session Preparation:
████ ████ ░░░░ ░░░░  50%
 1    2    3    4
```

### Circular Progress (Small)
```
   ⟳      Loading...
  ◷○
  ○○
```

### Circular Progress (Large)
```
     ╱───╲
    ╱     ╲
   │   ◷   │  40%
    ╲     ╱
     ╲───╱
  #9d84b7, 4px stroke
```

## Form Elements

### Checkbox (Unchecked)
```
□  I agree to the terms and conditions
```

### Checkbox (Checked)
```
☑  I agree to the terms and conditions
```

### Radio Buttons
```
◉ Daily
○ Weekly
○ Monthly
```

### Toggle Switch (Off)
```
Experience Level:  ○──────
                   OFF
```

### Toggle Switch (On)
```
Notifications:  ────────●
                   ON
```

### Dropdown/Select
```
┌────────────────────────────────────┐
│ Select substance            ▼      │
└────────────────────────────────────┘
```

### Dropdown (Expanded)
```
┌────────────────────────────────────┐
│ Select substance            ▲      │
├────────────────────────────────────┤
│ ○ Psilocybin                       │
│ ○ LSD                              │
│ ○ MDMA                             │
│ ○ Cannabis                         │
│ ○ Other                            │
└────────────────────────────────────┘
```

### Slider
```
Volume:
├─────●────────────────┤
0                    100
Current: 25
```

### Date Picker
```
┌────────────────────────────────────┐
│ Oct 19, 2025            📅         │
└────────────────────────────────────┘
```

## Chips & Tags

### Basic Chip
```
┌──────────────┐
│  Meditation  │  ← #303050 background
└──────────────┘     8px radius, 8px padding
```

### Active Chip
```
┌──────────────┐
│  Journaling  │  ← #9d84b7 background
└──────────────┘     #1a1a2e text
```

### Chip with Close
```
┌──────────────┐
│  Tag Name  ✕ │
└──────────────┘
```

### Chip with Icon
```
┌──────────────┐
│  ✓ Complete  │
└──────────────┘
```

## Badges

### Notification Badge
```
  🔔
  ●3     ← Small red circle with number
```

### Status Badge
```
Active    ← Green background, white text
Pending   ← Yellow background, dark text
Complete  ← Blue background, white text
```

## Empty States

### No Content
```
┌────────────────────────────────────────┐
│                                        │
│                                        │
│              📝                        │
│                                        │
│         No entries yet                 │
│                                        │
│    Start your integration journey      │
│         by creating an entry           │
│                                        │
│        [Create First Entry]            │
│                                        │
│                                        │
└────────────────────────────────────────┘
```

### Error State
```
┌────────────────────────────────────────┐
│                                        │
│              ⚠                         │
│                                        │
│      Something went wrong              │
│                                        │
│   We couldn't load your entries.       │
│   Please check your connection and     │
│   try again.                           │
│                                        │
│           [Try Again]                  │
│                                        │
└────────────────────────────────────────┘
```

### Loading State (Skeleton)
```
┌────────────────────────────────────────┐
│  ▭▭▭▭  ▭▭▭▭▭▭▭▭▭▭▭▭▭                 │
│        ▭▭▭▭▭▭▭▭▭                       │
│                                        │
│  ▭▭▭▭  ▭▭▭▭▭▭▭▭▭▭▭▭▭                 │
│        ▭▭▭▭▭▭▭▭▭                       │
│                                        │
│  ▭▭▭▭  ▭▭▭▭▭▭▭▭▭▭▭▭▭                 │
│        ▭▭▭▭▭▭▭▭▭                       │
└────────────────────────────────────────┘
  Animated shimmer effect: #f4f1de 10-20%
```

## Alerts & Toasts

### Success Toast
```
┌────────────────────────────────────┐
│  ✓  Entry saved successfully       │  ← #6b8e6b background
└────────────────────────────────────┘     Slides in from top
  Auto-dismiss after 3s
```

### Error Toast
```
┌────────────────────────────────────┐
│  ✕  Failed to save entry           │  ← #c17b7b background
└────────────────────────────────────┘     Stays until dismissed
```

### Info Toast
```
┌────────────────────────────────────┐
│  ℹ  New practice available         │  ← #7b8fb8 background
└────────────────────────────────────┘
```

### Inline Alert
```
┌────────────────────────────────────┐
│  ⚠ Warning                         │
│  This action cannot be undone.     │  ← #d4a574 background
│  Please review before continuing.  │     12px radius
└────────────────────────────────────┘     16px padding
```

## Avatars & Icons

### User Avatar (Small)
```
┌────┐
│ JD │  ← 40x40px, round
└────┘     Initials if no photo
```

### User Avatar (Medium)
```
┌──────┐
│      │  ← 64x64px, round
│  JD  │
│      │
└──────┘
```

### User Avatar (Large)
```
┌────────┐
│        │  ← 96x96px, round
│   JD   │
│        │
└────────┘
```

### Icon Sizes
```
Small:  ▢  16x16px
Medium: ▣  24x24px (standard)
Large:  ▦  32x32px
```

## Special Components

### Breathing Guide Visualization
```
┌────────────────────────────────────┐
│                                    │
│         ╭───────────╮              │
│        ╱             ╲             │
│       │               │            │
│       │    Inhale     │            │
│       │      4        │            │
│       │               │            │
│        ╲             ╱             │
│         ╰───────────╯              │
│                                    │
│      ████████░░░░░  60%           │
│                                    │
└────────────────────────────────────┘
  Animated pulsing circle
  #9d84b7 stroke, 4px
```

### Journey Timeline
```
┌────────────────────────────────────┐
│                                    │
│  Oct 15  ●─────○─────○             │
│          │                         │
│          First Session             │
│          "Profound insights..."    │
│                                    │
│  Oct 18        ●─────○             │
│                │                   │
│          Integration Practice      │
│          "Grounding work..."       │
│                                    │
│  Oct 19              ●             │
│                      │             │
│          Today - Check-in          │
│                                    │
└────────────────────────────────────┘
  ● Complete: #6b8e6b
  ○ Upcoming: #f4f1de 30%
```

### Mood Scale
```
How are you feeling?

😢  😕  😐  🙂  😊
│   │   │   │   │
1   2   3   4   5

        ▲
    (selected)
```

### Parts Wheel (IFS)
```
        ┌─────────┐
        │ Manager │
   ┌────┴────┬────┴────┐
   │Perfectionist│ Planner│
   └────┬────┴────┬────┘
        │  Self   │
   ┌────┴────┬────┴────┐
   │  Child  │ Protector│
   └────┬────┴────┬────┘
        │ Exile   │
        └─────────┘
```

## Accessibility Indicators

### Touch Target Minimum
```
┌──────────────┐
│              │
│    Button    │  ← 48x48px minimum
│              │     (44x44 absolute minimum)
└──────────────┘
```

### Focus State
```
┌────────────────────────────────────┐
║  Focused element                   ║  ← 2px outline
║                                    ║     #9d84b7
└────────────────────────────────────┘     2px offset
```

### Skip Links
```
[Skip to main content]  ← Visually hidden
                          Shows on focus
```

## Component Spacing Examples

### Vertical Stack (typical)
```
┌────────────────┐
│  Title         │
└────────────────┘
      12px ↕
┌────────────────┐
│  Description   │
└────────────────┘
      16px ↕
┌────────────────┐
│  [Button]      │
└────────────────┘
```

### Horizontal Group (buttons)
```
┌──────────┐  12px  ┌──────────┐
│  Cancel  │  ↔     │   Save   │
└──────────┘        └──────────┘
```

### Card Padding
```
┌────────────────────────────────┐
│ ↕ 20px                         │
│ → 20px  Content    20px ←      │
│                                │
│ ↕ 20px                         │
└────────────────────────────────┘
```

---

## Using This Reference

1. **In Figma**: Use these as visual guides when building components
2. **For Developers**: Reference for implementation details
3. **For Design QA**: Check if components match these specs

## Color Quick Reference

- Background Dark: `#1a1a2e`
- Background Card: `#252542`
- Primary Accent: `#9d84b7`
- Text Primary: `#f4f1de`
- Success: `#6b8e6b`
- Warning: `#d4a574`
- Error: `#c17b7b`
- Info: `#7b8fb8`

## Spacing Quick Reference

- XXS: 4px
- XS: 8px
- S: 12px
- M: 16px
- L: 24px
- XL: 32px
- XXL: 48px

---

This reference covers all major components. For detailed specifications, see [FIGMA_DESIGN_SYSTEM.md](FIGMA_DESIGN_SYSTEM.md).
