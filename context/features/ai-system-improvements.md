# AI System Improvements

**File Size Limit:** 300 lines
**Last Updated:** 2026-03-03

---

## Overview

This feature tracks the systematic improvement of the AI guidance system based on the comprehensive assessment documented in `docs/AI_SYSTEM_ASSESSMENT.md`.

**Current State:** Production AI system with 9 specialized services, master context aggregation, and Huxley personality guide.

**Assessment Grade:** A- (Excellent foundation with growth potential)

---

## Phase 1: Foundation & Cleanup (Complete)

All Phase 1 features delivered 2026-02-09 to 2026-02-24.

| Feature | Summary | Completed |
|---------|---------|-----------|
| FEAT-201 | Code organization cleanup — deduplicated services, moved to `lib/`, documented in `lib/README.md` | 2026-02-09 (d691963) |
| FEAT-202 | AI architecture docs — 3 Mermaid diagrams, `docs/AI_ARCHITECTURE.md` (~850 lines), `docs/PROMPT_ENGINEERING.md` (~700 lines), JSDoc on 3 critical services | 2026-02-09 |
| FEAT-203 | AI monitoring — MetricsService (`lib/metricsService.js`), AdminMetricsDashboard, ai_metrics DB schema. Sentry deferred (version mismatch with Expo) | 2026-02-24 |
| FEAT-204 | Testing infrastructure — Jest configured, 365 tests across 9 suites, 92% statement coverage on 4 critical services, crisis detection verified | 2026-02-24 |

---

## Phase 2: RAG Integration (Planned)

### FEAT-205: Knowledge Base Processing
**Priority:** High
**Status:** Planned
**Effort:** 5 days
**Target:** Week 3

**Current State:** 1.5GB knowledge base (276 PDFs) not integrated

**Tasks:**
- [ ] Convert PDFs to markdown with YAML frontmatter
- [ ] Create protocol schema (id, modality, phase, safety_level, contraindications, tags)
- [ ] Set up Supabase pgvector (extension, embeddings table, similarity search functions)
- [ ] Generate embeddings (semantic chunking, indexing)

**Acceptance Criteria:**
- All PDFs converted to markdown
- Protocols stored in database with embeddings
- Semantic search working

---

### FEAT-206: RAG System Integration
**Priority:** High
**Status:** Planned
**Effort:** 5 days
**Target:** Week 4

**Tasks:**
- [ ] Create RAGService (retrieveProtocols with topK, similarity threshold, modality filter)
- [ ] Integrate into 2-3 AI services (ifsAIService, polyvagalAIService, nervousSystemMappingAIService)
- [ ] Test and optimize (compare with/without RAG, tune thresholds, measure latency, implement caching)
- [ ] Document and create rollout plan

**Acceptance Criteria:**
- RAG service retrieving relevant protocols
- 3 services using RAG successfully
- Response quality improved measurably
- Latency acceptable (< 2s p95)

---

## Phase 3: Outcome Measurement (Planned)

### FEAT-207: Assessment Integration
**Priority:** Medium
**Status:** Planned
**Effort:** 5 days
**Target:** Week 5

**Tasks:**
- [ ] Add standardized assessments (PHQ-9, GAD-7, PCL-5, custom integration metrics)
- [ ] Progress tracking system (DB schema, calculation engine, trend analysis, goal setting)
- [ ] Data collection points (pre/post session, weekly check-ins, milestone tracking)

**Database Schema:**
```sql
assessments (id, user_id, type, score, responses, timestamp, session_id)
progress_metrics (id, user_id, metric_type, value, timestamp, context)
milestones (id, user_id, type, title, description, achieved_at, metadata)
```

---

### FEAT-208: Progress Dashboard
**Priority:** Medium
**Status:** Planned
**Effort:** 5 days
**Target:** Week 6

**Tasks:**
- [ ] Design dashboard UI (wireframes, Noesis color scheme, chart types)
- [ ] Implement visualizations (nervous system timeline, parts work progression, assessment scores, integration milestones, practice adherence, belief change tracking)
- [ ] Generate insights (pattern identification, progress summaries, celebration of wins)

---

## Phase 4: Advanced Features (Planned)

### FEAT-209: Multi-Model Support
**Priority:** Medium
**Status:** Planned
**Effort:** 5 days
**Target:** Week 7

**Tasks:**
- [ ] Design model router (preferred model, fallbacks, max latency, cost priority)
- [ ] Integrate GPT-4 as fallback (adapt prompts, test quality, cost comparison)
- [ ] A/B testing framework (quality metrics, user satisfaction, cost analysis)

**Benefits:** 99.9%+ uptime, 30-50% cost savings potential, vendor independence

---

### FEAT-210: Implement Planned AI Features
**Priority:** High
**Status:** Planned
**Effort:** 5 days
**Target:** Week 8

Includes FEAT-102 (AI Intention Setting Guidance, 3 days) and FEAT-103 (Pre-Session Check-In, 2 days). See `context/features/planned.md` for full details.

---

## Success Metrics

- **Technical:** Response time < 2s (p95), cache hit rate > 70%, API error rate < 1%, test coverage > 80%, uptime > 99.5%
- **UX:** User satisfaction > 4.5/5, crisis detection accuracy > 95%, routing accuracy > 90%, session completion > 70%
- **Clinical:** PHQ-9/GAD-7 improvement tracked, parts unburdening completion rate, nervous system regulation trends
- **Business:** AI cost per user per month, user retention, clinical outcomes vs. benchmarks

---

## Long-Term Vision (Month 3+)

**Month 3:** Full polyvagal mapping, clinician oversight portal, advanced RAG with re-ranking, custom fine-tuned models

**Month 4-6:** Community protocol contributions, research study capabilities, advanced analytics, mobile optimization

---

## Related Documents

- `docs/AI_SYSTEM_ASSESSMENT.md` - Comprehensive assessment
- `docs/AI_THERAPY_SPECIALIZATION_ROADMAP.md` - Long-term vision
- `context/features/planned.md` - Other planned features
- `context/bugs/INDEX.md` - Related bugs

---

**Current Count:** 8 features in roadmap (4 complete, 4 planned)
**Total Estimated Effort:** 8 weeks
