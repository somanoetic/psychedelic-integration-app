# Feature Ideas Backlog

**File Size Limit:** 300 lines
**Last Updated:** 2026-03-03

---

## High Impact Ideas

### FEAT-314: Expand Nervous System Modalities (Somatic Experiencing + ANS)
**Priority:** Medium
**Status:** Idea - Future Enhancement
**Estimated Effort:** 2-3 weeks
**Target:** Q3 2026

**Concept:**
Expand beyond Polyvagal Theory to include Somatic Experiencing (SE), Window of Tolerance (Dan Siegel), and complementary ANS frameworks.

**Key Modalities:**
- **Somatic Experiencing (Peter Levine):** Pendulation, titration, completion of survival responses, resource building
- **Neuroception:** Safety/danger/life-threat detection, co-regulation, social engagement
- **Window of Tolerance (Dan Siegel):** Hyper/hypoarousal tracking, visual tracking over time
- **Embodiment Practices:** Grounding, orienting, boundary work, resourcing

**Implementation Ideas:**
- Extend `polyvagalAIService` to include SE concepts
- Add Window of Tolerance visualization alongside polyvagal ladder
- Integrate pendulation exercises into nervous system check-ins
- Track completion of activation cycles

**Why This Matters:**
- Polyvagal + SE are highly complementary — SE adds practical completion practices
- Window of Tolerance is more accessible language for some users
- Deepens the nervous system regulation toolkit

**Dependencies:**
- FEAT-104 (Polyvagal Ladder Visualization) should be complete first
- Would extend, not replace, existing polyvagal implementation

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
- Alternative: Summarize principles without direct quotes

**Next Steps:**
1. Contact author/publisher
2. Extract key frameworks (while awaiting permission)
3. If denied, create original inspired content

---

### FEAT-313: Cognitive Bias Modification (CBM) Integration
**Priority:** Medium-High
**Status:** Idea - Research Complete
**Estimated Effort:** 4-5 months (3 phases)
**Target:** Q2 2026

Evidence-based cognitive bias modification training during the neuroplastic window after psychedelic experiences. First psychedelic + CBM protocol (no published research exists).

**See:** `docs/FEAT-313-cbm-integration.md` (full spec) and `docs/CBM-strategy.md` (literature review)

---

### FEAT-303: Contextual Help System
**Priority:** Medium
**Status:** Idea
**Estimated Effort:** 3-4 days

**Concept:**
Add tooltips, tips, and progressive disclosure throughout app to educate users.

**Implementation Ideas:**
- Info icons next to features
- First-time pop-up tips
- Optional "Guide Mode"
- Help center section

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

**Format:** Text articles, audio talkthroughs, interactive explorations

---

## Platform Features

### FEAT-306: Push Notifications for Reminders
**Priority:** Low
**Status:** Idea
**Estimated Effort:** 3-4 days

Gentle reminders for breathwork, meditation, and practices. Requires push notification infrastructure, user preference settings, scheduling logic, opt-in/opt-out flow.

---

### FEAT-307: Cross-Platform Testing Coverage
**Priority:** High
**Status:** Idea (really a task)
**Estimated Effort:** 5-7 days

Test on iOS devices (iPhone SE, 12, 14 Pro), various Android versions, tablets, and landscape mode. Document device compatibility.

---

### FEAT-308: Performance Optimization
**Priority:** Low
**Status:** Idea
**Estimated Effort:** 2-3 days

Initial load time profiling, screen transition optimization, database query performance, image loading/caching, bundle size reduction.

---

### FEAT-309: Data Export Feature
**Priority:** Low
**Status:** Idea
**Estimated Effort:** 3-4 days

Allow users to export journal entries and data in PDF, JSON, CSV formats. Use cases: share with therapist, backup, GDPR data portability.

---

## Advanced Features

### FEAT-310: AI Journal Insights
**Priority:** Low
**Status:** Idea - Needs User Consent
**Estimated Effort:** 1 week

Use Claude API to analyze journal entries for pattern identification, emotional progress tracking, and integration practice suggestions. Requires user consent and careful privacy handling.

---

### FEAT-311: Community Features
**Priority:** Low
**Status:** Idea - High Complexity
**Estimated Effort:** 2+ weeks

Connect users for peer support: anonymous sharing, integration practice groups, moderated forums. Blocked by moderation requirements, privacy concerns, legal liability.

---

### FEAT-312: Wearable Integration
**Priority:** Low
**Status:** Idea - Long-term
**Estimated Effort:** 2+ weeks

Track biometrics (HRV, sleep quality, activity levels) during breathwork and meditation via Apple Watch, Fitbit, Oura Ring, Whoop.

---

### FEAT-315: Voice Conversation Mode (STT + TTS)
**Priority:** Medium
**Status:** Idea - Future Paid Feature
**Estimated Effort:** 3-5 days
**Monetization:** Paid subscription tier

Allow users to have voice conversations with the AI — speak instead of type, hear responses spoken aloud. Enables "eyes closed" integration experience. Leading approach: Whisper (OpenAI) for STT + ElevenLabs for TTS.

---

### FEAT-316: Relocate Progress Tracking from Practice Section
**Priority:** Medium
**Status:** Idea - UX Improvement
**Estimated Effort:** 1-2 days

Move "Progress Tracking" out of "Practice" section to a more intuitive location (top-level nav, "Insights" section, or home screen widget).

---

### FEAT-317: Therapist Portal (Share + Custom Exercises/RAG)
**Priority:** Medium-High
**Status:** Idea - Future (post-RAG deployment)
**Estimated Effort:** 2-3 weeks
**Depends On:** FEAT-205/206 (RAG pipeline deployed and validated)

Two-sided therapist integration: (1) "Share with your therapist" with selective, revocable sharing; (2) Therapist dashboard for custom exercises and reference materials fed into RAG pipeline for per-client personalization.

---

### FEAT-318: Replace OpenAI Embeddings with Voyage AI
**Priority:** Medium
**Status:** Idea - Near-term
**Estimated Effort:** 1-2 days

**Motivation:** Remove OpenAI dependency entirely. Voyage AI is Anthropic's recommended embedding partner.

**Current State:**
- `supabase/functions/embeddings/index.ts` calls OpenAI `text-embedding-3-small` (1536 dims)
- DB column: `vector(1536)` in `document_chunks` table
- `scripts/chunk_documents.py` uses `cl100k_base` tokenizer (local only, low priority)

**Migration Steps:**
1. Get Voyage AI API key, store as Supabase secret (`VOYAGE_API_KEY`)
2. Update edge function to call Voyage API (`voyage-3`, 1024 dims)
3. DB migration: alter `embedding` column from `vector(1536)` to `vector(1024)`, update IVFFlat index
4. Re-run ingestion pipeline to re-embed all chunks
5. Remove `OPENAI_API_KEY` from Supabase secrets

**Notes:**
- All existing embeddings must be regenerated (incompatible across models)
- Voyage `voyage-3` is top-ranked on MTEB benchmarks
- Cost comparable (~$0.06/1M tokens)

### FEAT-319: Voice Recording During Sessions
**Priority:** Medium
**Status:** Idea - Session Tool
**Estimated Effort:** 3-5 days

**Concept:**
Allow users to make voice recordings during a session to capture insights, realizations, and experiences in the moment. Recordings are saved and can be reviewed, transcribed, and integrated later.

**Key Features:**
- One-tap voice recording from Session Tools
- Automatic transcription (Whisper) for later review
- Link recordings to session timeline
- Integration prompts based on transcribed content

### FEAT-320: Expand Progress Tracking Beyond Exercises
**Priority:** Medium
**Status:** Idea - UX Enhancement
**Estimated Effort:** 2-3 days

**Concept:**
The CurriculumTracker currently only tracks exercise completions. Expand it to also track progress across learning modules (Education/Learn tab content) and other app features like completed inner work sessions, journal streaks, and nervous system check-in history — giving users a holistic view of their growth.

---

## Rejected Ideas

### REJECTED: Auto-Post to Social Media
**Reason:** Privacy concerns, not aligned with app values

---

## Review Process

**Quarterly:** Review all ideas, promote promising ones to planned.md, archive stale ideas.

**Criteria for Promotion:** Clear user value, feasible to build, aligns with vision, resources available.

---

**Current Count:** 16 ideas (active consideration)
