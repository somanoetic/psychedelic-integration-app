# Requirements: AI Monitoring & Observability (FEAT-203)

## Problem Statement

**Multi-faceted monitoring challenge for AI guidance system:**

1. **Quality & Safety (Primary)**: Track AI interaction quality, detect inappropriate responses, ensure user safety through conversation monitoring
2. **Performance & Cost (Secondary)**: Monitor response times, token usage, API costs to optimize efficiency
3. **Debugging (Tertiary)**: Enable troubleshooting of AI failures with detailed error context and traces

**Users:**
- **Primary**: Developers/admins needing observability into AI system behavior
- **Secondary**: Engineers troubleshooting production issues
- **End-users**: Indirectly benefit from improved AI quality and reliability (but don't see metrics directly)

**Pain Points:**
- Zero visibility into production AI behavior
- Unable to identify quality issues or dangerous patterns
- No cost tracking or performance optimization data
- Difficult to debug AI failures without detailed context

## Acceptance Criteria

- ✅ Database schema created with `ai_metrics` and `ai_routing_decisions` tables
  - Proper RLS policies for user data protection
  - Indexes for common query patterns
  - JSONB metadata for flexible context storage
  
- ✅ All 9 AI services instrumented with metrics logging:
  - masterContextService.js
  - conversationalRoutingService.js
  - enhancedClaudeService.js (Huxley)
  - ifsAIService.js
  - polyvagalAIService.js
  - nervousSystemMappingAIService.js
  - triggersGlimmersAIService.js
  - coreBeliefsAIService.js
  - dailyJournalAIService.js
  - regulatingResourcesAIService.js
  
- ✅ Sentry integration active for production error tracking
  - Configured with PII protection
  - Transaction tracing for AI conversations
  - Context-rich error reporting
  
- ✅ Four SQL views created for dashboard queries:
  - `ai_metrics_daily` - Daily metrics summary by service
  - `ai_service_health` - 24-hour health snapshot
  - `routing_effectiveness` - Routing decision analysis
  - `context_cache_performance` - Cache hit rate tracking
  
- ✅ Metrics logging service (`lib/metricsService.js`) with:
  - Async logging (non-blocking)
  - Batch insert optimization
  - Error handling that doesn't break app
  - Token counting and cost estimation utilities

## Scope

### In Scope

**Database Layer:**
- Two tables: `ai_metrics` and `ai_routing_decisions`
- Row Level Security (RLS) policies
- Indexes for performance
- Four SQL views for common queries

**Metrics Collection:**
- Service instrumentation for all 9 AI services
- Performance metrics (response time, tokens, cost)
- Success/failure tracking with error messages
- Routing decision logging with confidence scores
- Cache hit/miss tracking
- Crisis detection flagging

**Error Tracking:**
- Sentry SDK integration
- Transaction tracing
- PII protection in error reports
- Context enrichment for AI-specific errors

**Basic Dashboard:**
- Simple React Native admin screen
- Display key metrics from SQL views
- No fancy charts - just numbers and cards
- Admin-only access

**Documentation:**
- `docs/MONITORING.md` with setup instructions
- Example queries for common questions
- Sentry access documentation
- Alert threshold explanations

### Out of Scope

**❌ Complex Visualizations:**
- No charts, graphs, or time-series visualizations
- No real-time dashboards with live updates
- Keep it simple: cards with numbers only

**❌ Advanced Alerting:**
- No PagerDuty/OpsGenie integration
- No SMS/phone call alerts
- Basic Supabase edge function alerting only
- No 24/7 on-call rotation setup

**❌ User-Facing Metrics:**
- End users don't see AI performance data
- No in-app statistics or quality scores
- Metrics are admin/developer-only

**❌ Long-Term Data Retention:**
- Focus on recent data (24 hours to 30 days)
- No historical trend analysis beyond 30 days
- No data warehouse or BI tool integration

## Technical Constraints

1. **Follow Existing Patterns:**
   - Use Supabase for database with RLS policies
   - Follow existing service structure in `lib/`
   - Match current code style and patterns

2. **Performance Requirements:**
   - Metrics logging MUST be async (non-blocking)
   - Maximum 50ms overhead per AI call
   - Batch inserts for efficiency
   - Logging failures must not break app functionality

3. **Privacy & Security:**
   - Don't log user message content (metadata only)
   - RLS policies protect user data
   - Sentry configured to strip PII
   - No API keys or secrets in logs

4. **Reliability:**
   - Metrics logging errors must not affect user experience
   - Graceful degradation if logging fails
   - Try/catch around all logging calls

## Technology Stack

**Frontend:**
- React Native 0.81.5
- Expo ~54.0.25
- React Navigation (for admin dashboard routing)

**Backend/Database:**
- Supabase (PostgreSQL)
- Supabase RLS for security
- Supabase Edge Functions (for basic alerting)

**Error Tracking:**
- Sentry React Native SDK
- Transaction tracing enabled
- PII protection configured

**AI Integration:**
- Claude API (existing)
- Token counting for cost estimation
- Anthropic pricing model integration

## Dependencies

**Service Dependencies:**
- ✅ Depends on all 9 existing AI services in `lib/`:
  - `masterContextService.js` - Context aggregation
  - `conversationalRoutingService.js` - Message routing
  - `enhancedClaudeService.js` - Huxley AI conversations
  - `ifsAIService.js` - Internal Family Systems work
  - `polyvagalAIService.js` - Nervous system regulation
  - `nervousSystemMappingAIService.js` - NS mapping
  - `triggersGlimmersAIService.js` - Triggers/glimmers tracking
  - `coreBeliefsAIService.js` - Core beliefs exploration
  - `dailyJournalAIService.js` - Journal prompts
  - `regulatingResourcesAIService.js` - Resource recommendations

**Performance Impact:**
- Async logging adds minimal overhead (<10ms per call)
- All AI services will call metrics logging
- Batch inserts reduce database load

**External Dependencies:**
- Requires Sentry account and DSN configuration
- Needs `SENTRY_DSN` environment variable
- Requires Sentry CLI for sourcemap uploads (optional)

**No Blocking Dependencies:**
- Feature is additive and non-breaking
- Can be deployed incrementally (service by service)
- Rollback strategy: remove metrics calls, drop tables

## Configuration

- **Stack:** react-native-supabase
- **API Style:** rest
- **Complexity:** medium
- **Estimated Time:** 2 days
- **Phase:** AI System Improvements Phase 1 (Week 1)
- **Priority:** High
- **Related Tasks:** 
  - Previous: FEAT-202 (AI Architecture Documentation) - Complete
  - Next: FEAT-204 (AI Testing Infrastructure)

## Key Metrics to Track

**Performance Metrics:**
- Response time (avg, p95, p99)
- Token usage per service
- Cost per conversation
- Cache hit rate

**Quality Metrics:**
- Success rate (% successful calls)
- Error rate by service
- Routing confidence scores
- Crisis detection accuracy

**Usage Metrics:**
- Calls per service per day
- Most used routes
- Active users
- Conversations per user

**Business Metrics:**
- Total AI cost per day/month
- Cost per user
- API quota usage
- Service uptime
