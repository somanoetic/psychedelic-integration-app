# Requirements: FEAT-102: AI Guidance in Set Your Intention Screen

**Feature ID:** FEAT-102
**Priority:** High
**Target Phase:** Phase 1 (Week 3-4)
**Estimated Effort:** 4-5 days

---

## Problem Statement

Users preparing for psychedelic sessions often struggle to formulate meaningful, clear intentions. Without guidance, intentions can be:

- **Too vague**: "I want to feel better" or "I want insights" lack specificity
- **Unfocused**: Users bring too many intentions, diluting the experience
- **Misaligned**: Intentions don't match the user's actual needs or the session context
- **Anxiety-inducing**: Users feel pressure to have the "perfect" intention

**The Impact:**
- Unclear intentions lead to less meaningful sessions
- Users approach sessions with confusion rather than clarity
- Post-session integration is harder without a clear starting point
- Therapeutic potential is reduced

**User:** Individuals preparing for psychedelic experiences who want thoughtful, personalized guidance to set meaningful intentions that align with their personal growth goals.

---

## Acceptance Criteria

### Must Have (V1)
- [ ] **Intention setting UI design** - Clean, calming interface for the intention-setting flow
- [ ] **Claude API integration for guidance** - AI provides personalized prompts and suggestions
- [ ] **Prompt templates based on session type** - Different approaches for different contexts
- [ ] **Example intentions library** - Curated examples to inspire and guide users
- [ ] **Philosophical/therapeutic frameworks** - Ground guidance in evidence-based approaches (IFS, somatic, existential)
- [ ] **Privacy controls (optional storage)** - Users choose whether to save intentions to database
- [ ] **Gentle guidance, not prescriptive** - AI suggests, doesn't dictate; empowers user agency

### Success Metrics
- 80%+ of users who set intentions report clarity and alignment
- Reduced pre-session anxiety (self-reported)
- Feature used in 70%+ of session preparations
- Intentions are more specific and actionable (qualitative analysis)

---

## Scope

### In Scope (V1)
- AI-powered conversational flow to help users clarify intentions
- Multiple guided prompts based on session type (healing, exploration, creativity, etc.)
- Example intentions library with 20-30 curated examples
- Integration with existing session preparation workflow
- Privacy-first: opt-in storage, user can view/edit/delete anytime
- Philosophical frameworks: IFS parts work, somatic awareness, existential inquiry
- Mobile-first UI with offline capability (cached prompts)
- Journal history integration (optional): AI references past entries for personalization

### Out of Scope (V1)
- ❌ **Session scheduling/calendar** - This feature doesn't handle when sessions happen
- ❌ **Substance-specific guidance** - No dosage, substance selection, or medical advice
- ❌ **Live sitter/guide matching** - Not connecting users with human guides/therapists
- ❌ **Post-session analysis** - Focus is pre-session only; reflection is a future feature
- ❌ **Multi-user intentions** - V1 is solo user; group ceremonies are future
- ❌ **Voice input** - Text-based for V1; voice/audio is future enhancement

---

## Technical Constraints

### Existing Systems
- **Claude API**: Must use existing integration patterns from `lib/claudeService.js` and `lib/enhancedClaudeService.js`
  - Don't create new API abstraction
  - Follow established streaming, error handling, and retry patterns
- **Supabase**: Follow current RLS policies, table naming conventions, database access patterns
  - Use `lib/supabase.js` for all database operations
  - Maintain consistency with existing schema design

### Privacy & Security
- **Privacy-first design**: Intentions are highly sensitive personal data
  - Opt-in storage (default: not saved to database)
  - If saved: encrypted at rest
  - User can view, edit, delete anytime
  - No sharing or analytics on intention content
- **Follow existing privacy patterns**: See `journal_entries` table for reference

### Platform Requirements
- **Mobile-first**: React Native 0.81.5, must work on iOS and Android
- **Offline-capable**:
  - Cache prompt templates locally
  - Queue API calls if offline
  - Don't block user flow if network is unavailable
  - Show clear offline indicators
- **Performance**: AI responses should stream for responsiveness (<3s initial response)

### User Experience
- **Non-prescriptive**: AI suggests, doesn't dictate
- **Culturally sensitive**: Avoid religious assumptions, respect diverse backgrounds
- **Trauma-informed**: Gentle language, avoid triggering content, emphasize safety

---

## Technology Stack

### Frontend
- **Framework**: React Native 0.81.5 + Expo SDK ~54.0.25
- **Navigation**: React Navigation (existing setup)
- **State Management**: React hooks + Context API
- **Local Storage**: AsyncStorage for cached prompts and draft intentions
- **UI Components**: Follow existing Noesis design system (colors.js, custom components)

### Backend
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth (existing)
- **API**:
  - Claude API (Anthropic) for AI guidance
  - Create new service: `lib/intentionGuidanceAIService.js`
- **File Storage**: Not required for V1

### Infrastructure
- **Hosting**: Existing Supabase project
- **API Keys**: Use existing `ANTHROPIC_API_KEY` from `.env`
- **RLS**: Row-level security for intention storage (if user opts in)

---

## Dependencies

### Required (Must Exist)
- **Claude API services**: `lib/claudeService.js`, `lib/enhancedClaudeService.js`
  - Feature cannot work without AI backend
  - Verify API key is valid and has sufficient credits
- **Supabase connection**: `lib/supabase.js`
  - Database access for optional storage
  - User authentication for RLS

### Integrations
- **Session Preparation Flow**:
  - This feature is part of the pre-session workflow
  - May depend on existing session screens
  - Coordinates with FEAT-101 (Session Checklist) - both are prep steps
- **Journal History**:
  - Optional: AI can reference user's past journal entries
  - Requires read access to `journal_entries` table
  - Personalization: "I see you've been exploring grief lately..."

### Database Impact
- **New Tables Required**:
  - `session_intentions` (optional storage, opt-in)
  - `intention_templates` (prompt templates and examples)
  - `user_intention_preferences` (privacy settings, favorite frameworks)
- **Schema Changes**: Will be defined in Step 2 (Database Design)

### Related Features
- **FEAT-101 (Session Checklist)**: Both are session preparation tools
  - May share navigation/UI patterns
  - Checklist might include "Set intention" as an item
- **Future FEAT-103 (Nervous System Check-In)**: Another pre-session assessment
  - These three features form the "Session Preparation Suite"

---

## Configuration

- **Stack**: react-native-supabase
- **API Style**: REST (Supabase) + Direct API calls (Claude)
- **Complexity**: medium
- **Feature Type**: AI-powered user guidance + optional data persistence

---

## Example User Flow

1. User taps "Prepare for Session" from Home
2. App shows Session Prep menu (Checklist, Set Intention, Nervous System Check-In)
3. User taps "Set Your Intention"
4. **Welcome Screen**: Brief explanation, privacy notice (opt-in storage toggle)
5. **Context Gathering**: AI asks:
   - "What type of session is this?" (healing, exploration, creativity, spiritual, other)
   - "What's present for you right now?" (open-ended)
6. **Guided Exploration**: Based on answers, AI provides:
   - Reflective prompts: "What relationship pattern are you curious about?"
   - Example intentions: "I intend to approach my grief with compassion"
   - Gentle suggestions: "Consider focusing on one area rather than multiple intentions"
7. **Formulation**: User drafts their intention with AI feedback
8. **Review**: User sees final intention, can edit or regenerate
9. **Save (Optional)**: User chooses to save to database or keep it private/local
10. **Confirmation**: "Your intention is set. Take a moment to reflect..."
11. Return to Session Prep menu or continue to other prep steps

---

## Example AI Prompts

### Session Type: Healing
- "What wound or pattern are you ready to heal?"
- "How do you want to relate to your pain differently?"
- "What would healing look like for you?"

### Session Type: Exploration
- "What question are you bringing to this experience?"
- "What aspect of yourself do you want to understand better?"
- "What would you like to discover?"

### Session Type: Creativity
- "What creative block are you working with?"
- "What wants to be expressed through you?"
- "How do you want to reconnect with your creative flow?"

### Session Type: Spiritual
- "What are you seeking to connect with?"
- "How do you want to relate to the sacred?"
- "What question are you holding about existence?"

---

## Philosophical Frameworks (Content Research Needed)

### Internal Family Systems (IFS)
- Help users identify which "part" needs attention
- Example: "What part of you is calling for healing?"

### Somatic Approaches
- Ground intentions in body awareness
- Example: "Where in your body do you feel this question?"

### Existential/Phenomenological
- Big questions, meaning-making, mystery
- Example: "What would it mean to truly accept uncertainty?"

### Harm Reduction
- Safety, realistic expectations, integration planning
- Example: "What support do you need before and after?"

---

## Notes for Implementation

### Content Development
- Curate 20-30 example intentions across frameworks
- Write 10-15 prompt templates per session type
- Consult psychedelic integration research (MAPS, etc.)
- Review with therapist/integration specialist if possible

### AI Prompt Engineering
- System prompt emphasizes: gentle, non-prescriptive, trauma-informed
- Avoid: medical advice, spiritual bypassing, toxic positivity
- Include: validation, open-ended questions, reflection, safety

### Privacy Considerations
- Default to NOT saving (privacy-first)
- If user opts in: explain exactly what's saved
- Easy access to delete all intentions from Settings
- No analytics/tracking on intention content

### Testing Focus
- AI prompt quality (non-prescriptive, helpful, safe)
- Privacy controls work correctly
- Offline caching and queueing
- Integration with session workflow
- Cross-platform (iOS/Android) UI/UX

---

## Risk Assessment

### High Risk
- **Privacy breach**: Intentions are sensitive; any leak is severe
  - Mitigation: Encryption, opt-in only, clear policies
- **Harmful AI guidance**: Prescriptive or triggering suggestions
  - Mitigation: Careful prompt engineering, user testing, feedback loops

### Medium Risk
- **API costs**: Claude API can be expensive at scale
  - Mitigation: Prompt caching, rate limiting, optimize token usage
- **Low adoption**: Users skip this feature
  - Mitigation: User research, clear value prop, optional not required

### Low Risk
- **Technical complexity**: This is a well-defined feature
- **Database performance**: Minimal storage, simple queries

---

## Success Criteria

This feature is successful if:
- ✅ 70%+ of users use intention-setting in session prep
- ✅ Users report feeling more clear and focused (qualitative feedback)
- ✅ No privacy incidents or user complaints about data handling
- ✅ AI guidance is perceived as helpful, not prescriptive
- ✅ Feature integrates smoothly with existing session workflow
- ✅ Performance: <3s initial AI response, smooth streaming
- ✅ Intentions are more thoughtful and specific (vs. baseline)

---

**Requirements Complete:** Ready for Step 2 (Database Design)
**Next Step:** Design database schema for optional intention storage, templates, and user preferences
