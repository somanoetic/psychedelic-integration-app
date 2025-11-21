# How to Use the Figma Starter Kit

This guide shows you how to set up your Figma file using the design tokens and components provided.

## Quick Start

### Option 1: Use a Plugin (Recommended)

1. **Install a Figma Plugin for Design Tokens:**
   - In Figma, go to Menu > Plugins > Browse plugins
   - Search for "Design Tokens" or "Tokens Studio"
   - Install **Tokens Studio for Figma** (formerly Figma Tokens)

2. **Import the JSON:**
   - Open Tokens Studio plugin
   - Click "Import" or "Load from JSON"
   - Select `figma-starter-kit.json`
   - All colors, typography, and spacing will be imported automatically

### Option 2: Manual Setup (Detailed Below)

If you prefer manual setup or want full control, follow these steps:

## Step 1: Create a New Figma File

1. Go to https://figma.com
2. Click "New design file"
3. Name it: "Psychedelic Integration App - Design System"

## Step 2: Set Up Color Styles

### Background Colors

1. Click the color picker anywhere
2. Click the "Style" icon (four circles)
3. Create new color styles:

```
Name: Background/Level 0
Hex: #1a1a2e
Description: Primary background - deep indigo

Name: Background/Level 1
Hex: #252542
Description: Cards and elevated surfaces

Name: Background/Level 2
Hex: #303050
Description: Elevated components

Name: Background/Level 3
Hex: #3a3a60
Description: Modals and highest elevation
```

### Primary Colors

```
Name: Primary/Lavender
Hex: #9d84b7
Description: Primary accent color

Name: Primary/Cream
Hex: #f4f1de
Description: Primary text color

Name: Primary/Sage
Hex: #8b9a8b
Description: Secondary accent
```

### Semantic Colors

```
Name: Semantic/Success
Hex: #6b8e6b

Name: Semantic/Warning
Hex: #d4a574

Name: Semantic/Error
Hex: #c17b7b

Name: Semantic/Info
Hex: #7b8fb8
```

### Text Colors (with opacity)

```
Name: Text/Primary
Hex: #f4f1de
Opacity: 90%

Name: Text/Secondary
Hex: #f4f1de
Opacity: 70%

Name: Text/Tertiary
Hex: #f4f1de
Opacity: 50%

Name: Text/Disabled
Hex: #f4f1de
Opacity: 30%
```

## Step 3: Set Up Text Styles

Select any text element, then click the text style icon and create these styles:

### Display Styles

```
Name: Display/Large
Font: SF Pro Display (or Roboto)
Size: 57px
Line Height: 64px
Weight: Regular (400)

Name: Display/Medium
Size: 45px
Line Height: 52px
Weight: Regular

Name: Display/Small
Size: 36px
Line Height: 44px
Weight: Regular
```

### Headline Styles

```
Name: Headline/Large
Size: 32px
Line Height: 40px
Weight: Regular

Name: Headline/Medium
Size: 28px
Line Height: 36px
Weight: Regular

Name: Headline/Small
Size: 24px
Line Height: 32px
Weight: Regular
```

### Title Styles

```
Name: Title/Large
Size: 22px
Line Height: 28px
Weight: Medium (500)

Name: Title/Medium
Size: 16px
Line Height: 24px
Weight: Medium
Letter Spacing: 0.15px

Name: Title/Small
Size: 14px
Line Height: 20px
Weight: Medium
Letter Spacing: 0.1px
```

### Body Styles

```
Name: Body/Large
Size: 16px
Line Height: 24px
Weight: Regular
Letter Spacing: 0.5px

Name: Body/Medium
Size: 14px
Line Height: 20px
Weight: Regular
Letter Spacing: 0.25px

Name: Body/Small
Size: 12px
Line Height: 16px
Weight: Regular
Letter Spacing: 0.4px
```

### Label Styles

```
Name: Label/Large
Size: 14px
Line Height: 20px
Weight: Medium
Letter Spacing: 0.1px

Name: Label/Medium
Size: 12px
Line Height: 16px
Weight: Medium
Letter Spacing: 0.5px

Name: Label/Small
Size: 11px
Line Height: 16px
Weight: Medium
Letter Spacing: 0.5px
```

## Step 4: Set Up Grid System

1. Create a new frame (F key)
2. Select frame size: iPhone 12 Pro (390x844)
3. Right-click frame > "Layout Grid"
4. Add these grids:

**8px Grid:**
- Type: Grid
- Size: 8
- Color: Red at 10% opacity

**Columns (for wider layouts):**
- Type: Columns
- Count: 4 (mobile) or 12 (desktop)
- Margin: 16px
- Gutter: 16px

**Safe Area Guides:**
- Add rectangle at top: 390x44 (status bar)
- Add rectangle at bottom: 390x34 (home indicator)
- Set to 10% opacity, lock layer

## Step 5: Create Component Library

Create a new page called "Components" and build these:

### Primary Button Component

1. Create rectangle: 200x48px
2. Fill: Primary/Lavender (#9d84b7)
3. Border Radius: 8px
4. Add text: "Button Label"
5. Text Style: Title/Medium
6. Text Color: Background/Level 0 (#1a1a2e)
7. Center text in button
8. Create component: Cmd/Ctrl + Alt + K
9. Name: "Button/Primary"

**Add Variants:**
1. Click component, click "+" to add variant
2. Create these states:
   - Default
   - Hover (lighten background 10%)
   - Pressed (darken background 10%)
   - Disabled (40% opacity)

### Text Input Component

1. Create rectangle: 328x56px
2. Fill: Background/Level 1 (#252542)
3. Stroke: 1px, Text/Tertiary
4. Border Radius: 12px
5. Add text inside: "Placeholder text"
6. Text Style: Body/Large
7. Text Color: Text/Tertiary
8. Padding: 16px on all sides
9. Create component: "Input/Text"

**Add Variants:**
- Empty
- Filled
- Focus (border: Primary/Lavender)
- Error (border: Semantic/Error)
- Disabled

### Card Component

1. Create rectangle: 358x200px
2. Fill: Background/Level 1 (#252542)
3. Border Radius: 12px
4. Add shadow: 0px 2px 4px rgba(0,0,0,0.2)
5. Add auto-layout (Shift + A)
6. Padding: 20px
7. Spacing: 12px
8. Create component: "Card/Base"

### List Item Component

1. Create frame: 358x64px
2. Add auto-layout
3. Padding: 16px
4. Spacing: 12px
5. Add circle (40x40) for avatar/icon
6. Add text stack:
   - Title: Title/Large
   - Subtitle: Body/Medium, Text/Secondary
7. Add stroke at bottom: 1px, Text/Tertiary
8. Create component: "List/Item"

## Step 6: Create Screen Templates

Create a new page called "Screens" and build these frames:

### Home Screen Template

1. Create frame: iPhone 12 Pro (390x844)
2. Fill: Background/Level 0
3. Add top navigation bar:
   - Frame: 390x56
   - Fill: Background/Level 0
   - Border bottom: 1px, Text/Tertiary
4. Add bottom tab bar:
   - Frame: 390x72
   - Fill: Background/Level 1
   - Border top: 1px, Text/Tertiary
5. Add scrollable content area between
6. Save as template

### Journal Entry Screen Template

1. Create frame: iPhone 12 Pro
2. Add navigation bar with back button and save
3. Add scroll view with sections
4. Use auto-layout for spacing
5. Save as template

## Step 7: Use Effect Styles for Shadows

1. Select any element
2. Click effects icon (star)
3. Add drop shadow
4. Create these effect styles:

```
Name: Shadow/Elevation 1
Type: Drop Shadow
X: 0, Y: 2, Blur: 4
Color: #000000 at 20%

Name: Shadow/Elevation 2
X: 0, Y: 4, Blur: 8
Color: #000000 at 25%

Name: Shadow/Elevation 3
X: 0, Y: 8, Blur: 16
Color: #000000 at 30%
```

## Step 8: Organize Your File

Create these pages in your Figma file:

1. **Cover** - Title page with project info
2. **Design Tokens** - Color swatches and typography samples
3. **Components** - All reusable components
4. **Screens** - Screen designs and flows
5. **Prototypes** - Interactive prototypes

## Tips for Working in Figma

### Use Auto-Layout
- Select elements and press Shift + A
- Makes responsive designs much easier
- Perfect for buttons, cards, lists

### Use Components
- Cmd/Ctrl + Alt + K to create component
- Alt + drag to create instance
- Changes to main component update all instances

### Use Constraints
- Set how elements resize in frames
- Essential for responsive design
- Access in right panel when element selected

### Keyboard Shortcuts
- **F**: Create frame
- **R**: Create rectangle
- **T**: Create text
- **O**: Create ellipse
- **Cmd/Ctrl + D**: Duplicate
- **Cmd/Ctrl + G**: Group
- **Cmd/Ctrl + /**: Search commands
- **Shift + A**: Auto-layout
- **Cmd/Ctrl + Alt + K**: Create component

## Exporting Assets

### For Development

1. Select element to export
2. Click "Export" in right panel
3. Add export settings:
   - PNG @1x, @2x, @3x (iOS)
   - SVG for icons
4. Click "Export"

### Export All Icons at Once

1. Create a frame called "Icons"
2. Place all icons at 24x24px
3. Select all icons
4. Batch export as SVG

## Using the Design System

### Starting a New Screen

1. Duplicate a screen template
2. Use components from library
3. Apply color styles (don't use hex codes)
4. Apply text styles (don't manually style text)
5. Use 8px spacing increments

### Maintaining Consistency

- **Always use styles**, not raw values
- If you need a new color, add it to the color system first
- If you need a new text size, add it to typography first
- Use components wherever possible
- Document any new patterns you create

## Sharing Your Designs

### With Team Members

1. Click "Share" button
2. Add email addresses
3. Set permission: "Can edit" or "Can view"

### With Developers

1. Select frame to share
2. Copy link
3. Developers can inspect and export assets
4. Use "Inspect" tab for CSS/React Native code

### Creating a Prototype

1. Switch to "Prototype" tab
2. Drag from element to target frame
3. Set interaction (On Click, On Drag, etc.)
4. Set animation (Instant, Dissolve, Slide, etc.)
5. Click "Play" button to preview

## Developer Handoff

### What to Include

1. **Specs Document**: Screen dimensions, spacing values
2. **Asset Exports**: All icons and images
3. **Color Values**: Hex codes and opacity values
4. **Typography Specs**: Font sizes, weights, line heights
5. **Component States**: All button/input states
6. **Interaction Notes**: Animation timing and easing

### Using Figma Inspect

Developers can:
- Click any element to see CSS/React Native code
- Export assets directly
- Copy hex codes, spacing values
- See all component properties

## Resources

### Figma Learning
- https://help.figma.com/ - Official docs
- https://www.youtube.com/figma - Figma YouTube
- Figma Community - Browse templates and plugins

### Design Inspiration
- Dribbble.com - Design inspiration
- Mobbin.com - Mobile app designs
- Material Design - Design guidelines

### Useful Figma Plugins

1. **Tokens Studio** - Import design tokens
2. **Stark** - Accessibility checker
3. **Content Reel** - Mock content generator
4. **Iconify** - Huge icon library
5. **Unsplash** - Stock photos
6. **Fig Motion** - Animation preview
7. **Remove BG** - Background removal
8. **Chart** - Data visualization

## Next Steps

1. Set up color and text styles (15 minutes)
2. Create basic components (30 minutes)
3. Design your first screen (60 minutes)
4. Get feedback and iterate
5. Create complete user flow
6. Build interactive prototype
7. Hand off to development

## Questions?

Refer to:
- [FIGMA_DESIGN_SYSTEM.md](FIGMA_DESIGN_SYSTEM.md) - Complete design specifications
- [figma-starter-kit.json](figma-starter-kit.json) - Design tokens
- Figma Help Center - https://help.figma.com/

---

Happy designing! Remember: consistency is key. Use the design system, and your app will look professional and polished.
