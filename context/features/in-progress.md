# Features In Progress

**File Size Limit:** 300 lines
**Last Updated:** 2026-06-16

---

## Active Development

### Voice Conversation with Huxley — PAUSED (pivoted to narration-only)
**Status:** ⏸️ PAUSED 2026-06-02. Phase 1 (plumbing) + Phase 2 (chat integration + full voice loop)
both BUILT (per voice-conversation-phase1.md), but turn-based STT couldn't clear the "guide IRL"
bar, so the conversational voice path was shelved. Pivoted to **narration-only** — Huxley reads
exercise steps aloud in `screens/GuidedExerciseScreen.js` via `voiceService.speak()` (built, not
yet device-verified). Edge functions (`whisper-transcribe`, `elevenlabs-tts`) + `lib/voiceService.js`
exist. Do NOT restart conversational Phase 2; if revisited, use streaming STT.
**See:** [voice-conversation-phase1.md](voice-conversation-phase1.md)
**Started:** 2026-05-15 · **Paused:** 2026-06-02



### FEAT-205 + FEAT-206: RAG Knowledge Base (Combined) ✅ DEPLOYED
**Priority:** High
**Status:** ✅ DEPLOYED & LIVE — verified 2026-06-16 (move to Recently Completed)
**Target:** Code complete 2026-02-25; deployed/ingested ~Feb 25
**Assigned:** Claude AI

**Code Complete:**
- [x] PDF extraction script (auto-discovers all 276 PDFs)
- [x] Semantic chunking script (tiktoken, section-aware)
- [x] Supabase pgvector migration (IVFFlat index)
- [x] Embeddings edge function (search/embed/ingest)
- [x] Bulk ingestion pipeline script
- [x] Client-side RAG service (5-min cache, graceful degradation)
- [x] Integrated into all 9 AI services with category-scoped search
- [x] 19 unit tests (all passing)
- [x] ADR-008 documented

**Deployment — VERIFIED LIVE (2026-06-16):**
- [x] Extract + chunk: `scripts/chunked_documents.jsonl` = 21,166 chunks / 281 source docs
- [x] Migration applied — `knowledge_documents` + `document_chunks` tables exist in live Supabase
- [x] `OPENAI_API_KEY` set as a **Supabase secret** (NOT in local `.env` — see note)
- [x] `embeddings` edge function deployed — `search` action returns 200 with relevant results
- [x] Ingestion + embeddings done — live counts: **281 docs / 21,648 chunks**, embeddings populated (1536-dim)
- [x] Vector search verified end-to-end — semantically relevant, ranked results across 5 test queries

**Verification evidence (2026-06-16):**
- Live `document_chunks` count = 21,648 (vs 21,166 in the chunk file — ~2% drift, likely a re-run)
- Sample query "how do I work with a part that feels protective" → correct IFS protector-part chunk
- 5 timed queries all returned 5 results in ~0.9–1.4s (incl. OpenAI query-embedding round-trip)

**⚠️ Open follow-ups (do NOT block "deployed" status):**
- **IVFFlat index likely under-tuned.** Migration sets `lists = 20` (sized for ~14K vectors); actual
  corpus is 21,648 → rule-of-thumb target is `lists ≈ sqrt(21,648) ≈ 150`. The schema's `CREATE INDEX`
  also runs on an *empty* table, so unless a REINDEX ran post-ingestion the centroids were built on zero
  rows. **Cannot confirm REINDEX from outside the DB.** Fix: in Supabase SQL editor, `DROP INDEX
  idx_document_chunks_embedding; CREATE INDEX ... WITH (lists = 150);` (~30s). Tracked as a new low-pri item.
- **`OPENAI_API_KEY` missing from local `.env`** — production works (key is a Supabase secret), but
  re-running `scripts/ingest_to_supabase.py` locally will fail until the key is added locally.
- **Encoding artifacts in chunks** — smart quotes / some Unicode render as `�` (PDF-extraction encoding).
  Cosmetic; doesn't affect retrieval. Improve extraction encoding if clean source text is ever surfaced to users.
- `extracted_documents.jsonl` (step-1 intermediate) no longer on disk — only final chunk file remains. Re-extract if needed.

---

## Recently Completed (Last 30 Days)

### FEAT-103: AI Nervous System & Parts Check-In ✅
**Completed:** 2026-03-15 (approx)
**Deliverables:** NervousSystemCheckin, PartsCheckin components, NervousSystemSummaryScreen, PartsSummaryScreen, ConversationalNervousSystemMapping, NervousSystemEducationWidget, PolyvagalEducationWidget, NervousSystemIndicator, 4 database tables (nervous_system_checkins, parts_checkins, nervous_system_context, polyvagal_patterns)

### FEAT-104: Polyvagal Mapping AI Integration ✅
**Completed:** 2026-03-15 (approx)
**Deliverables:** polyvagalAIService, nervousSystemMappingAIService, polyvagalContextService, NervousSystemMappingModeHandler (full Deb Dana protocol), NervousSystemExplorationModeHandler (freeform), PolyvagalCheckinModeHandler (quick), versioned pattern tracking

### FEAT-101: Session Day Checklist ✅
**Completed:** 2026-02-24
**Deliverables:** SessionChecklistScreen, sessionChecklistService, useSessionChecklist hook

### FEAT-102: AI Intention Guidance ✅
**Completed:** 2026-02-24
**Deliverables:** SetIntentionScreen, intentionGuidanceAIService, intentionGuidanceService

### FEAT-201: Code Organization Cleanup ✅
**Completed:** 2026-02-09
**Deliverables:** Services reorganized to lib/, duplicates removed

### FEAT-202: AI Architecture Documentation ✅
**Completed:** 2026-02-09
**Deliverables:** AI_ARCHITECTURE.md, PROMPT_ENGINEERING.md (~1,550 lines)

### FEAT-203: AI Monitoring & Observability ✅
**Completed:** 2026-02-24
**Deliverables:** MetricsService, AdminMetricsDashboard

### FEAT-204: AI Testing Infrastructure ✅
**Completed:** 2026-02-24
**Deliverables:** 477 tests passing, jest config, shared fixtures

### FEAT-001: Context Management System ✅
**Completed:** 2026-02-08
**Deliverables:** Full context/ directory with tracking system

---

## Blocked

*No features currently blocked*

---

## Guidelines

### When to Move Here
- Feature is ready to start
- Developer assigned
- Requirements clear
- No blockers

### While In Progress
- Update status weekly minimum
- Mark blockers immediately
- Track actual vs. estimated effort
- Communicate delays early

### When Complete
- Mark complete with date
- Move to "Recently Completed" section
- Archive after 30 days

---

**Current Count:** 1 deploying, 7 completed this month
**File Status:** Under limit (300 max)
