# Unified HuxleyService — Testing & Fine-Tuning Guide

## Background

All 11 separate AI services have been consolidated into a single `huxleyService`
with mode-based routing. This guide covers how to test each mode and what to
watch for in terms of prompt quality and behavioral changes.

---

## Instant-to-API Changes (Latency Regressions)

### What changed

The old `TherapeuticIntegrationService` had two methods that returned **hardcoded
responses** — no API call, instant display:

1. **`respondToNervousSystemCheck()`** — When the user completes a nervous system
   assessment widget, the old service returned a pre-written string based on the
   state (ventral/sympathetic/dorsal) and intensity. No Claude API call.

2. **`respondToPracticeCompletion()`** — When the user finishes a guided practice
   (breathing, body scan, parts work, etc.), the old service returned a pre-written
   follow-up. No Claude API call.

### Which screens are affected

| Screen | NS Check-in | Practice Completion | Impact |
|--------|-------------|-------------------|--------|
| `EnhancedTherapeuticIntegrationScreen.js` | **Inlined** (still instant) | **Inlined** (still instant) | No change |
| `EnhancedConversationScreen.js` | **Now hits API** | **Now hits API** | ~2-4s delay + cost |
| `TherapeuticIntegrationScreen.js` | **Now hits API** | **Now hits API** | ~2-4s delay + cost |

### What the user sees

**Before (old service):**
- User completes NS check-in widget → response appears instantly
- User finishes a breathing exercise → follow-up appears instantly

**After (migrated screens that hit API):**
- User completes NS check-in widget → loading spinner → response in 2-4s
- User finishes a breathing exercise → loading spinner → response in 2-4s

### How to fix (if the delay is unacceptable)

Inline the hardcoded responses in `EnhancedConversationScreen.js` and
`TherapeuticIntegrationScreen.js` the same way `EnhancedTherapeuticIntegrationScreen.js`
does it. Search for `huxleyService.chat` calls with messages like:
- `"Nervous system check-in: state=..."`
- `"I just completed a ... practice"`

Replace those with inline response logic (see `EnhancedTherapeuticIntegrationScreen.js`
lines ~270-310 and ~400-420 for the pattern).

**Trade-off:** Inline = instant but generic. API = slower but Huxley can give a
contextual, personalized response that references what the user was just discussing.

---

## Mode-by-Mode Testing Checklist

For each mode, open the relevant screen, have a brief conversation (3-5 exchanges),
and evaluate against the criteria. Rate each item Pass/Needs Tuning.

### 1. General Conversation (`general`)
**Screen:** ConversationScreen
**Old service:** `claudeService.js` / `enhancedClaudeService.js`

- [ ] Huxley introduces itself with warmth, not clinical detachment
- [ ] References IFS framework naturally (parts language) without forcing it
- [ ] References polyvagal framework when emotions/body come up
- [ ] Does NOT sound like a generic chatbot — should feel like a skilled therapist
- [ ] Asks curious, open questions rather than giving advice
- [ ] Detects when user is activated/shutdown and adjusts tone accordingly
- [ ] Entity extraction works (check console logs for `therapeuticData`)

**Test prompt:** "I had a really intense experience last week and I'm still processing a lot of fear and sadness"

**Expected:** Huxley should acknowledge both emotions, ask about where they live in the body, possibly reference parts ("a part of you carrying fear"), and NOT rush to solutions.

---

### 2. IFS Parts Work (`ifs`)
**Screens:** IFSPartsWorkChatAI, IFSPartsWorkChatWithContext
**Old service:** `ifsAIService.js`

- [ ] Uses 6 F's framework (Find, Focus, Flesh out, Feel toward, befriend, Fear)
- [ ] Correctly identifies parts (protectors, exiles, firefighters, managers)
- [ ] Distinguishes Self-energy from parts
- [ ] Maintains therapeutic frame — doesn't pathologize parts
- [ ] Phase transitions feel natural (not forced progression)
- [ ] "What does this part want you to know?" type questions appear naturally

**Test prompt:** "I notice a part of me that gets really angry whenever someone criticizes me"

**Expected:** Huxley should validate the angry part, ask to Focus on it (where in body), then gently explore what it's protecting.

---

### 3. Nervous System Mapping (`nervous_system_mapping`)
**Screen:** ConversationalNervousSystemMapping
**Old service:** `nervousSystemMappingAIService.js`

- [ ] Explains the three states (ventral, sympathetic, dorsal) accessibly
- [ ] Asks about body sensations, not just emotions
- [ ] Guides through mapping each state with personal examples
- [ ] Includes drawing/visualization prompt for body mapping
- [ ] Avoids clinical jargon overload
- [ ] Extraction prompt produces valid JSON with all three states

**Test prompt:** "When I'm stressed I feel tightness in my chest and my breathing gets shallow"

**Expected:** Huxley should connect this to sympathetic activation, ask about the specific sensation quality, and gently guide toward exploring what helps it settle.

---

### 4. Polyvagal Check-in (`polyvagal_checkin`)
**Screens:** PolyvagalMappingWidgetAI
**Old service:** `polyvagalAIService.js`

- [ ] Asks about current body state, not just mood
- [ ] Maps responses to correct polyvagal state
- [ ] Adapts language to the detected state (gentle for dorsal, grounding for sympathetic)
- [ ] Doesn't over-explain the theory
- [ ] Response feels brief and present (this is a check-in, not a deep dive)

**Test prompt:** "I feel kind of numb and disconnected today, like nothing really matters"

**Expected:** Should recognize dorsal/shutdown, be very gentle, not push for activation, validate the protective function.

---

### 5. Daily Journal (`journal`)
**Screen:** DailyJournal
**Old service:** `dailyJournalAIService.js`

- [ ] Follows journal phases (opening → exploration → reflection → closure)
- [ ] Asks reflective questions, doesn't just validate
- [ ] Connects journal content to integration themes
- [ ] `extractData()` produces valid structured JSON (mood, themes, insights, gratitude)
- [ ] `generateTitle()` creates a meaningful, non-generic title
- [ ] Tone is warm but not saccharine

**Test prompt:** "Today I noticed the same pattern of withdrawing when my partner tries to connect with me"

**Expected:** Should explore the pattern with curiosity, possibly connect to parts/NS state, ask what the withdrawing is protecting.

---

### 6. Core Beliefs Assessment (`core_beliefs`)
**Screen:** CoreBeliefsAssessment
**Old service:** `coreBeliefsAIService.js`

- [ ] Responds to domain scores with relevant exploration
- [ ] Explores beliefs across 10 domains (self-worth, safety, trust, control, etc.)
- [ ] Connects beliefs to psychedelic insights if user mentions them
- [ ] Doesn't just label beliefs — explores their origin and function
- [ ] Feels therapeutic, not like a quiz debrief

**Test prompt:** (After assessment scores are passed) "My self-worth score was really low, that resonates with me"

**Expected:** Should gently explore what low self-worth feels like, where it came from, how it shows up, NOT lecture about cognitive distortions.

---

### 7. Triggers & Glimmers (`triggers_glimmers`)
**Screens:** ConversationalTriggersGlimmers, TriggersAndGlimmersWidgetAI
**Old service:** `triggersGlimmersAIService.js`

- [ ] Explains triggers and glimmers in accessible language
- [ ] Categorizes triggers (sympathetic vs dorsal)
- [ ] Categorizes glimmers (sensory, relational, activity, nature)
- [ ] Asks for specific examples, not just categories
- [ ] Extraction produces valid categorized JSON
- [ ] Validates that triggers are protective responses, not character flaws

**Test prompt:** "Loud sudden noises really set me off, and crowds make me want to disappear"

**Expected:** Should map loud noises to sympathetic trigger, crowds to possibly dorsal, ask what each one feels like in the body.

---

### 8. Regulating Resources (`regulating_resources`)
**Screens:** ConversationalRegulatingResources, RegulatingResourcesWidgetAI
**Old service:** `regulatingResourcesAIService.js`

- [ ] Explores both individual and interactive regulation resources
- [ ] Covers categories: sensory, movement, connection, creative, spiritual, cognitive
- [ ] Helps user identify what they already do (not prescriptive)
- [ ] Extraction produces valid categorized JSON
- [ ] Feels collaborative, not like filling out a form

**Test prompt:** "Walking in nature really helps me, and sometimes just petting my cat calms me down"

**Expected:** Should categorize these (nature/movement, sensory/connection), ask what specifically about each one helps, explore what the body feels like during them.

---

### 9. Intention Setting (`intention`)
**Screen:** SetIntentionScreen
**Old service:** `intentionGuidanceAIService.js`

- [ ] Follows 3-stage flow: welcome → direction → confirm
- [ ] Adapts to nervous system state (gentler when activated/shutdown)
- [ ] Offers framework-specific guidance (IFS, somatic, existential, etc.)
- [ ] Draft analysis gives specific, helpful feedback (not generic praise)
- [ ] Suggested actions appear at appropriate stages
- [ ] Tone matches the sacredness of intention setting

**Test prompt:** "I want to work with the grief I've been carrying about my grandmother"

**Expected:** Should honor the grief, explore what working with it might look like through the chosen framework, help craft a specific intention.

---

### 10. Therapeutic Integration (`therapeutic_integration`)
**Screens:** TherapeuticIntegrationScreen, EnhancedTherapeuticIntegrationScreen
**Old service:** `therapeuticIntegrationService.js`

- [ ] Bridges from experience mapping to therapeutic work
- [ ] Includes polyvagal, IFS, CBT, and somatic modalities
- [ ] Follows therapeutic phases (ritual reflection → NS assessment → parts work → pattern recognition → embodied integration)
- [ ] Exercise recommendations are contextually relevant
- [ ] Cross-session context is loaded and referenced
- [ ] `---THERAPEUTIC_DATA---` block is present and parseable in responses
- [ ] Themes and parts are tracked across turns

**Test prompt:** "During my experience I felt this deep connection to everything, but now I feel so separate and alone"

**Expected:** Should explore the contrast, possibly identify a part carrying the separation, connect to NS state, may suggest a somatic practice.

---

## Cross-Mode Testing

These tests verify the unified context sharing that's new with this migration.

### Test A: Context Carries Between Modes
1. Open IFS Parts Work, identify a part (e.g., "inner critic")
2. Switch to Daily Journal
3. Mention criticism → Does Huxley reference the inner critic part?

**Expected with old services:** No — each service was siloed.
**Expected with unified service:** Yes — shared context via `masterContextService`.

### Test B: NS State Persists
1. Do a Polyvagal Check-in, report sympathetic activation
2. Open General Conversation
3. Does Huxley adjust its tone/pacing for activation?

### Test C: Exercise History Doesn't Repeat
1. Complete a breathing exercise in Therapeutic Integration
2. Later, Huxley recommends an exercise → is it the same one?

**Expected:** Different exercise (the service tracks recommended/completed exercises).

---

## Console Log Verification

While testing, keep the console open and watch for:

```
[HuxleyService] Mode set: <mode_name>
[HuxleyService] Therapeutic data extracted: { themes: [...], ... }
[HuxleyService] Context loaded for user: <user_id>
[HuxleyService] Persisted context saved
```

**Red flags in console:**
- `Could not parse therapeutic data block` — prompt needs `---THERAPEUTIC_DATA---` format tuning
- `Error in huxleyService.chat` — API call failed
- `HuxleyService init error` — initialization failed on app startup
- Missing `therapeuticData` in response — structured output instructions may not be in the prompt

---

## Fine-Tuning Process

When a mode's responses aren't meeting expectations:

1. **Identify the issue** — Is it tone? Depth? Wrong framework? Missing context?
2. **Find the mode config** — `lib/huxleyModeConfigs.js`, search for the mode ID
3. **Edit the `systemPrompt`** — This is the primary lever. Each mode has a detailed system prompt.
4. **Check `HUXLEY_IDENTITY`** — Shared identity prompt at top of file. Changes here affect all modes.
5. **Test again** — Same prompt, check if the response improved
6. **Iterate** — Prompt tuning is iterative. 2-3 rounds is normal.

### Common tuning patterns

| Problem | Fix |
|---------|-----|
| Too clinical/detached | Add "warm, present, embodied" to the system prompt |
| Too generic/chatbot-like | Add specific framework references and example responses |
| Over-explains theory | Add "prioritize direct experience over psychoeducation" |
| Doesn't detect NS state | Check that the structured output instructions request `nervousSystemState` |
| Wrong phase progression | Check the `phases` array in the mode config |
| Exercises not recommended | Verify `extractionEnabled: true` and exercise catalog is being injected |

---

## Priority Order for Testing

1. **General Conversation** — Most used, highest impact
2. **IFS Parts Work** — Core therapeutic feature
3. **Daily Journal** — Daily engagement feature
4. **Therapeutic Integration** — Complex, most modes involved
5. **Intention Setting** — Session start feature
6. **Nervous System Mapping** — Onboarding feature
7. **Polyvagal Check-in** — Quick interaction
8. **Triggers & Glimmers** — Assessment feature
9. **Regulating Resources** — Assessment feature
10. **Core Beliefs** — Assessment feature
