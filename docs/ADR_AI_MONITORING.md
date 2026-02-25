# Architecture Decision Record: AI Monitoring & Observability

**Feature:** FEAT-203
**Date:** 2026-02-09
**Status:** Accepted
**Deciders:** Engineering Team, Product Team
**Context:** Need comprehensive monitoring for 9 AI services powering Psycheteleos integration experience

---

## Table of Contents

1. [Context](#context)
2. [Decision Summary](#decision-summary)
3. [Key Decisions](#key-decisions)
4. [Rationale](#rationale)
5. [Alternatives Considered](#alternatives-considered)
6. [Consequences](#consequences)
7. [Implementation Notes](#implementation-notes)

---

## Context

### Problem Statement

The Psycheteleos app uses 9 AI services (Enhanced Claude/Huxley, IFS AI, Polyvagal AI, etc.) for therapeutic integration work. Before this feature:

**Zero visibility into:**
- AI service performance and costs
- Error patterns and debugging context
- Routing quality and user experience
- User safety (crisis detection, inappropriate responses)

**Challenges:**
- Each AI call costs $0.002-$0.10 (adds up quickly)
- Users report slow responses but no data to investigate
- No way to detect if AI is routing users incorrectly
- Cannot debug production AI failures (no context)
- Compliance risk (no audit trail for AI decisions)

### Requirements

1. **Performance Monitoring:** Track response times, success rates, error patterns
2. **Cost Tracking:** Monitor API costs per service, per user, per day
3. **Quality Assurance:** Detect low-quality responses, routing failures, crisis situations
4. **Debugging:** Detailed error logs with stack traces and context
5. **Privacy:** Never log user message content (GDPR/HIPAA)
6. **Non-Blocking:** Logging must not slow down AI responses
7. **Admin Dashboard:** Simple UI to view key metrics

---

## Decision Summary

We decided to build an **in-app monitoring system** with:

1. **Batch logging** (10s/100-item flush) to Supabase
2. **Materialized views** for dashboard performance
3. **RLS policies** for data isolation
4. **Sentry integration** for production errors
5. **Admin-only dashboard** (React Native cards)
6. **PII protection** (no user message text logging)

**Key Architecture:**
```
AI Service → MetricsService (batch queue) → Supabase (RLS) → Materialized Views → Dashboard
            └─> Sentry (immediate) ─────────────────────────────────────────────^
```

---

## Key Decisions

### Decision 1: Batch Logging Instead of Immediate Insert

**Choice:** Queue metrics in memory, flush every 10 seconds or 100 items (whichever comes first)

**Why:**
- **Performance:** Reduces database writes by 98% (10,000 individual writes → 100 batch writes)
- **Non-blocking:** Fire-and-forget, never awaits database insert
- **Resilient:** If batch fails, app continues (just loses those metrics)

**Trade-offs:**
- Metrics delayed by up to 10 seconds (acceptable for monitoring)
- Risk of losing metrics if app crashes before flush (rare, low impact)

**Alternative Considered:** Immediate insert on every AI call
- ❌ Would add 50-100ms per call (unacceptable)
- ❌ Would create 10,000 database connections/day (expensive)

**Code Example:**
```javascript
// Fire-and-forget logging
metricsService.logAIMetric({ ... });  // Returns immediately

// Batched in memory
this.batchQueue.push(metric);

// Flushed periodically
setInterval(() => this.flush(), 10000);
```

---

### Decision 2: Materialized Views Instead of Real-Time Queries

**Choice:** Pre-compute dashboard queries in materialized views, refresh every 15 minutes

**Why:**
- **Performance:** Dashboard loads in <100ms vs 2-5s for raw table queries
- **Simplicity:** No complex caching layer needed
- **Database Efficiency:** Reduces load on Supabase (1 refresh vs 100 dashboard views)

**Trade-offs:**
- Data is up to 15 minutes stale (acceptable for admin dashboard)
- Requires scheduled job to refresh views

**Alternative Considered:** Real-time queries on raw tables
- ❌ Dashboard queries take 2-5 seconds (poor UX)
- ❌ Heavy database load if multiple admins viewing dashboard
- ❌ Would need aggressive caching (complex)

**Example View:**
```sql
CREATE MATERIALIZED VIEW mv_service_performance_last_7d AS
SELECT
    service_name,
    COUNT(*) as total_calls,
    AVG(duration_ms) as avg_duration,
    SUM(estimated_cost_usd) as cost
FROM ai_metrics
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY service_name;

-- Refresh every 15 minutes
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_service_performance_last_7d;
```

---

### Decision 3: RLS Instead of Application-Layer Security

**Choice:** Use Supabase Row Level Security (RLS) policies for access control

**Why:**
- **Defense in Depth:** Security enforced at database level (can't be bypassed)
- **Supabase Native:** Works seamlessly with Supabase auth
- **Simple:** No complex application-layer permission checks
- **GDPR Compliant:** Users automatically see only their own data

**Trade-offs:**
- Requires careful policy design (test thoroughly)
- Debugging can be harder (need to impersonate users)

**Alternative Considered:** Application-layer checks (`if (user.id === metric.userId)`)
- ❌ Can be bypassed if bug in application code
- ❌ Must remember to check in every query
- ❌ Harder to audit

**Example Policies:**
```sql
-- Users see only their own metrics
CREATE POLICY "Users can view own metrics"
ON ai_metrics FOR SELECT
USING (auth.uid() = user_id);

-- Admins see everything
CREATE POLICY "Admins can view all metrics"
ON ai_metrics FOR SELECT
USING (is_admin());
```

---

### Decision 4: Admin Dashboard Instead of External Monitoring Tool

**Choice:** Build simple React Native admin dashboard in-app

**Why:**
- **Integrated:** No need to leave app to check metrics
- **Custom:** Tailored to our specific AI services and needs
- **Private:** No third-party access to our data
- **Simple:** Just cards with numbers (no complex charts)

**Trade-offs:**
- Limited features compared to DataDog, New Relic, etc.
- Requires maintenance and updates
- No advanced alerting (yet)

**Alternative Considered:** External tool like DataDog
- ❌ Expensive ($300-500/month for our scale)
- ❌ Third-party has access to metrics (privacy concern)
- ❌ Overkill for our needs (we don't need APM tracing, distributed tracing, etc.)
- ✅ Would get advanced alerting, better visualization

**When to Reconsider:** If we scale to 10K+ users or need 24/7 on-call alerting

---

### Decision 5: 90-Day Retention Instead of Permanent

**Choice:** Keep metrics for 90 days, then archive to cold storage

**Why:**
- **Cost:** PostgreSQL storage is expensive ($0.10-0.25/GB/month)
- **Performance:** Smaller tables = faster queries
- **GDPR:** Right to erasure easier with shorter retention
- **Sufficient:** 90 days is enough for most analysis

**Trade-offs:**
- Cannot do long-term trend analysis (12+ months)
- Must export data if need historical reports

**Alternative Considered:** Permanent storage
- ❌ Database would grow to 12 GB/year (1K users)
- ❌ Queries would slow down significantly over time
- ❌ Higher costs ($30-60/year just for storage)

**Archival Strategy:**
```sql
-- Move to cheaper S3-backed storage
INSERT INTO ai_metrics_archive
SELECT * FROM ai_metrics WHERE created_at < NOW() - INTERVAL '90 days';

DELETE FROM ai_metrics WHERE created_at < NOW() - INTERVAL '90 days';
```

---

### Decision 6: Sentry Integration for Errors

**Choice:** Use Sentry for production error tracking alongside database logging

**Why:**
- **Best Practice:** Sentry is industry-standard for error tracking
- **Rich Context:** Stack traces, breadcrumbs, user context
- **Alerting:** Built-in alerting for error spikes
- **Redundancy:** If database logging fails, we still have Sentry

**Trade-offs:**
- $26/month cost (Team tier)
- Requires PII stripping configuration

**Alternative Considered:** Database-only error logging
- ❌ No alerting (would have to check dashboard manually)
- ❌ No stack trace source maps (harder debugging)
- ❌ No error grouping (duplicate errors clutter dashboard)

**Integration:**
```javascript
Sentry.captureException(error, {
  tags: { service: 'enhancedClaude' },
  contexts: { metric: { userId, duration } }
});

metricsService.logError({
  serviceName: 'enhancedClaude',
  sentryId: sentryEventId,  // Link database → Sentry
  ...
});
```

---

### Decision 7: No User Message Text Logging (PII Protection)

**Choice:** Never log user input text, only metadata (length, detected intents)

**Why:**
- **Privacy:** User messages may contain trauma, mental health disclosures (sensitive)
- **GDPR:** Logging full text requires explicit consent + justification
- **Security:** Less risk if database is breached
- **Sufficient:** Metadata is enough for routing quality analysis

**Trade-offs:**
- Cannot debug routing failures by reading actual user input
- Must rely on detected intents (less precise)

**Alternative Considered:** Log first 200 characters
- ❌ Still contains PII (user names, places, personal details)
- ❌ Creates legal liability (must disclose in privacy policy)
- ❌ Users would feel uncomfortable (trust issue)

**What We Log Instead:**
```javascript
metricsService.logRoutingDecision({
  selectedRoute: 'ifs_chat',
  confidence: 0.85,
  inputLength: 42,  // Character count only
  detectedIntents: ['ifs', 'parts_work'],  // Keywords only
  // NO inputText field
});
```

---

## Rationale

### Why These Decisions Together?

The architecture balances five competing priorities:

1. **Performance:** Batch logging + materialized views = <10ms overhead, <100ms dashboard
2. **Cost:** 90-day retention + efficient indexes = ~$25/month for 1K users
3. **Privacy:** RLS + PII protection = GDPR/HIPAA compliant
4. **Simplicity:** In-app dashboard + Sentry = no complex integrations
5. **Reliability:** Fire-and-forget + graceful degradation = never breaks app

**Key Insight:** Monitoring is *secondary* to user experience. If logging fails, app must continue. This shaped every decision.

---

## Alternatives Considered

### Alternative 1: External SaaS (DataDog, New Relic)

**Pros:**
- Professional-grade monitoring (APM, distributed tracing, logs)
- Advanced alerting (PagerDuty integration, on-call)
- No maintenance (they handle infrastructure)
- Beautiful dashboards out-of-the-box

**Cons:**
- Expensive ($300-500/month for our scale)
- Third-party access to our data (privacy risk)
- Overkill for our needs (we don't need full APM)
- Requires API integration for AI-specific metrics

**Verdict:** ❌ Not cost-effective at current scale. **Revisit at 10K+ users.**

---

### Alternative 2: Real-Time Event Streaming (Kafka, Kinesis)

**Pros:**
- True real-time metrics (no batching delay)
- Scalable to millions of events/day
- Decoupled architecture (services publish, consumers subscribe)

**Cons:**
- Significant complexity (Kafka cluster, consumers, etc.)
- Expensive ($200+/month for managed service)
- Overkill for 10K events/day
- Requires specialized knowledge to maintain

**Verdict:** ❌ Over-engineering. Batch logging sufficient for our scale.

---

### Alternative 3: Client-Side Analytics (Amplitude, Mixpanel)

**Pros:**
- Designed for user behavior tracking
- Great for product analytics
- Automatic session replay, funnels, cohorts

**Cons:**
- Not designed for server-side AI metrics
- Would need to send metrics from client (privacy concern)
- Less flexible for custom AI metrics
- Expensive for our volume

**Verdict:** ❌ Wrong tool for the job. Better for product analytics than AI monitoring.

---

### Alternative 4: Log Aggregation (ELK Stack, Splunk)

**Pros:**
- Powerful log search and analysis
- Good for debugging production issues
- Can handle unstructured data

**Cons:**
- Expensive (Elastic Cloud $95/month minimum)
- Requires log parsing and indexing (complex)
- Not designed for metrics (better for logs)
- Over-engineered for our needs

**Verdict:** ❌ Too heavy. Sentry + database simpler and cheaper.

---

## Consequences

### Positive Consequences

**For Engineers:**
- ✅ Can debug production AI issues with full context
- ✅ Identify performance bottlenecks in minutes
- ✅ Cost visibility drives optimization decisions
- ✅ Sentry alerts prevent silent failures

**For Product:**
- ✅ Data-driven AI quality improvements
- ✅ Can justify AI costs to stakeholders
- ✅ Identify which services users prefer
- ✅ Track effectiveness of routing improvements

**For Users:**
- ✅ Better AI quality (we can detect and fix issues)
- ✅ Faster responses (we optimize slow services)
- ✅ Privacy protected (no message content logged)
- ✅ More reliable (error tracking prevents breakage)

### Negative Consequences

**Technical Debt:**
- ⚠️ Must maintain custom dashboard (not outsourced)
- ⚠️ Materialized views require scheduled refresh (operational complexity)
- ⚠️ Metrics delayed by 10s (not real-time)

**Operational:**
- ⚠️ Must monitor Sentry quota (50K errors/month on Team tier)
- ⚠️ Must archive metrics every 90 days (manual process)
- ⚠️ Dashboard doesn't auto-alert (must check manually)

**Scaling Concerns:**
- ⚠️ Batch queue could overflow at 100K+ requests/hour (need backpressure)
- ⚠️ Database will slow down at 10M+ rows (need partitioning)
- ⚠️ Materialized view refresh takes longer as data grows

### Migration Path

If we outgrow this system (10K+ users):

1. **Phase 1: Keep architecture, add alerting**
   - Add Supabase Edge Functions for real-time alerts
   - Integrate with Slack/PagerDuty

2. **Phase 2: Add real-time dashboard**
   - Switch from materialized views to real-time queries
   - Add query caching layer (Redis)

3. **Phase 3: Move to external SaaS**
   - Export metrics to DataDog or New Relic
   - Keep database as backup/audit trail

---

## Implementation Notes

### What Went Well

**1. Batch Logging Performance:**
- Overhead measured at 2-5ms (target: <10ms) ✅
- Zero impact on AI response times
- Batch flush takes 50-100ms for 100 items

**2. Materialized Views:**
- Dashboard queries <50ms (target: <100ms) ✅
- 15-minute refresh completes in 5-10 seconds
- Acceptable staleness for admin use case

**3. RLS Policies:**
- Zero security incidents in testing ✅
- Users cannot see others' metrics (verified)
- Admins have full access (verified)

**4. PII Protection:**
- No user message text in database (audited) ✅
- Sentry PII stripping working correctly
- Routing analysis possible with metadata only

### What Was Challenging

**1. Sentry PII Stripping:**
- Initial config leaked user IDs in breadcrumbs
- Fixed with custom `beforeSend` hook
- Required thorough testing to verify

**2. RLS Policy Complexity:**
- Admin check initially used mutable user metadata
- Switched to dedicated `user_roles` table
- Required additional security migration

**3. Service Role Key Security:**
- Initially used client-side for metrics insert
- Moved to RLS policies + authenticated client
- Simplified architecture and improved security

**4. Memory Leak in Dashboard:**
- Auto-refresh interval not cleaned up properly
- Fixed by adding `loadData` to useEffect dependencies
- Caught during testing phase

### Key Metrics

**Development Time:**
- Database schema: 4 hours
- Backend service: 6 hours
- Frontend dashboard: 8 hours
- Security fixes: 4 hours
- Testing: 6 hours
- **Total: 28 hours (3.5 days)**

**Test Coverage:**
- Unit tests: 47 tests (metricsService)
- Integration tests: 27 tests (database)
- Component tests: 25 tests (dashboard)
- E2E tests: 17 tests (full flow)
- **Total: 116 tests, 87.5% coverage ✅**

**Security Issues Found:**
- 2 Critical (hardcoded keys, auth bypass)
- 4 High (service key, PII logging, GDPR function, admin check)
- 4 Medium (stack traces, PII stripping, view access, rate limiting)
- 3 Low (service account, JSONB constraints, archival)
- **All Critical/High fixed before deployment ✅**

---

## Future Improvements

### Short-Term (Next Sprint)

**1. Real-Time Alerting**
- Supabase Edge Function for error spike detection
- Slack webhook integration
- Alert when error rate >5% in last hour

**2. Cost Budgets**
- Set per-user daily cost limits
- Alert when approaching monthly budget
- Throttle requests after limit

**3. Advanced Error Grouping**
- Group similar errors by stack trace
- Track error lifecycle (first seen, last seen, count)
- Mark errors as resolved

### Medium-Term (Next Quarter)

**4. Query Caching**
- Add 30-second cache layer for dashboard queries
- Reduce database load by 80%
- Optional: Use Redis for distributed caching

**5. Custom Dashboards**
- Allow admins to create custom views
- Filter by date range, service, user
- Export to CSV

**6. Routing Quality Improvements**
- Track routing "regret" (user corrects AI's choice)
- A/B test routing algorithms
- Auto-improve routing based on feedback

### Long-Term (Next Year)

**7. Predictive Analytics**
- Predict user churn based on AI quality
- Forecast costs based on growth trends
- Anomaly detection (unusual patterns)

**8. User-Facing Insights**
- Show users their own AI usage stats
- Gamification (streaks, milestones)
- Personalized recommendations

**9. Multi-Region Support**
- Replicate metrics across regions
- Aggregate for global dashboard
- Handle clock skew and eventual consistency

---

## Lessons Learned

### Do This Again

1. ✅ **Batch logging:** Huge performance win, minimal complexity
2. ✅ **Materialized views:** Perfect for admin dashboard use case
3. ✅ **RLS policies:** Security best practice, worth the setup
4. ✅ **PII protection:** Sleep well knowing we're compliant
5. ✅ **Sentry integration:** Caught production errors we'd have missed

### Do Differently

1. ⚠️ **Start with alerting:** We should have added this from day 1
2. ⚠️ **Plan for archival:** Automated archival, not manual
3. ⚠️ **More partial indexes:** We over-indexed at first, then optimized
4. ⚠️ **Admin roles table:** Should have designed this from start (not user metadata)
5. ⚠️ **Query caching:** Dashboard could be even faster with simple cache

---

## Decision Record

**Status:** ✅ **Accepted**

**Date:** 2026-02-09

**Approved By:**
- Engineering Lead: [Name]
- Product Manager: [Name]
- Security Review: [Name]

**Next Review:** 2026-05-09 (3 months)

**Review Criteria:**
- Is dashboard performance still acceptable (<100ms)?
- Are costs within budget (<$50/month for 1K users)?
- Do we need more advanced alerting?
- Should we migrate to external monitoring tool?

---

## References

### Documentation

- Complete Guide: `docs/MONITORING.md`
- API Reference: `docs/API_REFERENCE.md`
- Database Schema: `docs/DATABASE_SCHEMA.md`
- Instrumentation Guide: `.full-stack-feature/INSTRUMENTATION_GUIDE.md`
- Security Fixes: `.full-stack-feature/SECURITY_FIXES.md`

### Related Decisions

- `context/decisions/2026-01-15-ai-architecture.md` - Overall AI system design
- `context/decisions/2026-01-20-supabase-rls.md` - RLS security model
- `context/decisions/2026-01-25-error-handling.md` - Error handling strategy

### External Resources

- [Anthropic API Pricing](https://www.anthropic.com/api)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Sentry React Native](https://docs.sentry.io/platforms/react-native/)
- [PostgreSQL Materialized Views](https://www.postgresql.org/docs/current/rules-materializedviews.html)

---

**Document Version:** 1.0
**Last Updated:** 2026-02-09
**Maintainer:** Engineering Team
**Next Review:** 2026-05-09
