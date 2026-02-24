# Features In Progress

**File Size Limit:** 300 lines
**Last Updated:** 2026-02-24

---

## Active Development

### FEAT-205: Knowledge Base Processing
**Priority:** High
**Status:** Planned (starting this week)
**Target:** Week of 2026-02-24
**Assigned:** Unassigned

**User Story:**
As a developer, I want to convert the 1.5GB knowledge base (276 PDFs) into searchable embeddings so that AI services can reference real therapeutic protocols.

**Requirements:**
- [ ] Convert PDFs to markdown with YAML frontmatter
- [ ] Create protocol schema
- [ ] Set up Supabase pgvector extension
- [ ] Generate and store embeddings
- [ ] Create similarity search functions

**Dependencies:**
- Supabase pgvector extension must be enabled

**Estimated Effort:** 5 days

See `context/features/ai-system-improvements.md` for full spec.

---

### FEAT-206: RAG System Integration
**Priority:** High
**Status:** Planned (following FEAT-205)
**Target:** Week of 2026-03-02
**Assigned:** Unassigned

**User Story:**
As a user, I want AI responses grounded in real therapeutic research so that guidance is evidence-based.

**Requirements:**
- [ ] Create RAG service class
- [ ] Integrate into 2-3 AI services (IFS, Polyvagal, Nervous System)
- [ ] Test and optimize retrieval quality
- [ ] Document RAG patterns and rollout plan

**Dependencies:**
- FEAT-205 (knowledge base processing)

**Estimated Effort:** 5 days

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

**Current Count:** 2 planned to start, 7 completed this month
**File Status:** Under limit (300 max)
