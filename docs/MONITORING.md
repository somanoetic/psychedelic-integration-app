# AI Monitoring & Observability - Complete Guide

**Feature:** FEAT-203
**Version:** 1.0
**Status:** Production Ready
**Last Updated:** 2026-02-09

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Architecture](#architecture)
4. [Using the Admin Dashboard](#using-the-admin-dashboard)
5. [Understanding Metrics](#understanding-metrics)
6. [Monitoring Best Practices](#monitoring-best-practices)
7. [Troubleshooting](#troubleshooting)
8. [Cost Management](#cost-management)
9. [Security & Privacy](#security--privacy)
10. [Maintenance](#maintenance)

---

## Overview

### What Is This?

The AI Monitoring & Observability system provides comprehensive visibility into the Psycheteleos app's AI services. It tracks performance, costs, errors, and quality metrics for all 9 AI services that power the integration experience.

### Key Capabilities

**Performance Monitoring**
- Response time tracking (avg, p95, p99)
- Token usage and API efficiency
- Cache hit rates
- Service health indicators

**Cost Tracking**
- Per-service cost breakdown
- User-level cost tracking
- Daily/weekly/monthly summaries
- Budget alerting

**Quality Monitoring**
- Success rates by service
- Error patterns and frequencies
- Routing confidence scores
- Crisis detection accuracy

**Error Tracking**
- Detailed error logs with stack traces
- Sentry integration for production errors
- Error patterns and trends
- Quick links to debugging tools

### Business Value

- **Reduce AI Costs:** Identify expensive operations and optimize token usage
- **Improve Quality:** Detect and fix low-quality AI responses quickly
- **Faster Debugging:** Detailed error context reduces troubleshooting time
- **User Safety:** Monitor for crisis detection failures or inappropriate responses
- **Compliance:** Audit trail for AI decisions (GDPR/HIPAA compatible)

---

## Getting Started

### Prerequisites

- Admin role in the Psycheteleos app
- Access to Supabase project
- (Optional) Sentry account for advanced error tracking

### Quick Start (5 Minutes)

1. **Access the Dashboard**
   - Open the Psycheteleos app
   - Navigate to Settings → Admin → AI Metrics Dashboard
   - You'll see the system overview automatically load

2. **Explore Key Metrics**
   - **Total Calls:** How many AI requests in the last 7 days
   - **Success Rate:** % of successful AI responses
   - **Avg Response Time:** How fast AI services respond
   - **Total Cost:** Estimated API costs for the period

3. **Check Service Health**
   - Scroll down to see individual service cards
   - Each shows: calls, success rate, avg duration, cost
   - Red indicators = issues to investigate

4. **Review Errors**
   - Error Summary Card shows top errors in last 24h
   - Tap "View in Sentry" to see full stack traces
   - Use error patterns to identify systemic issues

5. **Analyze Routing**
   - Routing Effectiveness Card shows AI routing quality
   - Average confidence score should be >70%
   - Low confidence = users getting wrong experience

### Initial Setup (First Time)

If you're setting this up for the first time:

1. **Database Setup** (15 minutes)
   ```bash
   # Navigate to project directory
   cd psychedelic-integration-app

   # Apply database migration
   psql -h "[project-id].supabase.co" -U postgres -d postgres \
     -f supabase/migrations/20260209000000_ai_monitoring_schema.sql

   # Verify setup
   psql -h "[project-id].supabase.co" -U postgres -d postgres \
     -f deployment/health-check.sql
   ```

2. **Grant Admin Access**
   ```sql
   -- In Supabase SQL Editor
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('your-user-uuid-here', 'admin');
   ```

3. **Configure Environment Variables**
   ```bash
   # In .env file
   ANTHROPIC_API_KEY=your-claude-api-key
   SENTRY_DSN=your-sentry-dsn  # Optional but recommended
   ```

4. **Enable Sentry** (Optional, 5 minutes)
   - Create account at sentry.io
   - Create new project (React Native)
   - Copy DSN to `.env`
   - Restart app

5. **Set Up Materialized View Refresh** (5 minutes)
   - In Supabase Dashboard → Database → Functions
   - Create scheduled job to run every 15 minutes:
   ```sql
   REFRESH MATERIALIZED VIEW CONCURRENTLY mv_service_performance_last_7d;
   REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_errors_last_24h;
   REFRESH MATERIALIZED VIEW CONCURRENTLY mv_routing_quality_daily;
   REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_cost_last_30d;
   ```

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interacts with App                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            v
┌─────────────────────────────────────────────────────────────┐
│                   AI Service (e.g., Huxley)                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 1. Call Claude API                                    │  │
│  │ 2. Measure duration                                   │  │
│  │ 3. Extract tokens from response                       │  │
│  │ 4. Calculate cost                                     │  │
│  │ 5. Log metrics (fire-and-forget)                      │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            v
┌─────────────────────────────────────────────────────────────┐
│                    MetricsService.js                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Batch Queue (max 100 or 10s timeout)                 │  │
│  │ - ai_metrics                                          │  │
│  │ - ai_routing_decisions                                │  │
│  │ - ai_errors (immediate insert)                        │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────┬────────────────────────────────────────┬────────┘
            │                                        │
            v                                        v
┌───────────────────────┐              ┌─────────────────────┐
│   Supabase Database   │              │    Sentry.io        │
│  - 5 tables           │              │  - Error tracking   │
│  - 4 materialized     │              │  - Stack traces     │
│    views              │              │  - Context          │
│  - RLS policies       │              └─────────────────────┘
└───────────┬───────────┘
            │
            v
┌─────────────────────────────────────────────────────────────┐
│              AdminMetricsDashboard.js                       │
│  - Auto-refresh every 30s                                   │
│  - Reads from materialized views                            │
│  - Admin-only access                                        │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **AI Service Call** → User sends message to AI service (e.g., Huxley)
2. **Timing & Token Extraction** → Service measures duration, extracts tokens
3. **Batch Logging** → MetricsService queues the metric (non-blocking)
4. **Periodic Flush** → Every 10 seconds or 100 items, batch insert to DB
5. **Materialized Views** → Refreshed every 15 minutes for dashboard performance
6. **Dashboard Display** → Admin views metrics, auto-refreshes every 30s

### Key Design Decisions

**Why Batch Logging?**
- Reduces database writes by 98%
- Minimal performance impact on AI calls (<10ms overhead)
- Fire-and-forget: never blocks user experience

**Why Materialized Views?**
- Dashboard queries run in <100ms (vs 2-5s for raw tables)
- Pre-computed aggregations reduce database load
- Acceptable 15-minute data freshness for admin dashboard

**Why RLS (Row Level Security)?**
- Users can only see their own metrics
- Admins see all metrics
- Service accounts have write-only access
- GDPR compliance built-in

**Why Sentry?**
- Production-grade error tracking
- Stack traces with source maps
- Performance monitoring (transactions)
- PII protection via beforeSend hook

---

## Using the Admin Dashboard

### Accessing the Dashboard

1. **Mobile App:** Settings → Admin → AI Metrics Dashboard
2. **Web (Future):** admin.psycheteleos.com/metrics

### Dashboard Layout

The dashboard uses a card-based layout with auto-refresh every 30 seconds.

#### 1. System Overview Card

**Shows:**
- Total AI calls (last 7 days)
- Success rate (%)
- Average response time (ms)

**What to Look For:**
- Success rate <95% = investigate errors
- Response time >2000ms = performance issues
- Sudden drops in total calls = app issue or API problem

#### 2. Cost Summary Card

**Shows:**
- Total cost (last 30 days)
- Cost per service (top 3)
- Total calls

**What to Look For:**
- Unexpected cost spikes = investigate service usage
- High-cost services = optimization opportunities
- Cost per call trends

**Example:**
```
💰 Cost Summary (30d)
$45.67 total | 12,543 calls

Top Services:
1. enhancedClaude: $23.45 (51%)
2. ifsAI: $12.34 (27%)
3. polyvagalAI: $5.67 (12%)
```

#### 3. Error Summary Card

**Shows:**
- Total errors (last 24h)
- Top error types
- Link to Sentry

**What to Look For:**
- >5% error rate = critical issue
- Repeated error patterns = systemic problem
- New error types = regression from deployment

**Example:**
```
⚠️ Errors (24h)
23 errors | 5 unique types

Top Errors:
1. RateLimitExceeded: 12
2. APITimeout: 7
3. InvalidRequest: 4

[View in Sentry →]
```

#### 4. Routing Effectiveness Card

**Shows:**
- Average routing confidence (%)
- Total decisions (last 7 days)
- Most common route
- Low confidence count (<70%)

**What to Look For:**
- Avg confidence <70% = routing quality issues
- High low-confidence count = users getting wrong experience
- Unexpected common route = user behavior change

**Example:**
```
🧭 Routing Quality (7d)
82% avg confidence | 1,234 decisions

Most Common: daily_journal (345)
Low Confidence: 23 (1.9%)
```

#### 5. Service Health Cards (9 Cards)

One card per AI service showing:
- Service name
- Total calls (7d)
- Success rate (%)
- Avg duration (ms)
- Estimated cost

**What to Look For:**
- Success rate <90% = service-specific issue
- Duration >3000ms = slow service
- Cost spike = check for inefficient prompts

**Example:**
```
🤖 enhancedClaude (Huxley)
2,345 calls | 97.2% success
Avg: 1,234ms | $23.45

[Healthy ✓]
```

### Using Pull-to-Refresh

- Swipe down on dashboard to force refresh
- Use when you want immediate data (not 30s stale)
- Useful after making changes to test impact

### Interpreting Health Indicators

| Indicator | Meaning | Action |
|-----------|---------|--------|
| ✓ Healthy | All metrics in acceptable ranges | Continue monitoring |
| ⚠️ Warning | Success rate 90-95% or slow responses | Investigate within 1 day |
| ❌ Critical | Success rate <90% or errors >10% | Investigate immediately |
| 🔧 Degraded | Service operational but suboptimal | Schedule optimization |

---

## Understanding Metrics

### AI Metrics Table

Every AI service call logs to `ai_metrics`:

| Field | Description | Example |
|-------|-------------|---------|
| service_name | AI service identifier | `enhancedClaude` |
| operation | Type of operation | `chat` |
| duration_ms | Time from request to response | `1234` |
| input_tokens | Tokens sent to Claude API | `500` |
| output_tokens | Tokens received from Claude | `200` |
| total_tokens | input + output | `700` |
| estimated_cost | Cost in USD | `0.0045` |
| status | `success` or `error` | `success` |
| metadata | Additional context (JSONB) | `{ "phase": "find" }` |
| user_id | User who triggered call | `uuid` |
| timestamp | When call occurred | `2026-02-09 14:23:45` |

### Routing Decisions Table

AI routing decisions log to `ai_routing_decisions`:

| Field | Description | Example |
|-------|-------------|---------|
| selected_route | Route chosen by AI | `daily_journal` |
| confidence | AI confidence (0-1) | `0.85` |
| alternatives_considered | Other routes evaluated | `[{"route": "ifs_chat", "score": 0.65}]` |
| metadata | Non-PII metadata | `{ "input_length": 42, "detected_intents": ["mapping"] }` |
| user_id | User who sent message | `uuid` |
| timestamp | When routing occurred | `2026-02-09 14:23:45` |

**Important:** User message text is NEVER logged (GDPR compliance).

### Error Logs Table

Errors log to `ai_errors`:

| Field | Description | Example |
|-------|-------------|---------|
| service_name | Service that failed | `enhancedClaude` |
| operation | Operation that failed | `chat` |
| error_type | Error class/type | `RateLimitExceeded` |
| error_message | Error description | `Rate limit: 50 req/min` |
| stack_trace | Full stack trace | `Error: ... at line 42` |
| sentry_event_id | Link to Sentry | `abc123...` |
| context | Additional debug info | `{ "userId": "...", "retryCount": 3 }` |
| user_id | User affected | `uuid` |
| timestamp | When error occurred | `2026-02-09 14:23:45` |

### Cost Calculation

**Claude Sonnet 4.5 Pricing (as of 2026-02-09):**
- Input tokens: $3.00 per 1M tokens
- Output tokens: $15.00 per 1M tokens

**Formula:**
```
cost = (input_tokens / 1,000,000) * 3.00
     + (output_tokens / 1,000,000) * 15.00
```

**Example:**
- Input: 500 tokens = $0.0015
- Output: 200 tokens = $0.0030
- Total: $0.0045

**Typical Costs:**
- Simple question: $0.002 - $0.005
- IFS session: $0.01 - $0.03
- Complex mapping: $0.05 - $0.10
- Full integration session: $0.20 - $0.50

### Success Rates

**What counts as success?**
- API call returned 200 status
- Response parsed successfully
- No exceptions thrown
- Result delivered to user

**What counts as error?**
- API timeout (>30s)
- Rate limit exceeded
- Invalid request format
- Network failure
- Parser error

**Target Ranges:**
- Excellent: 98-100%
- Good: 95-98%
- Warning: 90-95%
- Critical: <90%

### Response Time Targets

| Service | Target (ms) | Warning (ms) | Critical (ms) |
|---------|-------------|--------------|---------------|
| Enhanced Claude | <2000 | 2000-3000 | >3000 |
| IFS AI | <2500 | 2500-4000 | >4000 |
| Polyvagal AI | <2000 | 2000-3000 | >3000 |
| Routing | <1000 | 1000-2000 | >2000 |
| Context Loading | <500 | 500-1000 | >1000 |

---

## Monitoring Best Practices

### Daily Check (5 Minutes)

1. Open dashboard, check System Overview
2. Scan for red/yellow health indicators
3. Review Error Summary for new issues
4. Check cost trends (unexpected spikes?)

### Weekly Review (15 Minutes)

1. Analyze cost per service
2. Identify optimization opportunities
3. Review routing effectiveness
4. Check for error patterns
5. Verify success rates remain >95%

### Monthly Planning (30 Minutes)

1. Export cost data for budgeting
2. Analyze user behavior trends
3. Plan service optimizations
4. Review alerting thresholds
5. Update documentation

### What to Monitor

**🔴 Critical (Check Daily)**
- Success rate <95%
- Response time >3000ms
- Error rate >5%
- Cost spike >50% of normal

**🟡 Important (Check Weekly)**
- Success rate 95-98%
- Response time 2000-3000ms
- Error rate 2-5%
- Cost increase 20-50%

**🟢 Nice to Know (Check Monthly)**
- Service usage trends
- Token efficiency
- Cache hit rates
- User engagement patterns

### Setting Up Alerts

#### In Supabase (SQL Trigger)

```sql
-- Alert on high error rate (>5% in last hour)
CREATE OR REPLACE FUNCTION alert_high_error_rate()
RETURNS trigger AS $$
BEGIN
  -- Calculate error rate
  DECLARE
    total_calls INTEGER;
    error_calls INTEGER;
    error_rate NUMERIC;
  BEGIN
    SELECT COUNT(*) INTO total_calls
    FROM ai_metrics
    WHERE timestamp > NOW() - INTERVAL '1 hour';

    SELECT COUNT(*) INTO error_calls
    FROM ai_metrics
    WHERE timestamp > NOW() - INTERVAL '1 hour'
      AND status = 'error';

    error_rate := (error_calls::NUMERIC / total_calls::NUMERIC) * 100;

    IF error_rate > 5 THEN
      -- Send alert (implement via Edge Function or webhook)
      RAISE NOTICE 'High error rate: % percent', error_rate;
    END IF;

    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql;
```

#### In Sentry

- Go to Project Settings → Alerts
- Create alert for error spike (>10 errors in 1 hour)
- Set notification channel (email, Slack, PagerDuty)

#### Cost Alerts

```sql
-- Alert on daily cost >$10
SELECT
  DATE(timestamp) as date,
  SUM(estimated_cost) as daily_cost
FROM ai_metrics
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY DATE(timestamp)
HAVING SUM(estimated_cost) > 10.00;
```

---

## Troubleshooting

### Dashboard Won't Load

**Symptoms:**
- "Failed to load metrics" error
- Blank screen
- Loading spinner forever

**Diagnosis:**
1. Check admin access: `SELECT * FROM user_roles WHERE user_id = 'your-uuid';`
2. Check materialized views exist: `\dv` in psql
3. Check RLS policies: `SELECT * FROM pg_policies WHERE tablename LIKE 'ai_%';`
4. Check network connectivity to Supabase

**Solutions:**
- Grant admin role: `INSERT INTO user_roles (user_id, role) VALUES ('uuid', 'admin');`
- Recreate views: Run migration again
- Check `.env` has correct Supabase URL
- Verify Supabase API key is valid

### Metrics Not Appearing

**Symptoms:**
- Dashboard loads but shows 0 calls
- Recent AI usage not reflected

**Diagnosis:**
1. Check if metrics service initialized: Look for `[Metrics] Initialized successfully` in console
2. Check batch queue size: `console.log(metricsService.batchQueue.length)`
3. Force flush: `await metricsService.flush()`
4. Check database: `SELECT COUNT(*) FROM ai_metrics WHERE timestamp > NOW() - INTERVAL '1 hour';`

**Solutions:**
- Ensure `metricsService.initialize()` called in `App.js`
- Check for console errors during flush
- Verify RLS allows INSERT for authenticated users
- Wait 10 seconds for automatic flush

### High Error Rate

**Symptoms:**
- Success rate <95%
- Error Summary Card shows many errors

**Diagnosis:**
1. Check Sentry for error details
2. Query error types: `SELECT error_type, COUNT(*) FROM ai_errors WHERE timestamp > NOW() - INTERVAL '24 hours' GROUP BY error_type ORDER BY COUNT(*) DESC;`
3. Check for API key issues
4. Verify Claude API status at status.anthropic.com

**Common Causes & Solutions:**

| Error Type | Cause | Solution |
|------------|-------|----------|
| RateLimitExceeded | Too many requests | Implement request throttling, upgrade API tier |
| APITimeout | Slow network or large prompts | Reduce prompt size, add retry logic |
| InvalidRequest | Malformed API call | Check prompt format, validate parameters |
| AuthenticationError | Invalid API key | Rotate key, check .env |
| OverloadedError | Claude API overloaded | Add retry with exponential backoff |

### Slow Response Times

**Symptoms:**
- Avg response time >3000ms
- Users complain app is slow

**Diagnosis:**
1. Check service health cards for slow services
2. Query slow calls: `SELECT service_name, operation, AVG(duration_ms) FROM ai_metrics WHERE timestamp > NOW() - INTERVAL '1 hour' GROUP BY service_name, operation ORDER BY AVG(duration_ms) DESC;`
3. Check token counts (large prompts?)
4. Monitor network latency

**Solutions:**
- Optimize prompts (reduce token count)
- Enable caching for repeated queries
- Use streaming for better UX
- Consider model upgrade if needed
- Check for context loading bottlenecks

### Cost Spike

**Symptoms:**
- Unexpected high costs in Cost Summary
- Budget alert triggered

**Diagnosis:**
1. Check cost by service: `SELECT service_name, SUM(estimated_cost) FROM ai_metrics WHERE timestamp > NOW() - INTERVAL '24 hours' GROUP BY service_name ORDER BY SUM(estimated_cost) DESC;`
2. Check cost by user: `SELECT user_id, SUM(estimated_cost) FROM ai_metrics WHERE timestamp > NOW() - INTERVAL '24 hours' GROUP BY user_id ORDER BY SUM(estimated_cost) DESC;`
3. Look for token usage spikes
4. Check for infinite loops or retry storms

**Solutions:**
- Set per-user cost limits
- Optimize high-cost services
- Review prompts for efficiency
- Implement request throttling
- Add cost alerts earlier in the day

### Dashboard Performance Issues

**Symptoms:**
- Dashboard takes >5s to load
- App freezes when opening dashboard

**Diagnosis:**
1. Check materialized view refresh status
2. Check query plans: `EXPLAIN ANALYZE SELECT * FROM mv_service_performance_last_7d;`
3. Check database load in Supabase dashboard
4. Monitor memory usage

**Solutions:**
- Ensure views refreshed recently (every 15 min)
- Add missing indexes
- Reduce dashboard auto-refresh frequency
- Paginate large result sets
- Consider archiving old data

---

## Cost Management

### Current Pricing Model

**Claude API Costs:**
- Sonnet 4.5: $3/1M input tokens, $15/1M output tokens
- Haiku 4: $0.80/1M input, $4/1M output (faster, cheaper for simple tasks)

**Supabase Costs:**
- Free tier: 500MB database, 5GB bandwidth/month
- Pro tier: $25/month for 8GB database, 250GB bandwidth
- Enterprise: Custom pricing

**Sentry Costs:**
- Free tier: 5K errors/month
- Team tier: $26/month for 50K errors
- Business: $80/month for 100K errors

### Estimating Your Costs

**Formula:**
```
Monthly Cost = (Users × Messages/Day × Days × Cost/Message)
```

**Example (1000 Users):**
- Average user: 5 AI messages/day
- Average cost per message: $0.01
- Monthly cost: 1000 × 5 × 30 × 0.01 = $1,500/month

**Cost per User Tier:**
- Light user (1 msg/day): $0.30/month
- Average user (5 msg/day): $1.50/month
- Power user (20 msg/day): $6.00/month

### Cost Optimization Strategies

#### 1. Prompt Engineering

**Problem:** Verbose prompts waste tokens
**Solution:**
- Remove unnecessary instructions
- Use concise language
- Avoid repeating context in every message
- Estimate 25% cost reduction

#### 2. Context Caching

**Problem:** Loading full context every message
**Solution:**
- Cache user context for 5 minutes
- Only reload when stale
- Estimate 40% cost reduction on context loading

#### 3. Response Truncation

**Problem:** AI generating long responses
**Solution:**
- Set max_tokens limit (e.g., 1000)
- Truncate at natural breakpoints
- Estimate 15% cost reduction

#### 4. Model Selection

**Problem:** Using Sonnet 4.5 for simple tasks
**Solution:**
- Use Haiku 4 for routing decisions
- Use Haiku 4 for simple journaling prompts
- Use Sonnet 4.5 only for complex conversations
- Estimate 50% cost reduction on simple tasks

#### 5. Request Batching

**Problem:** Making multiple sequential API calls
**Solution:**
- Batch multiple questions into one call
- Use structured outputs (JSON)
- Estimate 30% cost reduction

#### 6. User Limits

**Problem:** Power users driving up costs
**Solution:**
- Set per-user daily limits (e.g., 50 messages)
- Offer premium tier for unlimited
- Throttle after limit reached

### Monitoring Costs

**Daily:**
```sql
-- Check today's costs
SELECT
  DATE(timestamp) as date,
  SUM(estimated_cost) as daily_cost,
  COUNT(*) as calls,
  SUM(estimated_cost) / COUNT(*) as avg_cost_per_call
FROM ai_metrics
WHERE timestamp > CURRENT_DATE
GROUP BY DATE(timestamp);
```

**Per Service:**
```sql
-- Find expensive services
SELECT
  service_name,
  SUM(estimated_cost) as total_cost,
  COUNT(*) as calls,
  AVG(total_tokens) as avg_tokens
FROM ai_metrics
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY service_name
ORDER BY total_cost DESC;
```

**Per User:**
```sql
-- Find power users
SELECT
  user_id,
  SUM(estimated_cost) as total_cost,
  COUNT(*) as calls,
  MAX(timestamp) as last_activity
FROM ai_metrics
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY user_id
ORDER BY total_cost DESC
LIMIT 10;
```

### Budget Planning

**Monthly Budget Template:**

| Category | Estimated Cost | Notes |
|----------|---------------|-------|
| Claude API | $1,500 | 1K users @ $1.50/user |
| Supabase | $25 | Pro tier |
| Sentry | $26 | Team tier |
| **Total** | **$1,551** | **~$1.55/user** |

**Growth Projections:**

| Users | Monthly Cost | Cost/User |
|-------|--------------|-----------|
| 100 | $180 | $1.80 |
| 500 | $825 | $1.65 |
| 1,000 | $1,551 | $1.55 |
| 5,000 | $7,625 | $1.53 |
| 10,000 | $15,125 | $1.51 |

**Cost scales sub-linearly due to fixed infrastructure costs.**

---

## Security & Privacy

### Data Privacy Principles

1. **User Input Text Never Logged:** Only metadata (length, detected intents)
2. **RLS Enforced:** Users only see their own metrics
3. **Admin Audit Trail:** All admin actions logged
4. **GDPR Compliant:** Right to erasure via `delete_user_ai_data()`
5. **PII Stripping:** Sentry configured to remove PII from error reports

### What Is Logged

**✅ Logged (Non-PII):**
- Service names
- Operation types
- Duration, tokens, cost
- Success/error status
- Error types and messages
- Routing decisions (confidence, selected route)
- User ID (UUID only, no names)

**❌ NOT Logged (PII):**
- User message text
- AI response text
- User email, name, phone
- Journal entry content
- Session details

### Access Control

**User Role:** Can see own metrics only
**Admin Role:** Can see all metrics
**Service Account:** Can write metrics only (no read access)

**Granting Admin Access:**
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('user-uuid-here', 'admin');
```

**Revoking Admin Access:**
```sql
DELETE FROM public.user_roles
WHERE user_id = 'user-uuid-here' AND role = 'admin';
```

### GDPR Compliance

**Right to Access:**
```sql
-- User can request their own data
SELECT * FROM ai_metrics WHERE user_id = 'user-uuid';
SELECT * FROM ai_routing_decisions WHERE user_id = 'user-uuid';
SELECT * FROM ai_errors WHERE user_id = 'user-uuid';
```

**Right to Erasure:**
```sql
-- User or admin can delete all user's AI data
SELECT delete_user_ai_data('user-uuid-here');
```

This function:
- Deletes all metrics for the user
- Deletes all routing decisions
- Deletes all errors
- Cascades to related records
- Logs deletion in audit trail

**Data Retention:**
- Metrics retained for 90 days by default
- After 90 days, archived to cold storage (future feature)
- Archived data excluded from dashboard queries

### Sentry PII Protection

**Configured via `App.js`:**
```javascript
Sentry.init({
  beforeSend(event, hint) {
    // Strip PII from error context
    if (event.contexts && event.contexts.user) {
      delete event.contexts.user.email;
      delete event.contexts.user.username;
    }

    // Sanitize breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.filter(crumb =>
        !crumb.message.includes('password') &&
        !crumb.message.includes('api_key')
      );
    }

    return event;
  }
});
```

### Security Checklist

**Before Deployment:**
- [ ] All API keys in `.env` (not hardcoded)
- [ ] `.env` in `.gitignore`
- [ ] Supabase service key NOT used client-side
- [ ] RLS policies applied to all tables
- [ ] Admin role check uses `user_roles` table (not metadata)
- [ ] Sentry PII stripping enabled
- [ ] GDPR deletion function restricted to user/admin

**After Deployment:**
- [ ] Monitor Supabase logs for failed RLS checks
- [ ] Review Sentry events for leaked PII
- [ ] Audit admin access grants
- [ ] Test GDPR deletion function
- [ ] Verify users can't see others' metrics

---

## Maintenance

### Daily Tasks (Automated)

- Materialized view refresh (every 15 min)
- Batch flush (every 10 seconds)
- Error logging (immediate)
- Health checks (every 5 min)

### Weekly Tasks (5 Minutes)

- Review dashboard for anomalies
- Check error patterns in Sentry
- Verify success rates >95%
- Monitor cost trends

### Monthly Tasks (30 Minutes)

- Export metrics for reporting
- Analyze user behavior trends
- Review and update alert thresholds
- Clean up old test data
- Verify backup procedures

### Quarterly Tasks (2 Hours)

- Performance audit (query plans, indexes)
- Security audit (RLS, access logs)
- Cost optimization review
- Update documentation
- Review data retention policy

### Database Maintenance

**Vacuum and Analyze (Weekly):**
```sql
VACUUM ANALYZE ai_metrics;
VACUUM ANALYZE ai_routing_decisions;
VACUUM ANALYZE ai_errors;
```

**Check Index Usage:**
```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename LIKE 'ai_%'
ORDER BY idx_scan ASC;
```

**Unused indexes (idx_scan = 0) can be dropped.**

**Archive Old Data (Manual):**
```sql
-- Archive metrics older than 90 days
INSERT INTO ai_metrics_archive
SELECT * FROM ai_metrics WHERE timestamp < NOW() - INTERVAL '90 days';

DELETE FROM ai_metrics WHERE timestamp < NOW() - INTERVAL '90 days';
```

### Materialized View Refresh

**Scheduled Job (Supabase Dashboard → Database → Functions):**
```sql
-- Run every 15 minutes
SELECT cron.schedule(
  'refresh-metrics-views',
  '*/15 * * * *',
  $$
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_service_performance_last_7d;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_errors_last_24h;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_routing_quality_daily;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_cost_last_30d;
  $$
);
```

**Manual Refresh (if needed):**
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_service_performance_last_7d;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_errors_last_24h;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_routing_quality_daily;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_cost_last_30d;
```

### Backup Strategy

**Automated Supabase Backups:**
- Daily backups (retained 7 days) - Free/Pro
- Point-in-time recovery (7 days) - Pro
- Manual backups on demand

**Manual Export (if needed):**
```bash
# Export metrics table
pg_dump -h [project].supabase.co -U postgres -d postgres \
  -t ai_metrics -t ai_routing_decisions -t ai_errors \
  -f ai_monitoring_backup_$(date +%Y%m%d).sql
```

### Upgrading

When upgrading the monitoring system:

1. **Read Migration Guide:** Check `supabase/migrations/README.md`
2. **Test in Staging:** Apply migration to staging first
3. **Backup Production:** Manual export before applying
4. **Apply Migration:** Run SQL via Supabase dashboard
5. **Verify Health:** Run `deployment/health-check.sql`
6. **Monitor Closely:** Watch for errors in Sentry

**Rollback Procedure:**
```bash
# Emergency rollback
psql -h [project].supabase.co -U postgres -d postgres \
  -f supabase/migrations/20260209000000_ai_monitoring_rollback.sql
```

---

## FAQ

**Q: Why is my dashboard showing stale data?**
A: Materialized views refresh every 15 minutes. For real-time data, query the raw tables directly or force a refresh.

**Q: Can I see another user's metrics?**
A: No (unless you're an admin). RLS policies enforce user isolation.

**Q: How do I export metrics for reporting?**
A: Use Supabase SQL Editor to query and export to CSV, or use the API to fetch programmatically.

**Q: What happens if logging fails?**
A: The app continues normally. Metrics logging is fire-and-forget and never blocks user experience.

**Q: Can I add custom metrics?**
A: Yes! Add fields to the `metadata` JSONB column. No schema changes needed.

**Q: How do I track costs for a specific feature?**
A: Add a `feature` field to metadata when logging metrics, then query by that field.

**Q: Is this HIPAA compliant?**
A: The monitoring system follows HIPAA technical safeguards (encryption, access controls, audit logs), but full compliance requires a BAA with Supabase and additional procedures.

**Q: Can I integrate with external monitoring tools?**
A: Yes! Query the metrics tables via Supabase API and push to Datadog, New Relic, or other tools.

---

## Support

### Documentation

- **API Reference:** `docs/API_REFERENCE.md`
- **Database Schema:** `docs/DATABASE_SCHEMA.md`
- **Architecture Decision Record:** `docs/ADR_AI_MONITORING.md`
- **Quick Reference:** `supabase/migrations/QUICK_REFERENCE.md`
- **Schema Diagram:** `supabase/migrations/SCHEMA_DIAGRAM.md`

### Troubleshooting

- **Instrumentation Guide:** `.full-stack-feature/INSTRUMENTATION_GUIDE.md`
- **Security Fixes:** `.full-stack-feature/SECURITY_FIXES.md`
- **Testing Report:** `.full-stack-feature/07-testing.md`
- **Deployment Guide:** `.full-stack-feature/08-deployment.md`

### Getting Help

1. Check this documentation first
2. Review Sentry for error details
3. Check Supabase logs for database issues
4. Consult `context/bugs/` for known issues
5. Create new bug in `context/bugs/` if issue persists

---

**Last Updated:** 2026-02-09
**Next Review:** 2026-03-09
**Maintainer:** Engineering Team
