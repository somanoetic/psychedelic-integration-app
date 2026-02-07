# Feature Ideas Backlog

**File Size Limit:** 300 lines
**Last Updated:** 2026-02-07

---

## High Impact Ideas

### FEAT-301: "Huxley" AI Guide Character
**Priority:** Medium
**Status:** Idea - Needs Exploration
**Estimated Effort:** 5-7 days

**Concept:**
A wise, gentle AI guide character named after Aldous Huxley that provides companionship and guidance throughout the app.

**Open Questions:**
- Character vs. tool approach?
- Chat interface or ambient presence?
- Avatar design or text-only?
- User preference to enable/disable?

**Concerns:**
- Could feel gimmicky
- Privacy (users may not want AI analyzing everything)
- API costs for chat
- Dependency risk

**Alternative:**
Simple "AI Guide" or "Integration Assistant" without character persona.

**Next Steps:**
- Test with simple AI guidance first
- Gather user feedback
- Decide on personality vs. utility

---

### FEAT-302: Integrate "After the Ceremony" Book Content
**Priority:** High
**Status:** Idea - Needs Permission
**Estimated Effort:** 4-5 days

**Concept:**
Incorporate frameworks and practices from "After the Ceremony" book into the app.

**Content to Extract:**
- Integration timeline (hours, days, weeks, months)
- Common challenges and navigation
- Evidence-based practices
- When to seek professional help

**Legal Blockers:**
- Need permission from author/publisher
- May require licensing agreement
- Alternative: Summarize principles without direct quotes

**Next Steps:**
1. Contact author/publisher
2. Extract key frameworks (while awaiting permission)
3. If denied, create original inspired content

---

### FEAT-303: Contextual Help System
**Priority:** Medium
**Status:** Idea
**Estimated Effort:** 3-4 days

**Concept:**
Add tooltips, tips, and progressive disclosure throughout app to educate users.

**Implementation Ideas:**
- Info icons (ℹ️) next to features
- First-time pop-up tips
- Optional "Guide Mode"
- Help center section

**Content Needed:**
- Write tips for each screen
- Create visual indicators
- Test for helpfulness vs. annoyance

---

## Content & Education

### FEAT-304: Onboarding Flow
**Priority:** Medium
**Status:** Idea
**Estimated Effort:** 3-4 days

**Concept:**
First-time user experience explaining app features and purpose.

**Screens:**
1. Welcome screen with app overview
2. Feature highlights (swipeable cards)
3. Permissions requests
4. Quick tutorial for key features
5. Optional profile setup

---

### FEAT-305: Wisdom Traditions Content
**Priority:** Low
**Status:** Idea
**Estimated Effort:** Ongoing

**Topics:**
- Buddhist concepts (emptiness, compassion)
- Stoic philosophy (amor fati)
- Taoism (wu wei, flow)
- Indigenous wisdom (interconnection)
- Perennial philosophy

**Format:**
- Text articles
- Audio talkthroughs
- Interactive explorations

---

## Platform Features

### FEAT-306: Push Notifications for Reminders
**Priority:** Low
**Status:** Idea
**Estimated Effort:** 3-4 days

**Concept:**
Gentle reminders for breathwork, meditation, and practices.

**Requirements:**
- Push notification infrastructure
- User preference settings
- Scheduling logic
- Opt-in/opt-out flow

---

### FEAT-307: Cross-Platform Testing Coverage
**Priority:** High
**Status:** Idea (really a task)
**Estimated Effort:** 5-7 days

**Needed:**
- Test on iOS devices (iPhone SE, 12, 14 Pro)
- Test on various Android versions
- Test on tablets (iPad, Android)
- Test landscape mode
- Document device compatibility

---

### FEAT-308: Performance Optimization
**Priority:** Low
**Status:** Idea
**Estimated Effort:** 2-3 days

**Areas:**
- Initial load time profiling
- Screen transition optimization
- Database query performance
- Image loading/caching
- Bundle size reduction

---

### FEAT-309: Data Export Feature
**Priority:** Low
**Status:** Idea
**Estimated Effort:** 3-4 days

**Concept:**
Allow users to export journal entries and data in multiple formats.

**Formats:**
- PDF (formatted nicely)
- JSON (machine-readable)
- CSV (spreadsheet)

**Use Cases:**
- Share with therapist
- Backup data
- Analyze in other tools
- Data portability (GDPR)

---

## Advanced Features

### FEAT-310: AI Journal Insights
**Priority:** Low
**Status:** Idea - Needs User Consent
**Estimated Effort:** 1 week

**Concept:**
Use Claude API to analyze journal entries and provide insights.

**Features:**
- Pattern identification
- Emotional progress tracking
- Suggest integration practices
- Highlight themes

**Considerations:**
- User consent required
- Privacy concerns
- API cost management
- Accuracy and liability

---

### FEAT-311: Community Features
**Priority:** Low
**Status:** Idea - High Complexity
**Estimated Effort:** 2+ weeks

**Concept:**
Connect users for peer support.

**Features:**
- Anonymous sharing
- Integration practice groups
- Moderated forums

**Blockers:**
- Moderation requirements
- Privacy and anonymity concerns
- Legal liability
- Platform maintenance cost

---

### FEAT-312: Wearable Integration
**Priority:** Low
**Status:** Idea - Long-term
**Estimated Effort:** 2+ weeks

**Concept:**
Track biometrics during breathwork and meditation.

**Metrics:**
- Heart rate variability (HRV)
- Sleep quality
- Activity levels

**Devices:**
- Apple Watch
- Fitbit
- Oura Ring
- Whoop

**Blockers:**
- API access
- Device partnerships
- Complex integration

---

## Rejected Ideas

### REJECTED: Auto-Post to Social Media
**Reason:** Privacy concerns, not aligned with app values
**Date:** N/A (never seriously considered)

---

## Migration Notes

**From old BUGS_AND_FEATURE_REQUESTS.md:**
- Many features migrated to planned.md (high priority)
- Medium/low priority features moved here
- Some features are really tasks (testing, documentation)

---

## Review Process

**Quarterly Review:**
- Go through all ideas
- Promote promising ones to planned.md
- Archive/reject stale ideas
- Add new ideas from user feedback

**Criteria for Promotion:**
- Clear user value
- Feasible to build
- Aligns with vision
- Resources available

---

**Current Count:** 12 ideas (active consideration)
**File Status:** Under limit (280 lines / 300 max)
