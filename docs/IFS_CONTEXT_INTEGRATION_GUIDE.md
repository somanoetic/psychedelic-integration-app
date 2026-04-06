# IFS Context Integration Guide

## Overview

The new `IFSPartsWorkChatWithContext.js` component implements a memory-aware IFS chat system that handles all the complex scenarios of parts work with continuity across sessions.

## Key Features

### 1. Universal Entry Point: "What part is coming up?"

**Every IFS session now starts the same way:**

```
"What part is coming up for you right now?"
```

This approach:
- ✅ Checks database for known parts FIRST
- ✅ Recognizes returning parts automatically
- ✅ Loads previous context for known parts
- ✅ Starts fresh discovery for new parts
- ✅ Honors the iterative nature of IFS work

**First-time user experience:**
```
Welcome to IFS Parts Work.

**What part is coming up for you right now?**

Take a moment to notice... Is there a part that's active right now?
```

**Returning user experience:**
```
Welcome back to IFS Parts Work.

**What part is coming up for you right now?**

I see you've worked with these parts before:
• Anxious Manager
• Inner Critic
• Perfectionist
• People Pleaser
... and 3 more

Is one of these parts active right now, or is this a new part wanting attention?
```

---

## Handling Complex Scenarios

### Scenario 1: Mid-Discovery Realization (Same Part, Different Name)

**User discovers:** "Oh wait, this 'Stressed Part' is actually my 'Anxious Manager' I met before!"

**How it's handled:**

1. **Duplicate Detection Algorithm** runs continuously during discovery phases
2. **Similarity Scoring** checks:
   - Name similarity (40% weight)
   - Strategy similarity (30% weight)
   - Feelings similarity (30% weight)
3. **User is offered merge option:**

```javascript
"This sounds similar to **Anxious Manager**, a manager you've worked with before.

Is this the same part showing up in a new way, or is this definitely a new part?"

Options:
- Merge with: Anxious Manager
- This is a new part
- Not sure yet
```

4. **If merged:** All session insights are added to the existing part's history
5. **Database update:** Existing part gets new session notes without creating duplicate

**Code reference:** [IFSPartsWorkChatWithContext.js:296-312](enhanced-components/IFSPartsWorkChatWithContext.js#L296-L312)

---

### Scenario 2: Protector Reveals Exile Mid-Session

**User is working with "Angry Part" and suddenly:** "I'm noticing a scared little kid underneath..."

**How it's handled:**

1. **Exile Detection** monitors conversation for exile language:
   - Keywords: young, child, scared, hurt, wounded, sad, alone, abandoned, small, vulnerable
2. **Known Exile Recognition:** Checks if description matches any existing exiles
3. **Connection Recorded IMMEDIATELY** (before offering options):
   - The fact that the exile emerged during protector work IS the connection
   - Database relationship created: `Angry Part → protects → Scared Child`
   - This happens regardless of which option user chooses
4. **User is offered options:**

```javascript
"I'm noticing something... You mentioned feelings and language that remind me of
**Scared Child**, an exile you've worked with before.

Is that part showing up right now? Sometimes protectors reveal the exiles they protect.

*(I've noted the connection between these parts)*"

Options:
- Switch to: Scared Child
- Continue with current part
- Tell me more
```

5. **If "Switch to" selected:**
   - Current protector progress is saved
   - Session shifts to working with the exile
   - Context loaded for exile
   - Connection already recorded

6. **If "Continue with current part" selected:**
   - Session continues with protector
   - Connection already recorded
   - User is reminded: "The connection to the exile has been noted"

7. **If "Tell me more" selected:**
   - AI explains the protector-exile dynamic
   - Then offers: Switch or Continue

**Code reference:** [IFSPartsWorkChatWithContext.js:390-408](enhanced-components/IFSPartsWorkChatWithContext.js#L390-L408)

---

### Scenario 3: AI Recognizes Pattern User Hasn't

**AI notices:** User's description of "new part" sounds exactly like their "Perfectionist"

**How it's handled:**

1. **During early discovery phases** (find/focus), duplicate detection runs automatically
2. **Similarity threshold:** >60% match triggers gentle inquiry
3. **AI asks (doesn't assume):**

```javascript
"This sounds similar to **Perfectionist**, a manager part you've worked with before.

Is this the same part showing up in a new way, or is this definitely a new part?"

Options:
- Merge with: Perfectionist
- This is a new part
- Not sure yet
```

4. **User maintains agency:** They choose whether to merge or keep separate
5. **If "Not sure yet":** Discovery continues, can revisit later

**Philosophy:** AI suggests but never forces. User knows their system best.

---

## Session Types

### Check-In Session (Known Part)

When user mentions a recognized part:

```javascript
"Great! Let's check in with **Anxious Manager**.

You last worked with this part on 10/15/2025.

**Reminder about this part:**
• Role: manager
• Location: chest and throat
• Strategy: overthinking and catastrophizing

How is this part showing up for you right now? What does it want you to know?"
```

**What happens:**
- ✅ Previous context loaded
- ✅ Reminder of part's characteristics
- ✅ Session marked as `check_in` in database
- ✅ Progress updates existing part record

### Discovery Session (New Part)

When user describes something unfamiliar:

```javascript
[AI begins standard 6 F's discovery process]

"The user is noticing: 'a heavy feeling in my stomach that makes me want to hide'.
Help them begin discovering this part."
```

**What happens:**
- ✅ Full 6 F's discovery process
- ✅ Session marked as `discovery` in database
- ✅ New part record created at completion
- ✅ Part added to user's known parts list

---

## Database Integration

### Automatic Saving

**Discovery Session Completion:**
```javascript
// Saves new part
const newPart = await ifsContextService.savePart(userId, {
  part_name: "Anxious Manager",
  part_role: "manager",
  location_in_body: "chest and throat",
  appearance_description: "tight, constricted feeling",
  part_feelings: "worried, overwhelmed",
  part_fears: "something bad will happen if I don't stay alert",
  protective_strategy: "overthinking and catastrophizing",
  work_phase: "discovery"
});

// Saves session history
await ifsContextService.saveSession(userId, {
  part_id: newPart.id,
  session_type: "discovery",
  part_was_known: false,
  conversation_summary: [full summary],
  completed: true
});
```

**Check-In Session Completion:**
```javascript
// Updates existing part
await ifsContextService.updatePart(currentPart.id, {
  last_worked_with: new Date().toISOString(),
  session_notes: [
    ...(currentPart.session_notes || []),
    {
      date: new Date().toISOString(),
      notes: [session summary]
    }
  ]
});

// Saves session history
await ifsContextService.saveSession(userId, {
  part_id: currentPart.id,
  session_type: "check_in",
  part_was_known: true,
  conversation_summary: [summary],
  completed: true
});
```

### Part Linking

When protector → exile relationship is identified:

```javascript
await ifsContextService.linkProtectorToExile(protectorId, exileId);

// Database updates:
// - Protector: protects_which_exile = exileId
// - Exile: protected_by_parts = [..., protectorId]
```

---

## Key Algorithms

### 1. Part Matching Algorithm

**Used for:** Recognizing when user mentions a known part

```javascript
findMatchingPart(userMessage) {
  // 1. Direct name match
  const directMatch = knownParts.find(part =>
    part.part_name && userMessage.toLowerCase().includes(part.part_name.toLowerCase())
  );
  if (directMatch) return directMatch;

  // 2. Strategy/feeling match
  const strategyMatch = knownParts.find(part =>
    (part.protective_strategy && userMessage.includes(part.protective_strategy.toLowerCase())) ||
    (part.part_feelings && userMessage.includes(part.part_feelings.toLowerCase()))
  );

  return strategyMatch || null;
}
```

### 2. Duplicate Detection Algorithm

**Used for:** Identifying when "new" description might be existing part

```javascript
calculateSimilarity(description, part) {
  let score = 0;

  // Name similarity (40% weight)
  score += (commonWords(description, part.part_name) / totalWords) * 0.4;

  // Strategy similarity (30% weight)
  score += (commonWords(description, part.protective_strategy) / totalWords) * 0.3;

  // Feelings similarity (30% weight)
  score += (commonWords(description, part.part_feelings) / totalWords) * 0.3;

  return score; // Threshold: 0.6 (60%)
}
```

### 3. Exile Detection Algorithm

**Used for:** Recognizing when an exile emerges during protector work

```javascript
detectExileEmergence(userMessage, aiResponse) {
  const combined = (userMessage + ' ' + aiResponse).toLowerCase();

  // Exile keywords
  const exileKeywords = [
    'young', 'child', 'scared', 'hurt', 'wounded',
    'sad', 'alone', 'abandoned', 'small', 'vulnerable'
  ];

  const hasExileLanguage = exileKeywords.some(keyword => combined.includes(keyword));

  if (hasExileLanguage) {
    // Check for matching known exile
    const matchingExile = knownParts.filter(p => p.is_exile).find(exile => {
      // Match based on similar language
    });

    return matchingExile || null;
  }

  return null;
}
```

### 4. Part Role Inference

**Used for:** Determining manager/firefighter/exile when not explicitly stated

```javascript
inferPartRole(roleDescription) {
  // Manager: control, plan, perfect, organize, achieve
  // Firefighter: numb, distract, escape, rage, rebel
  // Exile: hurt, wound, young, scared, abandoned

  // Default: manager (most common protector type)
}
```

---

## User Experience Flow

### First-Time User

```
1. "What part is coming up for you right now?"
   ↓
2. User describes part
   ↓
3. AI begins discovery (6 F's)
   ↓
4. Complete discovery
   ↓
5. Part saved to database
   ↓
6. User can work with it again anytime
```

### Returning User - Known Part

```
1. "What part is coming up for you right now?"
   Shows list of known parts
   ↓
2. User says "My Anxious Manager"
   ↓
3. AI loads context and starts check-in
   "You last worked with this part on [date]..."
   ↓
4. Check-in conversation
   ↓
5. Session saved to part's history
```

### Returning User - New Part

```
1. "What part is coming up for you right now?"
   Shows list of known parts
   ↓
2. User says "A really angry part I haven't met before"
   ↓
3. AI begins discovery
   ↓
4. Mid-discovery: "This sounds like your Raging Firefighter part"
   ↓
5. User chooses: Merge or Keep Separate
   ↓
6. Discovery continues or switches to check-in
```

### Mid-Session Part Switch

```
1. Working with "Controlling Manager"
   ↓
2. User: "I'm noticing a scared kid underneath"
   ↓
3. AI: "That sounds like Wounded Child (an exile you know)"
   ↓
4. Options offered:
   - Switch to Wounded Child
   - Link: Controlling Manager protects Wounded Child
   - Continue with current part
   ↓
5. User chooses
   ↓
6. Session adapts accordingly
   ↓
7. Relationship saved to database if linked
```

---

## Benefits of Context System

### For Users

1. **Continuity:** "The app remembers my parts!"
2. **Validation:** "This part came up before - it's real"
3. **Progress tracking:** "I can see how my relationship with this part has evolved"
4. **Relationship mapping:** "Oh, THIS protector guards THAT exile"
5. **Less repetition:** No need to re-explain parts every session

### For Therapeutic Work

1. **Non-linear IFS:** People DO return to discovery many times - system supports this
2. **Protector-Exile relationships:** System tracks these critical connections
3. **Session history:** Therapist can review what was worked on
4. **Part lifecycle:** Discovery → Accessing → Unburdening → Integration all tracked
5. **Pattern recognition:** Over time, see which parts are most active

### For AI Guidance

1. **Context-aware responses:** AI knows part's history
2. **Personalized language:** Uses user's own words for their parts
3. **Relationship suggestions:** "Is this protector guarding this exile?"
4. **Progress acknowledgment:** "You've worked with this part 3 times now"

---

## Technical Implementation Details

### State Management

```javascript
const [userId, setUserId] = useState(null);
const [knownParts, setKnownParts] = useState([]);
const [currentPart, setCurrentPart] = useState(null);
const [sessionType, setSessionType] = useState(null); // 'discovery' or 'check_in'
```

### Initialization Flow

```javascript
initializeSession() {
  1. Get user ID from AsyncStorage
  2. Load known parts from database via ifsContextService
  3. Display check-in message with parts list
  4. Wait for user input
}
```

### Session Completion Flow

```javascript
showSummary() {
  1. Generate session summary
  2. If discovery: save new part to database
  3. If check-in: update existing part
  4. Save session history
  5. Offer next steps
}
```

---

## Integration with Existing Components

### Update EducationScreen.js

Replace the old IFS Chat import:

```javascript
// Old
import IFSPartsWorkChatAI from '../enhanced-components/IFSPartsWorkChatAI';

// New
import IFSPartsWorkChatWithContext from '../enhanced-components/IFSPartsWorkChatWithContext';
```

Update the render:

```javascript
case 'ifs_chat':
  return (
    <IFSPartsWorkChatWithContext
      onComplete={handleWidgetComplete}
      onSkip={handleBackToTopics}
    />
  );
```

### Services Used

1. **ifsContextService** - Database operations for parts and sessions
2. **IFSAIService** - Claude AI for conversational guidance
3. **AsyncStorage** - User authentication state

---

## Future Enhancements

### Phase 2: Exile Accessing

- Add "Approach an Exile" session type
- Require protector permission before exile work
- Track which protectors granted permission
- Save exile access data (original wound, burdens carried)

### Phase 3: Unburdening

- Add "Unburdening Ceremony" session type
- Track unburdening method (light, water, fire, earth, wind)
- Record burdens released and new qualities
- Mark part as "unburdened" and track integration

### Parts Inventory Screen

- Visual map of all parts
- Color-coded by role (managers, firefighters, exiles)
- Show protector → exile relationships as connections
- Quick access to continue work with any part
- Session history timeline for each part

---

## Answering Your Original Question

**Q:** "If work begins on a part during discovery and a known part shows up for the person, how is that handled?"

**A:** The system handles this in **three ways:**

### 1. User Realizes Mid-Discovery (Explicit)

User says: "Oh wait, this is actually my Anxious Manager!"

**System response:**
```
"Got it - we'll continue with Anxious Manager. All your insights from this
session have been added to that part's history."
```

**What happens:** Merge with existing part, no duplicate created

### 2. AI Detects Similarity (Suggestion)

System notices high similarity (>60%) to existing part

**System response:**
```
"This sounds similar to **Anxious Manager**, a manager you've worked with before.

Is this the same part showing up in a new way, or is this definitely a new part?"

Options:
- Merge with: Anxious Manager
- This is a new part
- Not sure yet
```

**What happens:** User chooses, system respects their decision

### 3. Different Part Emerges (Switch)

User working with "Angry Part" → "Scared Child" (exile) shows up

**System response:**
```
"I'm noticing something... You mentioned feelings that remind me of
**Scared Child**, an exile you've worked with before.

Is that part showing up right now? Sometimes protectors reveal the exiles they protect.

*(I've noted the connection between these parts)*"

Options:
- Switch to: Scared Child
- Continue with current part
- Tell me more
```

**What happens FIRST:**
- **Connection recorded IMMEDIATELY** - protector→exile relationship saved to database

**Then user chooses:**
- **Switch:** Save current progress, load exile context, continue with exile
- **Continue:** Acknowledge connection noted, continue with current part
- **Tell me more:** Explain the protector-exile dynamic, then offer Switch or Continue

---

## Key Design Decision: Automatic Connection Recording

### Why Record Connections Automatically?

**The IFS Principle:** When an exile emerges during protector work, that emergence IS the relationship. The exile doesn't show up randomly - it reveals itself because the protector's defenses softened.

**Therapeutic Rationale:**
1. **Protector-exile connections are data, not interpretations** - If working with Angry Part brings up Scared Child, that's a fact about your system
2. **Recording preserves the discovery** - Even if user continues with protector, the connection isn't lost
3. **Supports non-linear work** - User might explore the connection in a future session
4. **Builds system map over time** - Multiple sessions reveal the full protective structure

**User Experience:**
- User doesn't have to remember to "save" the connection
- Can focus on the therapeutic moment, not database management
- System becomes smarter over time about their parts
- "The app noticed something I forgot about!"

**Example:**
```
Session 1: Working with Perfectionist → Rejected Child emerges
         Connection recorded automatically

Session 2: Working with People Pleaser → Rejected Child emerges again
         Connection recorded automatically

Result: User can now see that BOTH Perfectionist and People Pleaser
        protect Rejected Child - revealing the core exile
```

This approach makes the system a **therapeutic ally** that tracks patterns the user might not consciously notice.

---

## Summary

The context-aware IFS Chat system:

✅ **Always starts with "what part is coming up?"** - checking known parts first
✅ **Detects duplicates** - prevents creating the same part twice
✅ **Handles mid-session switches** - when different parts emerge
✅ **Automatically records protector-exile connections** - tracks protective relationships
✅ **Saves everything** - full session history and part lifecycle
✅ **Supports iterative discovery** - people return to parts many times
✅ **Maintains user agency** - suggests but never forces

This creates a therapeutic experience with **memory and continuity** across sessions, while honoring the **non-linear, relationship-based nature** of IFS work.
