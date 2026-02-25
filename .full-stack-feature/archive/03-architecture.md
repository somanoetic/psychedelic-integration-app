# AI Monitoring & Observability - Architecture Design

**Feature:** FEAT-203 - AI Monitoring & Observability
**Date:** 2026-02-09
**Stack:** React Native + Supabase + Sentry

---

## Architecture Highlights

### Backend Architecture

**MetricsService (lib/metricsService.js)**
- **Async/Non-blocking**: Fire-and-forget logging, never delays AI responses
- **Batched inserts**: Collects 100 metrics or flushes every 10s (whichever comes first)
- **Resilient**: Fails silently if logging breaks - app continues
- **Methods**: logAIMetric(), logRoutingDecision(), logError(), getMetricsSummary(), getServiceHealth(), getCostSummary()

**Instrumentation Pattern**
- Standard wrapper for all 9 AI services
- Try/catch around Claude API calls
- Metrics logged in both success and error paths
- Timing via Date.now() before/after
- Token counting from API response
- Cost estimation (Claude Sonnet 4.5: $3/1M input, $15/1M output)

**Sentry Integration**
- Initialized in App.js with PII protection (beforeSend hook)
- Transaction tracing for AI calls
- Context enrichment (service, operation, userId)
- Error capture with stack traces
- 10% transaction sample rate

### Frontend Architecture

**AdminMetricsDashboard** (React Native Screen)
- Simple card-based layout (NO charts/graphs - just numbers)
- Auto-refresh every 30 seconds
- Admin-only access via role check
- Components:
  - SystemOverviewCard (total calls, success rate, avg response time)
  - ServiceHealthCard × 9 (one per AI service)
  - CostSummaryCard (30-day costs, top 3 services)
  - ErrorSummaryCard (24h errors, link to Sentry)
  - RoutingEffectivenessCard (routing confidence, common routes)

**State Management**
- useEffect for data loading
- Fetch from SQL views via Supabase
- RefreshControl for pull-to-refresh
- Loading/error states
- No complex state - just fetch and display

**Data Flow**
```
AI Service Call
  ├─> Sentry (immediate)
  └─> MetricsService Queue
        └─> Batch flush every 10s → Supabase
              └─> SQL Views (refreshed every 15 min)
                    └─> Admin Dashboard (polls every 30s)
```

---

## Cross-Cutting Concerns

**Error Handling**
- Metrics logging errors never break app
- Try/catch around all logging calls
- Fail silently, log to console only
- Sentry + database for redundancy

**Security**
- Never log user message content (metadata only)
- Sentry strips PII via beforeSend
- RLS on all metrics tables
- Admin role check for dashboard
- Service role key in .env (never committed)

**Performance**
- Async logging adds <10ms overhead
- Batch inserts: 98% reduction in DB writes
- SQL views pre-compute aggregations
- Dashboard refreshes every 30s (not real-time)

**Risk Mitigation**
- Async fire-and-forget prevents blocking
- Flush timer prevents unbounded queue growth
- Try/catch prevents DB failures from breaking app
- Token estimation accepts 10-15% error margin

---

## Implementation Phases

**Phase 1: Backend (Week 1)**
- Create metricsService.js with batching
- Add Sentry to App.js
- Test async logging doesn't block AI

**Phase 2: Instrumentation (Week 2)**
- Instrument all 9 AI services
- Test metrics logging works

**Phase 3: Frontend (Week 3)**
- Build AdminMetricsDashboard
- Create all card components
- Add navigation & access control

**Phase 4: Testing (Week 4)**
- Security audit (PII, RLS, API keys)
- Load test (1000 AI calls)
- Performance test (measure overhead)

---

**See full architecture document output above for:**
- Complete metricsService.js implementation
- Instrumentation code examples for all service types
- Full component implementations (Dashboard, Cards)
- Sentry setup and configuration
- Security checklist and risk matrix
- SQL optimization strategies
- Future enhancement roadmap

