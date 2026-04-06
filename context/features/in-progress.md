# Features In Progress

**File Size Limit:** 300 lines
**Last Updated:** 2026-03-03

---

## Active Development

### FEAT-205 + FEAT-206: RAG Knowledge Base (Combined)
**Priority:** High
**Status:** Code complete, deploying this week
**Target:** Completed code 2026-02-25, deploying Mar 3-9
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

**Remaining deployment steps:**
- [ ] Run `python scripts/extract_all_pdfs.py` to extract remaining ~85 PDFs
- [ ] Run `python scripts/chunk_documents.py` to generate chunks
- [ ] Run `supabase db push` to apply migration
- [ ] Set `OPENAI_API_KEY` secret: `supabase secrets set OPENAI_API_KEY=sk-...`
- [ ] Deploy edge function: `supabase functions deploy embeddings`
- [ ] Run `python scripts/ingest_to_supabase.py` to embed + store (~$0.20, ~30-60 min)
- [ ] REINDEX the IVFFlat index after ingestion

---

## Recently Completed (Last 30 Days)

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
