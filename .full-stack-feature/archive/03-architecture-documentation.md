# Architecture Documentation: AI Guidance System (FEAT-202)

## Summary

Successfully created comprehensive AI architecture documentation for the Psychedelic Integration App. All deliverables completed according to requirements.

## Deliverables Completed

### 1. docs/AI_ARCHITECTURE.md (~850 lines)

**Primary architecture document with:**

✅ **Visual Overview (3 Mermaid Diagrams)**
- System Architecture: User → Routing → Services → Context → Database/API
- Master Context Flow: 9 data sources → aggregation → caching → services
- Conversation Flow: Complete sequence diagram of user interaction

✅ **Architecture Patterns**
- Multi-agent architecture (9 specialized services)
- Cross-domain intelligence system
- Context aggregation patterns
- Routing and intent detection

✅ **Service Deep Dives (9 services)**
- IFS AI Service - Internal Family Systems
- Polyvagal AI Service - Nervous system tracking
- Nervous System Mapping AI - Polyvagal assessment
- Triggers & Glimmers AI - Trigger/glimmer mapping
- Core Beliefs AI - Core belief work
- Regulating Resources AI - Regulation toolkit
- Daily Journal AI - Daily journaling
- Enhanced Claude Service - Huxley integration guide
- Conversational Routing Service - Intent detection

✅ **Master Context System** (⭐ CRITICAL)
- What it is and why it exists
- 9 data domains aggregated:
  - User profile
  - IFS parts
  - Nervous system states
  - Integration journals
  - Session data
  - Core beliefs
  - Triggers & glimmers
  - Regulating resources
  - Discovered connections
- Cross-domain connection examples with code
- Performance considerations (5-min caching, lazy loading)
- Usage patterns with detailed examples

✅ **New Developer Quickstart**
- 30-minute learning path
- Key concepts to understand
- Where to start reading code
- Common patterns

### 2. docs/PROMPT_ENGINEERING.md (~700 lines)

**Comprehensive prompt design guide with:**

✅ **Therapeutic Frameworks**
- Robert Johnson's 4-Step Integration
- IFS language patterns (parts-aware)
- Polyvagal theory integration
- Trauma-informed principles

✅ **Voice & Tone Principles (7 principles with rationale)**
- Warm but not saccharine
- Curious, not knowing
- Brief and clear
- Follow, don't lead
- Both/And thinking
- Embodied
- Parts-aware

✅ **Context Injection Strategy**
- What context to inject by domain
- How context gets injected (4 patterns)
- Focus modes for optimization
- Example prompt with annotations

✅ **Safety & Ethics**
- Crisis detection and routing
- Trauma-informed design decisions
- Privacy considerations
- Professional help criteria

✅ **Example Prompts (3 complete prompts)**
- IFS AI Service system prompt
- Polyvagal AI Service system prompt
- Enhanced Claude (Huxley) system prompt

### 3. Inline JSDoc Documentation (3 critical services)

✅ **lib/masterContextService.js**
- `getMasterContext()` - Main aggregation function
- `discoverPotentialConnections()` - Cross-domain insights
- `clearCache()` and `saveConnection()` - Utility methods
- All with @param, @returns, @example tags

✅ **lib/conversationalRoutingService.js**
- Class-level documentation
- `getEnhancedSystemPrompt()` - Scenario injection
- `sendMessage()` - Main routing entry point
- `getFallbackResponse()` and `getFallbackRoute()` - Offline mode

✅ **lib/enhancedClaudeService.js**
- Class-level documentation (Huxley's role)
- `continueConversation()` - Main conversation method
- `buildEnhancedPrompt()` - Context injection
- `assessNervousSystemFromMessage()` - NS detection
- `extractEntities()` - Archetypal symbol extraction

## Files Created

1. `docs/AI_ARCHITECTURE.md` - Primary architecture document
2. `docs/PROMPT_ENGINEERING.md` - Prompt design guide

## Files Modified (JSDoc added)

1. `lib/masterContextService.js` - Master context aggregation
2. `lib/conversationalRoutingService.js` - Intent detection & routing
3. `lib/enhancedClaudeService.js` - Huxley integration guide

## Key Achievements

### 1. Cross-Domain Intelligence Documented

The master context system's ability to connect insights across domains is thoroughly explained:

- **What it does:** Aggregates 9 therapeutic data domains
- **Why it matters:** Enables cross-domain insights no other app has
- **Examples provided:**
  - "Owl from journey = Protector part"
  - "Chest pressure in sympathetic state = IFS part holding tension"
  - "Belief about unworthiness = surfaced in integration journal 2 weeks ago"

### 2. Trauma-Informed Design Emphasized

Throughout all documentation:

- Nervous system attunement first
- Crisis detection (CRITICAL priority)
- State-specific responses (ventral, sympathetic, dorsal)
- Explicit safety protocols
- Titration and pacing

### 3. Practical Code Examples

Not just theory - actual working code:

- JSDoc with @example tags showing real usage
- Copy-paste ready examples
- Code snippets with annotations
- Usage patterns with explanations

### 4. Clinical Voice Documented

7 specific voice principles with rationale:

- Not generic AI - clinically-informed
- Examples of what to say/not say
- Question patterns for each therapeutic domain
- Response style guidelines

### 5. 30-Minute Developer Onboarding

Clear learning path:

- Key concepts to understand
- Where to start reading code
- Common patterns
- Questions to ask when stuck

## Success Metrics Met

✅ **docs/AI_ARCHITECTURE.md exists with 3+ Mermaid diagrams**
✅ **Master context system thoroughly explained**
✅ **New developer can understand system in < 1 hour**
✅ **docs/PROMPT_ENGINEERING.md documents therapeutic frameworks**
✅ **Voice principles explained with rationale**
✅ **Example prompts shown with annotations**
✅ **JSDoc added to 3 critical services (master context, routing, enhanced Claude)**
✅ **Documentation is clear, accurate, and helpful**

## Agent Used

- **Agent ID:** aa2a455
- **Type:** general-purpose
- **Duration:** ~12 minutes
- **Token Usage:** ~105K tokens

## What Makes This Documentation Unique

1. **Emphasis on Competitive Advantage**
   - Master context's cross-domain intelligence is the "secret weapon"
   - Documented with real examples and code patterns

2. **Clinical Sophistication**
   - Not a generic chatbot - therapeutically grounded
   - Frameworks explained (Johnson, IFS, Polyvagal)
   - Voice principles with clinical rationale

3. **Developer-Focused**
   - Practical, not just theoretical
   - Clear onboarding path
   - Working code examples
   - JSDoc for IDE integration

4. **Trauma-Informed Throughout**
   - Safety is paramount
   - Crisis detection documented
   - State-responsive design explained

## Next Steps

1. ✅ Documentation complete (this step)
2. 🔜 Commit changes with proper message
3. 🔜 Update context/features/ai-system-improvements.md
4. 🔜 Update context/STATUS.md
5. 🔜 Share with team for review

## Notes

This documentation will serve as:

- **Onboarding guide** for new developers (< 1 hour to understand)
- **Reference material** for AI agents working on the codebase
- **Architecture documentation** for stakeholders
- **Prompt engineering guide** for clinical decisions
- **Code reference** via JSDoc in IDEs

The documentation captures the sophistication of the AI system while making it accessible. The master context system's cross-domain intelligence is clearly explained as the competitive advantage, and the trauma-informed design is emphasized throughout.

---

**Created:** 2026-02-09
**Agent:** aa2a455 (general-purpose)
**Status:** Complete
**Next:** Commit and update context system
