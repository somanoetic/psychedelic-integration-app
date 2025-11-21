# Psychedelic Integration App - Figma Design System

## Overview
This guide provides a complete design system for creating high-fidelity mockups in Figma for the Psychedelic Integration App. The design follows the "Noesis" aesthetic - calm, contemplative, and grounded.

## Design Tokens

### Color Palette

#### Primary Colors
- **Deep Indigo**: `#1a1a2e` - Primary background
- **Soft Lavender**: `#9d84b7` - Primary accent
- **Warm Cream**: `#f4f1de` - Text on dark backgrounds
- **Muted Sage**: `#8b9a8b` - Secondary accent

#### Semantic Colors
- **Success Green**: `#6b8e6b` - Completions, positive states
- **Warning Amber**: `#d4a574` - Cautions, important notices
- **Error Red**: `#c17b7b` - Errors, destructive actions
- **Info Blue**: `#7b8fb8` - Information, neutral states

#### Background Layers
- **Level 0 (Base)**: `#1a1a2e`
- **Level 1 (Cards)**: `#252542`
- **Level 2 (Elevated)**: `#303050`
- **Level 3 (Modal)**: `#3a3a60`

#### Text Colors
- **Primary Text**: `#f4f1de` (90% opacity)
- **Secondary Text**: `#f4f1de` (70% opacity)
- **Tertiary Text**: `#f4f1de` (50% opacity)
- **Disabled Text**: `#f4f1de` (30% opacity)

### Typography

#### Font Family
- **Primary**: SF Pro Display (iOS) / Roboto (Android)
- **Fallback**: System Default

#### Text Styles

**Display Large**
- Size: 57px
- Weight: Regular (400)
- Line Height: 64px
- Use: App title, major headings

**Display Medium**
- Size: 45px
- Weight: Regular (400)
- Line Height: 52px
- Use: Section titles

**Display Small**
- Size: 36px
- Weight: Regular (400)
- Line Height: 44px
- Use: Screen titles

**Headline Large**
- Size: 32px
- Weight: Regular (400)
- Line Height: 40px
- Use: Prominent headings

**Headline Medium**
- Size: 28px
- Weight: Regular (400)
- Line Height: 36px
- Use: Card titles, section headers

**Headline Small**
- Size: 24px
- Weight: Regular (400)
- Line Height: 32px
- Use: Subsection headers

**Title Large**
- Size: 22px
- Weight: Medium (500)
- Line Height: 28px
- Use: List items, important labels

**Title Medium**
- Size: 16px
- Weight: Medium (500)
- Line Height: 24px
- Letter Spacing: 0.15px
- Use: Button text, tabs

**Title Small**
- Size: 14px
- Weight: Medium (500)
- Line Height: 20px
- Letter Spacing: 0.1px
- Use: Small buttons, chips

**Body Large**
- Size: 16px
- Weight: Regular (400)
- Line Height: 24px
- Letter Spacing: 0.5px
- Use: Main content text

**Body Medium**
- Size: 14px
- Weight: Regular (400)
- Line Height: 20px
- Letter Spacing: 0.25px
- Use: Secondary content, descriptions

**Body Small**
- Size: 12px
- Weight: Regular (400)
- Line Height: 16px
- Letter Spacing: 0.4px
- Use: Captions, helper text

**Label Large**
- Size: 14px
- Weight: Medium (500)
- Line Height: 20px
- Letter Spacing: 0.1px
- Use: Input labels, emphasized text

**Label Medium**
- Size: 12px
- Weight: Medium (500)
- Line Height: 16px
- Letter Spacing: 0.5px
- Use: Small labels, metadata

**Label Small**
- Size: 11px
- Weight: Medium (500)
- Line Height: 16px
- Letter Spacing: 0.5px
- Use: Timestamps, tiny labels

### Spacing System

Use an 8-point grid system:
- **XXS**: 4px
- **XS**: 8px
- **S**: 12px
- **M**: 16px
- **L**: 24px
- **XL**: 32px
- **XXL**: 48px
- **XXXL**: 64px

### Border Radius

- **Small**: 8px - Buttons, chips
- **Medium**: 12px - Cards, inputs
- **Large**: 16px - Modals, containers
- **XLarge**: 24px - Major containers
- **Round**: 999px - Pills, avatars

### Shadows

**Elevation 1** (Cards on background)
```
y: 2px, blur: 4px, color: #000000 20% opacity
```

**Elevation 2** (Floating elements)
```
y: 4px, blur: 8px, color: #000000 25% opacity
```

**Elevation 3** (Modals, overlays)
```
y: 8px, blur: 16px, color: #000000 30% opacity
```

## Component Library

### Buttons

#### Primary Button
- Background: `#9d84b7` (Soft Lavender)
- Text: `#1a1a2e` (Deep Indigo)
- Height: 48px
- Padding: 16px horizontal
- Border Radius: 8px
- Font: Title Medium
- States:
  - Hover: Background 10% lighter
  - Pressed: Background 10% darker
  - Disabled: 40% opacity

#### Secondary Button
- Background: `#303050` (Level 2)
- Text: `#f4f1de` (Warm Cream)
- Border: 1px solid `#9d84b7` 40% opacity
- Height: 48px
- Padding: 16px horizontal
- Border Radius: 8px
- Font: Title Medium

#### Text Button
- Background: Transparent
- Text: `#9d84b7` (Soft Lavender)
- Height: 48px
- Padding: 16px horizontal
- Font: Title Medium

### Input Fields

#### Text Input
- Background: `#252542` (Level 1)
- Border: 1px solid `#f4f1de` 20% opacity
- Border Radius: 12px
- Height: 56px
- Padding: 16px
- Font: Body Large
- Label: Label Large, positioned above input
- States:
  - Focus: Border color `#9d84b7` 100% opacity
  - Error: Border color `#c17b7b`
  - Disabled: 50% opacity

#### Text Area
- Same as Text Input
- Min Height: 120px
- Multi-line

### Cards

#### Base Card
- Background: `#252542` (Level 1)
- Border Radius: 12px
- Padding: 20px
- Shadow: Elevation 1

#### Interactive Card
- Same as Base Card
- States:
  - Hover: Background `#2a2a48`
  - Pressed: Background `#222238`

#### Status Card
- Same as Base Card
- Left border: 4px solid (color varies by status)
  - Active: `#9d84b7`
  - Complete: `#6b8e6b`
  - Warning: `#d4a574`

### Navigation

#### Tab Bar (Bottom)
- Background: `#252542` (Level 1)
- Height: 72px
- Border Top: 1px solid `#f4f1de` 10% opacity
- Icons: 24x24px
- Label: Label Small
- Active State: `#9d84b7`
- Inactive State: `#f4f1de` 50% opacity

#### Top Navigation Bar
- Background: `#1a1a2e` (Level 0)
- Height: 56px + safe area
- Title: Headline Small
- Icons: 24x24px
- Border Bottom: 1px solid `#f4f1de` 10% opacity

### Lists

#### List Item
- Height: 64px minimum
- Padding: 16px
- Border Bottom: 1px solid `#f4f1de` 10% opacity
- Content:
  - Title: Title Large
  - Subtitle: Body Medium, 70% opacity
  - Icon/Avatar: 40x40px
  - Right Content: Label Medium

### Modals & Bottom Sheets

#### Modal
- Background: `#3a3a60` (Level 3)
- Border Radius: 16px (top corners)
- Padding: 24px
- Shadow: Elevation 3
- Max Width: 90% of screen
- Backdrop: `#000000` 50% opacity

#### Bottom Sheet
- Same as Modal
- Slides up from bottom
- Drag handle: 32px wide, 4px tall, rounded, centered at top

### Progress Indicators

#### Linear Progress Bar
- Height: 4px
- Border Radius: 2px
- Background: `#f4f1de` 20% opacity
- Fill: `#9d84b7`

#### Circular Progress
- Size: 40px
- Stroke Width: 4px
- Color: `#9d84b7`

### Icons

- Size: 24x24px standard
- Style: Outlined (preferred) or Filled
- Color: Inherits from parent text color
- Library: Material Icons or SF Symbols

## Screen Templates

### 1. Home Screen (Dashboard)

**Layout:**
```
┌────────────────────────────┐
│ Top Bar (56px)             │
│ [Profile] Home    [•••]    │
├────────────────────────────┤
│                            │
│ [Welcome Card]             │
│ Good evening, [Name]       │
│ Last session: 3 days ago   │
│                            │
│ [Quick Actions Grid]       │
│ ┌──────┐ ┌──────┐         │
│ │ New  │ │ View │         │
│ │ Entry│ │ All  │         │
│ └──────┘ └──────┘         │
│ ┌──────┐ ┌──────┐         │
│ │ Prac │ │ Edu  │         │
│ │ tice │ │ cate │         │
│ └──────┘ └──────┘         │
│                            │
│ [Recent Entries]           │
│ • Entry 1                  │
│ • Entry 2                  │
│ • Entry 3                  │
│                            │
│ [Integration Progress]     │
│ ████░░░░ 40%              │
│                            │
├────────────────────────────┤
│ Tab Bar (72px)             │
│ [Home] [Journey] [Practice]│
└────────────────────────────┘
```

**Components:**
- Status bar with safe area
- Top navigation with profile avatar and menu
- Welcome card with personalized greeting
- 2x2 grid of action cards
- Scrollable list of recent entries
- Progress visualization
- Bottom tab navigation

### 2. Journal Entry Screen

**Layout:**
```
┌────────────────────────────┐
│ [<] New Entry        [✓]   │
├────────────────────────────┤
│                            │
│ Session Details            │
│ ┌────────────────────────┐ │
│ │ Date: [Oct 19, 2025] │ │
│ │ Substance: [Select]   │ │
│ │ Setting: [Select]     │ │
│ └────────────────────────┘ │
│                            │
│ Experience                 │
│ ┌────────────────────────┐ │
│ │                        │ │
│ │ Describe your          │ │
│ │ experience...          │ │
│ │                        │ │
│ │                        │ │
│ └────────────────────────┘ │
│                            │
│ Insights                   │
│ ┌────────────────────────┐ │
│ │ What did you learn?    │ │
│ └────────────────────────┘ │
│                            │
│ Integration Goals          │
│ ┌────────────────────────┐ │
│ │ + Add Goal             │ │
│ └────────────────────────┘ │
│                            │
└────────────────────────────┘
```

**Components:**
- Back button and save button in header
- Section headers (Headline Small)
- Dropdown selectors
- Multi-line text areas
- Action button to add goals
- Scrollable content area

### 3. Practice Screen (Somatic/Breathwork)

**Layout:**
```
┌────────────────────────────┐
│ [<] Box Breathing          │
├────────────────────────────┤
│                            │
│      ┌────────────┐        │
│      │            │        │
│      │            │        │
│      │   Inhale   │        │
│      │     4      │        │
│      │            │        │
│      │            │        │
│      └────────────┘        │
│                            │
│ ┌────────────────────────┐ │
│ │ ████████░░░░░░░░  45% │ │
│ └────────────────────────┘ │
│                            │
│      [Start] or [Pause]    │
│                            │
│ Instructions:              │
│ • Inhale for 4 seconds     │
│ • Hold for 4 seconds       │
│ • Exhale for 4 seconds     │
│ • Hold for 4 seconds       │
│                            │
└────────────────────────────┘
```

**Components:**
- Large centered visualization area
- Animated breathing indicator
- Progress bar
- Large primary action button
- Instruction text in expandable section

### 4. Session Preparation Screen

**Layout:**
```
┌────────────────────────────┐
│ [<] Session Preparation    │
├────────────────────────────┤
│                            │
│ Preparation Checklist      │
│                            │
│ 🧘 Somatic Grounding       │
│ ┌────────────────────────┐ │
│ │ [5 min practice]  →    │ │
│ └────────────────────────┘ │
│                            │
│ 🎯 Intention Setting       │
│ ┌────────────────────────┐ │
│ │ [Set intention]    →   │ │
│ └────────────────────────┘ │
│                            │
│ 📝 Safety Planning         │
│ ┌────────────────────────┐ │
│ │ [Review plan]      →   │ │
│ └────────────────────────┘ │
│                            │
│ 🌟 Parts Check-in          │
│ ┌────────────────────────┐ │
│ │ [IFS meditation]   →   │ │
│ └────────────────────────┘ │
│                            │
│ Progress: ████░░░░ 50%    │
│                            │
│     [Begin Session]        │
│                            │
└────────────────────────────┘
```

**Components:**
- Section headers with emoji/icons
- Interactive cards with completion states
- Progress indicator
- Primary CTA button at bottom
- Checkmarks appear when sections complete

### 5. Education Screen

**Layout:**
```
┌────────────────────────────┐
│ [<] Education         [🔍] │
├────────────────────────────┤
│                            │
│ Topics                     │
│                            │
│ ┌────────────────────────┐ │
│ │ 🧠 Neuroscience        │ │
│ │ Understanding how      │ │
│ │ psychedelics work...   │ │
│ │                   →    │ │
│ └────────────────────────┘ │
│                            │
│ ┌────────────────────────┐ │
│ │ 🎭 Parts Work (IFS)    │ │
│ │ Internal Family        │ │
│ │ Systems basics...      │ │
│ │                   →    │ │
│ └────────────────────────┘ │
│                            │
│ ┌────────────────────────┐ │
│ │ 🌊 Polyvagal Theory   │ │
│ │ Nervous system         │ │
│ │ regulation...          │ │
│ │                   →    │ │
│ └────────────────────────┘ │
│                            │
└────────────────────────────┘
```

**Components:**
- Search icon in header
- Category cards with icons
- Preview text for each topic
- Right arrow indicating navigation
- Scrollable vertical list

### 6. Profile/Settings Screen

**Layout:**
```
┌────────────────────────────┐
│ [<] Profile                │
├────────────────────────────┤
│                            │
│       ┌─────────┐          │
│       │  👤     │          │
│       │  [JD]   │          │
│       └─────────┘          │
│                            │
│     John Doe               │
│     john@example.com       │
│                            │
│ ┌────────────────────────┐ │
│ │ Personal Info      →   │ │
│ │ Preferences        →   │ │
│ │ Notifications      →   │ │
│ │ Privacy & Security →   │ │
│ │ Data & Storage     →   │ │
│ └────────────────────────┘ │
│                            │
│ ┌────────────────────────┐ │
│ │ Help & Support     →   │ │
│ │ About              →   │ │
│ └────────────────────────┘ │
│                            │
│     [Sign Out]             │
│                            │
└────────────────────────────┘
```

**Components:**
- Centered profile avatar
- User name and email
- Grouped settings lists
- Destructive action button (sign out)

## Component States

### Interactive States
All interactive components should have these states designed:

1. **Default**: Normal appearance
2. **Hover**: Subtle highlight (web/tablet)
3. **Pressed**: Visual feedback on touch
4. **Focused**: Keyboard navigation indicator
5. **Disabled**: 40% opacity, no interaction
6. **Loading**: Spinner or skeleton screen

### Form States
Form inputs need these states:

1. **Empty**: Placeholder visible
2. **Filled**: User content displayed
3. **Focus**: Active input
4. **Error**: Red border, error message below
5. **Success**: Green checkmark
6. **Disabled**: Greyed out

## Accessibility

### Touch Targets
- Minimum size: 44x44px
- Recommended: 48x48px
- Spacing between: 8px minimum

### Contrast Ratios
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- Interactive elements: 3:1 minimum

### Text Sizing
- Support dynamic type (iOS) / font scaling (Android)
- Design at 1x, 1.5x, 2x scales
- Never disable scaling

## Animation Guidelines

### Timing
- Quick: 100-150ms (micro-interactions)
- Standard: 200-300ms (transitions)
- Slow: 400-500ms (major transitions)

### Easing
- **Entrance**: Ease-out (deceleration)
- **Exit**: Ease-in (acceleration)
- **Movement**: Ease-in-out (smooth)

### Types
- **Fade**: Opacity changes
- **Slide**: Position changes with fade
- **Scale**: Size changes (subtle, 95-100%)
- **Morph**: Shape transitions

## Responsive Design

### Breakpoints
- Small phones: 320-375px
- Standard phones: 375-428px
- Large phones: 428-768px
- Tablets: 768-1024px
- Desktop: 1024px+

### Layout Adaptations
- **Mobile**: Single column, stack elements
- **Tablet**: Consider 2-column layouts
- **Desktop**: Max width 1280px, centered

## Figma Setup Checklist

### 1. Create Color Styles
- [ ] Create all background layer colors
- [ ] Create all text colors with opacity variants
- [ ] Create all semantic colors
- [ ] Create gradient styles if needed

### 2. Create Text Styles
- [ ] Create all typography styles listed above
- [ ] Set up proper line heights and letter spacing
- [ ] Configure responsive text scaling

### 3. Create Component Library
- [ ] Buttons (all variants and states)
- [ ] Input fields (all types and states)
- [ ] Cards (all variants)
- [ ] Navigation (tab bar, top bar)
- [ ] Lists and list items
- [ ] Modals and sheets
- [ ] Progress indicators
- [ ] Icons

### 4. Create Layout Grids
- [ ] Set up 8px grid system
- [ ] Create mobile frame (390x844 - iPhone 12 Pro)
- [ ] Create tablet frame if needed
- [ ] Add safe area guides

### 5. Build Screen Templates
- [ ] Home/Dashboard
- [ ] Journal Entry
- [ ] Practice/Breathwork
- [ ] Session Preparation
- [ ] Education
- [ ] Profile/Settings

### 6. Design Interactive Flows
- [ ] Onboarding flow
- [ ] Journal creation flow
- [ ] Session preparation flow
- [ ] Practice session flow

## Export Settings

### For Development
- Format: PNG or SVG
- Scale: @1x, @2x, @3x (iOS) / mdpi, xhdpi, xxhdpi (Android)
- Color space: sRGB

### For Icons
- Format: SVG
- Size: 24x24px base
- Stroke: 2px
- Caps: Round

## Implementation Notes

### Converting to React Native

#### Colors
```javascript
const colors = {
  background: {
    level0: '#1a1a2e',
    level1: '#252542',
    level2: '#303050',
    level3: '#3a3a60',
  },
  primary: {
    lavender: '#9d84b7',
    cream: '#f4f1de',
    sage: '#8b9a8b',
  },
  semantic: {
    success: '#6b8e6b',
    warning: '#d4a574',
    error: '#c17b7b',
    info: '#7b8fb8',
  },
};
```

#### Typography
```javascript
const typography = {
  displayLarge: {
    fontSize: 57,
    lineHeight: 64,
    fontWeight: '400',
  },
  titleMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
    letterSpacing: 0.15,
  },
  // ... etc
};
```

#### Spacing
```javascript
const spacing = {
  xxs: 4,
  xs: 8,
  s: 12,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};
```

## Resources

### Figma Plugins to Use
- **Stark**: Accessibility checking
- **Color Blind**: Test color contrast
- **Content Reel**: Generate realistic content
- **Iconify**: Access to icon libraries
- **Auto Layout**: Structure responsive designs

### Reference Materials
- Material Design 3 Guidelines
- iOS Human Interface Guidelines
- React Native Paper components
- Expo documentation

## Next Steps

1. **Create Figma Account** (if needed)
2. **Set up Design File** with all tokens and components
3. **Design Key Screens** (start with Home and Journal Entry)
4. **Get Feedback** from stakeholders
5. **Iterate** on designs
6. **Hand off to Development** with proper specs and assets

---

## Questions to Consider

Before starting your Figma work, consider:

1. **Branding**: Do you have a logo? App icon design?
2. **Imagery**: Will you use photos, illustrations, or abstract shapes?
3. **Animations**: Which interactions need special animation attention?
4. **Accessibility**: Any specific accessibility requirements?
5. **Platforms**: iOS only, Android only, or both?

This design system provides a solid foundation for creating beautiful, consistent, and implementable designs for your psychedelic integration app.
