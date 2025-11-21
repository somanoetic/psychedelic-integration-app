# Huxley Character Design Guide

## Character Concept
**Role:** Wise therapeutic guide and companion
**Vibe:** Professional, warm, grounded (not too mystical/woo-woo)
**Purpose:** Help users navigate psychedelic integration with compassion and wisdom

---

## Visual Style

### Overall Aesthetic
- **Professional yet approachable** - blend of therapist + mindfulness guide
- **Calming presence** - uses soft, warm colors
- **Trustworthy** - mature, stable appearance
- **Gender-neutral** - inclusive and universal appeal

### Color Palette
**Primary Colors:**
- Soft purple/lavender (#8b5cf6) - wisdom, insight, consciousness
- Warm teal (#10b981) - healing, growth, balance
- Soft coral/peach - warmth, compassion

**Supporting Colors:**
- Cream/off-white - openness, clarity
- Soft gray - stability, grounding
- Gentle gold accents - guidance, illumination

### Character Features

**Option 1: Humanoid Guide**
- Simple, clean design (not overly detailed)
- Kind, wise facial expression
- Gentle smile, warm eyes
- Could wear:
  - Simple robes or comfortable casual wear
  - Soft cardigan or flowing jacket
  - Colors from palette above
- Hair: Could have flowing hair or be bald/simple
- Age: Appears mature but ageless (30s-50s vibe)

**Option 2: Abstract Companion**
- Rounded, organic shape (teardrop, gentle blob)
- Expressive simple face (dot eyes, subtle smile)
- Subtle glow or soft gradient
- Floats gently (slight animation potential)
- Less human, more symbolic of inner wisdom

**Option 3: Nature-Inspired Guide**
- Tree-like humanoid form
- Branches as hair/crown
- Grounded root-like feet
- Organic, flowing design
- Represents growth and stability

---

## Personality & Tone

### Voice Characteristics
- **Wise but not preachy**
- **Warm but professional**
- **Curious and supportive**
- **Direct when needed, gentle always**
- **Uses "we" language** ("What would you like to explore today?" not "What do you want?")

### Example Dialogue
✅ "Welcome back! What would you like to explore today?"
✅ "I'm here to support your integration journey."
✅ "Let's take this at your pace."
✅ "That makes sense. Tell me more about that."

❌ "Greetings, seeker!" (too mystical)
❌ "You must..." (too prescriptive)
❌ "OMG hi!!" (too casual)

---

## Technical Specs for Powtoon Export

### File Requirements
- **Format:** PNG with transparency (for static)
- **Animation:** MP4 or GIF (if animated)
- **Size:** 200x200px minimum, 400x400px recommended
- **Resolution:** 72 DPI for screen, 300 DPI if high-quality

### Animation Ideas (Optional)
- Gentle breathing motion (subtle scale in/out)
- Soft glow pulse
- Slight head tilt when "listening"
- Gentle hand gestures
- Blinking eyes

### File Location
Save your exported Huxley character to:
```
assets/images/huxley-character.png
```

Or for animated:
```
assets/images/huxley-character.gif
```

---

## Implementation Notes

### Current Placeholder
The welcome dialog currently uses a purple brain icon (MaterialIcons "psychology") as a placeholder.

### To Replace:
1. Export your Powtoon character
2. Save to `assets/images/huxley-character.png`
3. Update `HuxleyWelcomeDialog.js`:

```javascript
// Replace this:
<View style={styles.characterPlaceholder}>
  <MaterialIcons name="psychology" size={64} color="#8b5cf6" />
</View>

// With this:
<Image
  source={require('../assets/images/huxley-character.png')}
  style={styles.characterImage}
  resizeMode="contain"
/>
```

---

## Inspiration References

**Character Archetypes:**
- Carl Jung (wise psychologist)
- Mr. Rogers (warm, safe presence)
- Modern mindfulness guides
- Therapy chatbot companions (Woebot, Wysa) - but more human

**Visual References:**
- Calm app illustrations (soft, professional)
- Headspace characters (friendly but not childish)
- Modern mental health app design
- Adult-oriented educational content

---

## What to Avoid

❌ **Too mystical:** Third eyes, excessive cosmic imagery, crystals
❌ **Too clinical:** White coat, clipboard, sterile appearance
❌ **Too playful:** Overly cartoonish, childish features
❌ **Too serious:** Stern expression, intimidating presence
❌ **Religious symbols:** Crosses, specific spiritual iconography

✅ **Sweet spot:** Warm therapist meeting a gentle meditation guide

---

## Next Steps

1. Create or refine your Powtoon character based on this guide
2. Export as PNG (static) or GIF/MP4 (animated)
3. Test in the app at different sizes
4. Gather user feedback during beta testing
5. Iterate if needed

