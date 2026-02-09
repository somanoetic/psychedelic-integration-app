# AI System Improvements

**File Size Limit:** 300 lines
**Last Updated:** 2026-02-09

---

## Overview

This feature tracks the systematic improvement of the AI guidance system based on the comprehensive assessment documented in `docs/AI_SYSTEM_ASSESSMENT.md`.

**Current State:** Production AI system with 9 specialized services, master context aggregation, and Huxley personality guide.

**Assessment Grade:** A- (Excellent foundation with growth potential)

---

## Phase 1: Foundation & Cleanup (Weeks 1-2)

### FEAT-201: Code Organization Cleanup ✅
**Priority:** High
**Status:** Complete
**Effort:** 1 day
**Completed:** 2026-02-09

**Problems Fixed:**
- ✅ Service file duplication removed
- ✅ Services moved to correct directory
- ✅ Naming conventions documented
- ✅ Context service relationships clarified

**Completed Tasks:**
- [x] Move all services from `enhanced-components/` to `lib/`
  - `experienceMappingService.js`
  - `therapeuticIntegrationService.js`
  - `fallbackIntegrationService.js`
- [x] Remove duplicate `enhancedClaudeService.js` files
- [x] Remove duplicate `EnhancedConversationScreen.js`
- [x] Update all imports (6 files updated)
- [x] Document service structure in `lib/README.md`
  - Naming conventions (stateful classes vs singletons)
  - Service relationships and architecture
  - Master context system diagram
  - Usage examples and best practices

**Acceptance Criteria Met:**
- ✅ No duplicate service files
- ✅ All services in `lib/` directory
- ✅ Consistent naming pattern documented
- ✅ Service hierarchy documented in `lib/README.md`

**Commit:** d691963 "FEAT-201: Clean up service organization and naming"

---

### FEAT-202: AI Architecture Documentation
**Priority:** High
**Status:** Planned
**Effort:** 2 days
**Target:** Week 1

**Current State:** Minimal inline documentation, no architecture diagram

**Tasks:**
- [ ] Create visual diagram of service relationships
  - Master context as central hub
  - Specialized services consuming context
  - Routing service coordinating flow
  - Huxley as personality layer
- [ ] Document master context flow
  - Data sources
  - Aggregation logic
  - Caching strategy
  - Usage patterns
- [ ] Add inline comments to key services
  - `masterContextService.js`
  - `conversationalRoutingService.js`
  - `enhancedClaudeService.js`
- [ ] Write architectural overview (assessment is foundation)
- [ ] Document prompt engineering decisions
  - Why certain frameworks chosen
  - Voice principles rationale
  - Context injection strategy

**Deliverables:**
- `docs/AI_ARCHITECTURE.md` with diagrams
- `docs/PROMPT_ENGINEERING.md` documenting decisions
- Inline documentation in critical services
- Service relationship diagram (Mermaid or similar)

**Acceptance Criteria:**
- New developer can understand system in < 1 hour
- Service relationships clear
- Prompt decisions documented
- Diagrams visualize architecture

---

### FEAT-203: AI Monitoring & Observability
**Priority:** High
**Status:** Planned
**Effort:** 2 days
**Target:** Week 1

**Current State:** No monitoring, no observability

**Tasks:**
- [ ] Set up Sentry for error tracking
- [ ] Create AI metrics logging
  - Response times to database
  - Routing decisions
  - API errors
  - Context cache hit rates
- [ ] Build simple dashboard in Supabase
  - Key metrics visualization
  - Error rates
  - Response time trends
  - Cost tracking
- [ ] Set up alerting
  - High error rate
  - Slow response times
  - API quota warnings

**Database Schema:**
```sql
ai_metrics (
  id, timestamp, service, operation,
  response_time_ms, tokens_used, cost,
  success, error_message, user_id
)

ai_routing_decisions (
  id, timestamp, user_id, user_message,
  detected_intent, route_selected,
  confidence, alternatives
)
```

**Acceptance Criteria:**
- All AI calls logged to metrics table
- Dashboard showing key metrics
- Alerts configured for anomalies
- Error tracking with Sentry

---

### FEAT-204: AI Testing Infrastructure
**Priority:** High
**Status:** Planned
**Effort:** 4 days
**Target:** Week 2

**Current State:** ❌ No automated tests (BUG-203)

**Tasks:**
- [ ] Set up Jest for React Native (1 day)
  - Configure test environment
  - Set up mocking for Claude API
  - Create test utilities
  - Example test for one service
- [ ] Unit tests for critical services (2 days)
  - `masterContextService.js` - context aggregation
  - `conversationalRoutingService.js` - intent detection
  - `huxleyKnowledgeBase.js` - scenario detection
  - Offline fallback behavior
  - Error handling
- [ ] Integration tests (1 day)
  - End-to-end conversation flows
  - Context propagation across services
  - Crisis detection and routing
  - Multi-turn conversations

**Test Coverage Goals:**
- Critical paths: 80%+
- Master context: 90%+
- Routing logic: 85%+
- Fallback behavior: 100%

**Acceptance Criteria:**
- Jest configured and running
- 20+ unit tests passing
- 5+ integration tests passing
- CI/CD integration (future)
- Test documentation for new developers

---

## Phase 2: RAG Integration (Weeks 3-4)

### FEAT-205: Knowledge Base Processing
**Priority:** High
**Status:** Planned
**Effort:** 5 days
**Target:** Week 3

**Current State:** 1.5GB knowledge base (276 PDFs) not integrated

**Tasks:**
- [ ] Convert PDFs to markdown (2 days)
  - Use `scripts/convert-pdfs.py` or similar
  - Structure with YAML frontmatter
  - Organize by modality/category
  - Quality check conversions
- [ ] Create protocol schema (1 day)
  ```yaml
  ---
  id: ifs-six-fs
  modality: IFS
  phase: active-session
  safety_level: standard
  requires_stabilization: false
  contraindications: [acute-psychosis, active-suicidality]
  tags: [parts-work, self-energy, unburdening]
  ---
  ```
- [ ] Set up Supabase pgvector (1 day)
  - Enable pgvector extension
  - Create embeddings table
  - Create similarity search functions
- [ ] Generate embeddings (1 day)
  - Chunk content semantically
  - Generate embeddings (OpenAI or Anthropic)
  - Store in Supabase
  - Create indexes

**Database Schema:**
```sql
protocols (
  id, name, modality, phase, safety_level,
  contraindications, tags, content, version,
  created_at, updated_at
)

protocol_embeddings (
  id, protocol_id, chunk_text, embedding,
  chunk_index, metadata
)
```

**Acceptance Criteria:**
- All PDFs converted to markdown
- Protocols stored in database
- Embeddings generated and indexed
- Semantic search working

---

### FEAT-206: RAG System Integration
**Priority:** High
**Status:** Planned
**Effort:** 5 days
**Target:** Week 4

**Tasks:**
- [ ] Create RAG service (1 day)
  ```javascript
  class RAGService {
    async retrieveProtocols(query, options = {
      topK: 3,
      similarityThreshold: 0.7,
      modality: null,
      safetyLevel: 'standard'
    })
  }
  ```
- [ ] Integrate into 2-3 AI services (2 days)
  - Start with `ifsAIService.js`
  - Add to `polyvagalAIService.js`
  - Test with `nervousSystemMappingAIService.js`
  - Inject retrieved protocols into prompts
- [ ] Test and optimize (1 day)
  - Compare responses with/without RAG
  - Tune similarity thresholds
  - Measure latency impact
  - Implement caching
- [ ] Document and rollout plan (1 day)
  - Document RAG patterns
  - Create integration guide
  - Plan rollout to remaining services
  - User testing protocol

**Acceptance Criteria:**
- RAG service retrieving relevant protocols
- 3 services using RAG successfully
- Response quality improved measurably
- Latency acceptable (< 2s p95)
- Rollout plan documented

---

## Phase 3: Outcome Measurement (Weeks 5-6)

### FEAT-207: Assessment Integration
**Priority:** Medium
**Status:** Planned
**Effort:** 5 days
**Target:** Week 5

**Tasks:**
- [ ] Add standardized assessments (2 days)
  - PHQ-9 (depression) - 9 questions
  - GAD-7 (anxiety) - 7 questions
  - PCL-5 (PTSD) - 20 questions
  - Custom integration metrics
  - Scoring algorithms
- [ ] Progress tracking system (2 days)
  - Database schema for metrics
  - Calculation engine
  - Historical tracking
  - Trend analysis
  - Goal setting
- [ ] Data collection points (1 day)
  - Pre/post session assessments
  - Weekly check-ins
  - Milestone tracking
  - Practice adherence

**Database Schema:**
```sql
assessments (
  id, user_id, type, score, responses,
  timestamp, session_id
)

progress_metrics (
  id, user_id, metric_type, value,
  timestamp, context
)

milestones (
  id, user_id, type, title, description,
  achieved_at, metadata
)
```

**Acceptance Criteria:**
- Assessments implemented and validated
- Scoring algorithms accurate
- Data collection automated
- Historical tracking working

---

### FEAT-208: Progress Dashboard
**Priority:** Medium
**Status:** Planned
**Effort:** 5 days
**Target:** Week 6

**Tasks:**
- [ ] Design dashboard UI (1 day)
  - Wireframes
  - Noesis color scheme
  - Chart types selection
- [ ] Implement visualizations (3 days)
  - Nervous system state timeline
  - Parts work progression chart
  - Assessment scores over time
  - Integration milestone markers
  - Practice adherence graphs
  - Belief change tracking
- [ ] Generate insights (1 day)
  - Pattern identification
  - Progress summaries
  - Celebration of wins
  - Next steps recommendations

**Deliverables:**
- ProgressDashboardScreen component
- Chart components
- Insights engine
- Celebration system

**Acceptance Criteria:**
- Dashboard shows comprehensive progress
- Charts are clear and meaningful
- Insights are actionable
- Users motivated by visualizations

---

## Phase 4: Advanced Features (Weeks 7-8)

### FEAT-209: Multi-Model Support
**Priority:** Medium
**Status:** Planned
**Effort:** 5 days
**Target:** Week 7

**Tasks:**
- [ ] Design model router (1 day)
  ```javascript
  class AIModelRouter {
    async getResponse(prompt, options = {
      preferredModel: 'claude',
      fallbacks: ['gpt4', 'gemini'],
      maxLatency: 3000,
      prioritizeCost: false
    })
  }
  ```
- [ ] Integrate GPT-4 (2 days)
  - OpenAI API integration
  - Adapt prompts for GPT-4
  - Test response quality
  - Cost comparison
- [ ] A/B testing framework (2 days)
  - Test different models per service
  - Measure quality metrics
  - User satisfaction tracking
  - Cost analysis

**Benefits:**
- 99.9%+ uptime (fallback to GPT-4)
- 30-50% cost savings potential
- Quality optimization per task
- Vendor independence

**Acceptance Criteria:**
- GPT-4 integrated as fallback
- Model selection working
- Cost savings demonstrated
- Quality maintained or improved

---

### FEAT-210: Implement Planned AI Features
**Priority:** High (from context/features/planned.md)
**Status:** Planned
**Effort:** 5 days
**Target:** Week 8

**Includes:**
- FEAT-102: AI Intention Setting Guidance (3 days)
- FEAT-103: Pre-Session Check-In (2 days)

See `context/features/planned.md` for full details.

---

## Success Metrics

### Technical Metrics
- Response time < 2s (p95)
- Context cache hit rate > 70%
- API error rate < 1%
- Test coverage > 80% for critical paths
- Uptime > 99.5%

### User Experience Metrics
- User satisfaction with AI > 4.5/5
- Crisis detection accuracy > 95%
- Routing accuracy > 90%
- Session completion rate > 70%

### Clinical Metrics
- PHQ-9/GAD-7 improvement tracked
- Parts unburdening completion rate
- Nervous system regulation trends
- Integration milestone achievement

### Business Metrics
- AI cost per user per month
- Time saved vs. human therapy
- User retention
- Clinical outcomes vs. benchmarks

---

## Long-Term Vision (Month 3+)

**Month 3:**
- FEAT-104: Full polyvagal mapping
- Clinician oversight portal
- Advanced RAG with re-ranking
- Custom fine-tuned models

**Month 4-6:**
- Community protocol contributions
- Research study capabilities
- Advanced analytics
- Mobile optimization

---

## Related Documents

- `docs/AI_SYSTEM_ASSESSMENT.md` - Comprehensive assessment
- `docs/AI_THERAPY_SPECIALIZATION_ROADMAP.md` - Long-term vision
- `context/features/planned.md` - Other planned features
- `context/bugs/INDEX.md` - Related bugs (BUG-203: Testing)

---

**Current Count:** 10 features in roadmap
**Total Estimated Effort:** 8 weeks
**Status:** Ready for implementation

**Next Action:** Present to user, get prioritization, begin Phase 1
