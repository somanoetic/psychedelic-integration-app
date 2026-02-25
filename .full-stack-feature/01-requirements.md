# Requirements: FEAT-101: Complete Session Day Checklist

**Feature ID:** FEAT-101
**Priority:** High
**Target Phase:** Phase 1 (Weeks 1-4)
**Estimated Effort:** 3-4 days

---

## Problem Statement

Users preparing for psychedelic sessions face three interconnected challenges:

1. **Forgetfulness**: Critical preparation steps are forgotten (fasting, hydration, space setup, safety arrangements)
2. **Anxiety**: Lack of structure creates stress during an already vulnerable preparation phase
3. **Fragmentation**: Preparation information is scattered across notes, articles, and memory

The Session Day Checklist addresses all three by providing a centralized, structured, and trackable preparation workflow. Users gain confidence knowing they haven't missed important steps, reducing pre-session anxiety and improving session outcomes.

**User:** Individuals preparing for psychedelic experiences who want comprehensive, guided preparation support.

---

## Acceptance Criteria

### Must Have (V1)
- [x] **View default checklist template** - Pre-built checklist with evidence-based preparation items
- [x] **Check off completed items** - Interactive checkboxes to track completion status
- [x] **Customize checklist** - Add, remove, or edit items to match personal needs
- [x] **Progress persistence** - Checklist state saved to database, survives app restarts
- [x] **Per-session tracking** - Each session has its own checklist instance
- [x] **Stored with session data** - Checklist integrated into session preparation flow

### Success Metrics
- Users complete ≥80% of checklist items before sessions
- Reduced pre-session anxiety (self-reported)
- Feature used in 70%+ of session preparations

---

## Scope

### In Scope (V1)
- Default checklist template with ~15-20 preparation items
- Per-session checklist instances (each session gets a copy of template)
- Interactive UI for checking items off
- Add/remove/edit custom items per session
- Progress saved to Supabase database
- Integration with existing session preparation screens
- Offline viewing of checklist (local state while offline)

### Out of Scope (V1 - Future Enhancements)
- ❌ **Multiple checklist templates** - V1 has one default template; different templates for substances/settings comes in V2
- ❌ **AI-generated checklist suggestions** - No AI personalization in V1; potential V2 enhancement using journal history
- ❌ **Sharing checklists with others** - V1 is personal only; no social features
- ✅ **Reminders/notifications** - IN SCOPE if time permits (push notifications for incomplete items)

---

## Technical Constraints

### Must Follow
1. **Existing architecture patterns** - Follow established React Native component structure
2. **Supabase + RLS** - All data stored in Supabase with Row Level Security enabled
3. **User ownership** - Users can only access their own checklists (enforced by RLS)
4. **Session integration** - Checklist tied to existing `sessions` table
5. **Offline resilience** - Should work gracefully when offline (show cached state)
6. **Performance** - Checklist load time < 500ms; checkbox interactions < 100ms

### Database Constraints
- Maximum 50 checklist items per session (prevent abuse)
- Item descriptions limited to 500 characters
- Checklist template versioning (for future updates without breaking existing)

---

## Technology Stack

### Frontend
- **Framework:** React Native 0.81.5
- **Navigation:** React Navigation (integrate with existing session prep flow)
- **State:** React hooks (useState, useEffect)
- **Local Storage:** AsyncStorage for offline draft state
- **UI Components:** Custom components following Noesis aesthetic

### Backend
- **Database:** Supabase (PostgreSQL)
- **API:** Supabase client for CRUD operations
- **Auth:** Existing Supabase Auth (user_id for RLS)
- **Real-time:** Optional - Supabase real-time for multi-device sync

### No AI Required
- This feature does NOT require Claude API
- Pure React Native + Supabase feature
- AI integration is explicitly out of scope for V1

---

## Dependencies

### Depends On (Required)
1. **Session preparation flow** - Checklist must integrate with existing session screens
   - `SessionPreparationScreen.js` (or similar)
   - `sessions` table in Supabase
2. **Supabase client** - Existing `lib/supabase.js` setup
3. **User authentication** - Supabase Auth for user_id in RLS policies

### Affects (Integration Points)
1. **Session creation flow** - When user creates session, initialize checklist from template
2. **Session detail view** - Display checklist completion status
3. **Navigation** - Add checklist screen to session prep navigation stack

### No Blockers
- All required dependencies are already implemented
- Can start development immediately

---

## User Stories

### Epic: Session Preparation Checklist

**Story 1:** View Default Checklist
> As a user preparing for a session, I want to see a comprehensive checklist so that I know what steps to take.

**Story 2:** Track Completion
> As a user, I want to check off items as I complete them so that I can track my progress visually.

**Story 3:** Customize Items
> As a user, I want to add my own preparation steps so that the checklist matches my unique needs.

**Story 4:** Save Progress
> As a user, I want my checklist progress to save automatically so that I don't lose my work if I close the app.

**Story 5:** Per-Session Tracking
> As a user, I want each session to have its own checklist instance so that I can prepare multiple sessions independently.

---

## Default Checklist Template (Content)

### Physical Preparation (5 items)
- [ ] Fast for 4-6 hours before session (if applicable)
- [ ] Stay hydrated - drink plenty of water throughout day
- [ ] Get good sleep the night before
- [ ] Eat light, healthy meals earlier in day
- [ ] Avoid alcohol for 24 hours before

### Safety & Support (4 items)
- [ ] Arrange for sitter/trip sitter if needed
- [ ] Share intentions and plans with trusted person
- [ ] Ensure emergency contacts are available
- [ ] Have harm reduction resources on hand

### Mental/Emotional Preparation (4 items)
- [ ] Set clear intentions for the session
- [ ] Journal about current emotional state
- [ ] Practice grounding/centering meditation
- [ ] Release expectations and cultivate openness

### Practical Logistics (5 items)
- [ ] Prepare comfortable, safe space (clean, organized)
- [ ] Gather supplies (water, blanket, music, journal)
- [ ] Set up music playlist or soundscape
- [ ] Turn off phone notifications / minimize distractions
- [ ] Clear schedule for remainder of day (no obligations)

**Total:** 18 default items

---

## Configuration

- **Stack:** react-native-supabase
- **API Style:** REST (Supabase client)
- **Complexity:** Medium
- **Estimated Timeline:** 3-4 days
  - Day 1: Database schema + backend API
  - Day 2: Frontend components
  - Day 3: Integration + testing
  - Day 4: Polish + bug fixes

---

## Open Questions

1. **Checklist template versioning:** How to handle updates to default template without breaking existing user checklists?
   - **Answer:** Store template version with each instance; migrate on access if needed

2. **Ordering:** Should users be able to reorder checklist items?
   - **Answer:** V2 feature; V1 uses fixed order (can edit text only)

3. **Categories:** Should checklist items be grouped into collapsible categories (Physical, Safety, etc.)?
   - **Answer:** V1 flat list; V2 can add categories

4. **Completion badge:** Show completion percentage or visual indicator?
   - **Answer:** YES - show "12/18 items complete" at top

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Session prep screen doesn't exist yet | High | Medium | Create minimal screen as part of feature |
| Users add 100+ items, performance degrades | Medium | Low | Enforce 50-item limit in database |
| Template content needs expert review | Medium | Medium | Start with research-based content, iterate |
| Users want categories/reordering immediately | Low | High | Clear communication: V2 features |

---

## Next Steps

1. ✅ Requirements complete
2. → Database design (Step 2)
3. → Architecture design (Step 3)
4. → Implementation (Steps 4-6)
5. → Testing (Step 7)
6. → Deployment (Step 8)

---

**Document Version:** 1.0
**Last Updated:** 2026-02-09
**Status:** ✅ Complete - Ready for Step 2
