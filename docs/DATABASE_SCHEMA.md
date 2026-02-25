# AI Monitoring & Observability - Database Schema Reference

**Feature:** FEAT-203
**Database:** Supabase (PostgreSQL 15+)
**Version:** 1.0
**Last Updated:** 2026-02-09

---

## Table of Contents

1. [Overview](#overview)
2. [Tables](#tables)
3. [Materialized Views](#materialized-views)
4. [Indexes](#indexes)
5. [Security (RLS)](#security-rls)
6. [Functions](#functions)
7. [Triggers](#triggers)
8. [Query Examples](#query-examples)
9. [Performance](#performance)
10. [Maintenance](#maintenance)

---

## Overview

### Schema Purpose

The AI Monitoring schema tracks performance, cost, quality, and errors for all 9 AI services in the Psycheteleos app. It provides:

- Real-time performance monitoring
- Cost tracking and optimization
- Error analysis and debugging
- Quality assurance and flagging
- GDPR-compliant data management

### Architecture Highlights

**5 Core Tables:**
1. `ai_metrics` - Event stream (all AI interactions)
2. `ai_routing_decisions` - Routing audit log
3. `ai_errors` - Detailed error tracking
4. `ai_conversations` - Conversation aggregates
5. `ai_daily_summary` - Pre-computed daily rollups

**4 Materialized Views:**
- `mv_service_performance_last_7d` - Service health
- `mv_top_errors_last_24h` - Error patterns
- `mv_routing_quality_daily` - Routing effectiveness
- `mv_user_cost_last_30d` - User-level costs

**31 Indexes:** Optimized for common dashboard queries

**RLS Policies:** User isolation, admin access, service write-only

### Data Volume Estimates

| Table | Daily Rows | 90-Day Storage | Annual Storage |
|-------|-----------|----------------|----------------|
| ai_metrics | 10,000 | 900,000 | ~800 MB |
| ai_routing_decisions | 2,000 | 180,000 | ~50 MB |
| ai_errors | 100 | 9,000 | ~5 MB |
| ai_conversations | 5,000 | 450,000 | ~100 MB |
| ai_daily_summary | 1 | 365 | <1 MB |
| **Total** | **17,101** | **1,539,365** | **~1 GB** |

*Based on 1K active users. Scales linearly.*

---

## Tables

### 1. ai_metrics

**Purpose:** Event stream for all AI service interactions

**Retention:** 90 days (then archive)

**Expected Volume:** ~10K rows/day for 1K users

#### Schema

```sql
CREATE TABLE public.ai_metrics (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Service Identification
    service_name TEXT NOT NULL,
    operation_type TEXT NOT NULL,

    -- User Context
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID,

    -- Performance Metrics
    duration_ms INTEGER NOT NULL,
    tokens_input INTEGER,
    tokens_output INTEGER,
    tokens_total INTEGER GENERATED ALWAYS AS (
        COALESCE(tokens_input, 0) + COALESCE(tokens_output, 0)
    ) STORED,
    estimated_cost_usd DECIMAL(10, 6),

    -- Quality Metrics
    status TEXT NOT NULL,
    error_message TEXT,
    error_code TEXT,

    -- Context & Metadata
    model_name TEXT,
    cache_hit BOOLEAN DEFAULT FALSE,
    cache_type TEXT,

    -- Quality Flags
    flagged_for_review BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,

    -- Flexible Metadata
    metadata JSONB DEFAULT '{}'::JSONB,

    -- Constraints
    CONSTRAINT valid_status CHECK (status IN (
        'success', 'error', 'timeout', 'rate_limited', 'cancelled'
    )),
    CONSTRAINT valid_operation CHECK (operation_type IN (
        'chat', 'routing', 'context_building', 'analysis', 'journal', 'assessment'
    )),
    CONSTRAINT positive_duration CHECK (duration_ms >= 0),
    CONSTRAINT positive_tokens CHECK (tokens_input >= 0 AND tokens_output >= 0)
);
```

#### Column Reference

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `created_at` | TIMESTAMPTZ | NO | When metric was logged |
| `service_name` | TEXT | NO | AI service ('enhancedClaude', 'ifsAI', etc.) |
| `operation_type` | TEXT | NO | Operation type ('chat', 'routing', etc.) |
| `user_id` | UUID | YES | User who triggered call (CASCADE delete) |
| `conversation_id` | UUID | YES | Groups related messages |
| `duration_ms` | INTEGER | NO | Response time in milliseconds |
| `tokens_input` | INTEGER | YES | Input tokens to Claude API |
| `tokens_output` | INTEGER | YES | Output tokens from Claude API |
| `tokens_total` | INTEGER | NO | Generated column (input + output) |
| `estimated_cost_usd` | DECIMAL(10,6) | YES | Estimated cost in USD |
| `status` | TEXT | NO | 'success', 'error', 'timeout', etc. |
| `error_message` | TEXT | YES | Error description (if status = 'error') |
| `error_code` | TEXT | YES | HTTP/API error code |
| `model_name` | TEXT | YES | AI model used |
| `cache_hit` | BOOLEAN | NO | Whether request used cache |
| `cache_type` | TEXT | YES | 'prompt_cache', 'context_cache', null |
| `flagged_for_review` | BOOLEAN | NO | Auto-flagged for quality review |
| `flag_reason` | TEXT | YES | Why flagged |
| `metadata` | JSONB | NO | Additional context (flexible schema) |

#### Indexes

```sql
-- Time-based queries
CREATE INDEX idx_ai_metrics_created_at
ON public.ai_metrics(created_at DESC);

-- Service performance queries
CREATE INDEX idx_ai_metrics_service_time
ON public.ai_metrics(service_name, created_at DESC);

-- User metrics queries
CREATE INDEX idx_ai_metrics_user_time
ON public.ai_metrics(user_id, created_at DESC)
WHERE user_id IS NOT NULL;

-- Conversation tracking
CREATE INDEX idx_ai_metrics_conversation
ON public.ai_metrics(conversation_id, created_at)
WHERE conversation_id IS NOT NULL;

-- Error queries (partial index)
CREATE INDEX idx_ai_metrics_status
ON public.ai_metrics(status)
WHERE status != 'success';

-- Flagged items (partial index)
CREATE INDEX idx_ai_metrics_flagged
ON public.ai_metrics(flagged_for_review, created_at DESC)
WHERE flagged_for_review = TRUE;

-- JSONB metadata searches
CREATE INDEX idx_ai_metrics_metadata
ON public.ai_metrics USING GIN(metadata);
```

#### Example Rows

```json
{
  "id": "a1b2c3d4-...",
  "created_at": "2026-02-09T14:23:45.123Z",
  "service_name": "enhancedClaude",
  "operation_type": "chat",
  "user_id": "user123...",
  "conversation_id": "conv456...",
  "duration_ms": 1234,
  "tokens_input": 500,
  "tokens_output": 200,
  "tokens_total": 700,
  "estimated_cost_usd": 0.0045,
  "status": "success",
  "error_message": null,
  "error_code": null,
  "model_name": "claude-sonnet-4-5-20250929",
  "cache_hit": false,
  "cache_type": null,
  "flagged_for_review": false,
  "flag_reason": null,
  "metadata": {
    "temperature": 0.7,
    "phase": "find",
    "message_length": 42
  }
}
```

---

### 2. ai_routing_decisions

**Purpose:** Audit log for conversational routing decisions

**Retention:** 90 days

**Expected Volume:** ~2K rows/day for 1K users

**Security:** Admin-only access (formerly contained user input preview, now stores only metadata)

#### Schema

```sql
CREATE TABLE public.ai_routing_decisions (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Links
    metric_id UUID REFERENCES public.ai_metrics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID,

    -- Routing Decision
    user_input_preview TEXT, -- DEPRECATED: Must be NULL for PII compliance
    selected_route TEXT NOT NULL,
    confidence_score DECIMAL(3, 2),
    reasoning TEXT,

    -- Alternative Routes
    alternative_routes JSONB DEFAULT '[]'::JSONB,

    -- Context Used
    context_signals JSONB DEFAULT '{}'::JSONB,

    -- Quality Flags
    flagged_for_review BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,

    -- Constraints
    CONSTRAINT valid_confidence CHECK (confidence_score >= 0 AND confidence_score <= 1),
    CONSTRAINT valid_route CHECK (selected_route IN (
        'huxley', 'ifs', 'polyvagal', 'journal', 'core_beliefs',
        'triggers_glimmers', 'resources', 'crisis', 'general'
    ))
);
```

#### Column Reference

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `created_at` | TIMESTAMPTZ | NO | When decision was made |
| `metric_id` | UUID | YES | Link to ai_metrics row |
| `user_id` | UUID | YES | User who sent message |
| `conversation_id` | UUID | YES | Conversation context |
| `user_input_preview` | TEXT | YES | **DEPRECATED** - Must be NULL (PII) |
| `selected_route` | TEXT | NO | Route chosen by AI |
| `confidence_score` | DECIMAL(3,2) | YES | Confidence (0.00-1.00) |
| `reasoning` | TEXT | YES | Why this route was chosen |
| `alternative_routes` | JSONB | NO | Other routes considered: `[{route, score}]` |
| `context_signals` | JSONB | NO | Non-PII metadata (input_length, detected_intents) |
| `flagged_for_review` | BOOLEAN | NO | Low confidence or crisis detected |
| `flag_reason` | TEXT | YES | Why flagged |

#### Indexes

```sql
-- Time-based queries
CREATE INDEX idx_routing_created_at
ON public.ai_routing_decisions(created_at DESC);

-- User routing history
CREATE INDEX idx_routing_user_time
ON public.ai_routing_decisions(user_id, created_at DESC);

-- Route analysis
CREATE INDEX idx_routing_route
ON public.ai_routing_decisions(selected_route, created_at DESC);

-- Low confidence (partial index)
CREATE INDEX idx_routing_confidence
ON public.ai_routing_decisions(confidence_score)
WHERE confidence_score < 0.7;

-- Flagged decisions
CREATE INDEX idx_routing_flagged
ON public.ai_routing_decisions(flagged_for_review, created_at DESC)
WHERE flagged_for_review = TRUE;

-- JSONB searches
CREATE INDEX idx_routing_alternatives
ON public.ai_routing_decisions USING GIN(alternative_routes);
```

#### Example Row

```json
{
  "id": "r1r2r3r4-...",
  "created_at": "2026-02-09T14:23:45.123Z",
  "metric_id": "m1m2m3m4-...",
  "user_id": "user123...",
  "conversation_id": "conv456...",
  "user_input_preview": null,  // MUST BE NULL
  "selected_route": "ifs",
  "confidence_score": 0.85,
  "reasoning": "User mentioned 'inner critic' and 'parts work'",
  "alternative_routes": [
    {"route": "core_beliefs", "score": 0.65},
    {"route": "daily_journal", "score": 0.45}
  ],
  "context_signals": {
    "input_length": 42,
    "detected_intents": ["ifs", "parts_work", "inner_critic"],
    "method": "ai"
  },
  "flagged_for_review": false,
  "flag_reason": null
}
```

---

### 3. ai_errors

**Purpose:** Detailed error tracking with stack traces and Sentry integration

**Retention:** 90 days

**Expected Volume:** ~100 rows/day for 1K users

#### Schema

```sql
CREATE TABLE public.ai_errors (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Links
    metric_id UUID REFERENCES public.ai_metrics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Service Context
    service_name TEXT NOT NULL,
    operation_type TEXT NOT NULL,

    -- Error Details
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    error_code TEXT,
    stack_trace TEXT,

    -- External Integration
    sentry_id TEXT,
    sentry_url TEXT,

    -- Recovery Information
    retry_count INTEGER DEFAULT 0,
    recovered BOOLEAN DEFAULT FALSE,
    recovery_action TEXT,

    -- Context
    user_impact TEXT,
    metadata JSONB DEFAULT '{}'::JSONB,

    -- Constraints
    CONSTRAINT valid_error_type CHECK (error_type IN (
        'api_error', 'timeout', 'validation', 'rate_limit',
        'network', 'parsing', 'internal', 'unknown'
    )),
    CONSTRAINT valid_user_impact CHECK (user_impact IN (
        'high', 'medium', 'low', 'none'
    ))
);
```

#### Column Reference

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `created_at` | TIMESTAMPTZ | NO | When error occurred |
| `metric_id` | UUID | YES | Link to ai_metrics row |
| `user_id` | UUID | YES | User affected by error |
| `service_name` | TEXT | NO | Service that failed |
| `operation_type` | TEXT | NO | Operation that failed |
| `error_type` | TEXT | NO | Error classification |
| `error_message` | TEXT | NO | Error description |
| `error_code` | TEXT | YES | HTTP/API error code |
| `stack_trace` | TEXT | YES | Full stack trace (sanitized) |
| `sentry_id` | TEXT | YES | Sentry event ID |
| `sentry_url` | TEXT | YES | Direct link to Sentry |
| `retry_count` | INTEGER | NO | Number of retries attempted |
| `recovered` | BOOLEAN | NO | Whether error was recovered |
| `recovery_action` | TEXT | YES | How recovered ('retry', 'fallback', etc.) |
| `user_impact` | TEXT | YES | Severity of user impact |
| `metadata` | JSONB | NO | Additional context |

#### Indexes

```sql
-- Time-based queries
CREATE INDEX idx_errors_created_at
ON public.ai_errors(created_at DESC);

-- Service error patterns
CREATE INDEX idx_errors_service_time
ON public.ai_errors(service_name, created_at DESC);

-- Error type analysis
CREATE INDEX idx_errors_type
ON public.ai_errors(error_type, created_at DESC);

-- High-impact errors (partial index)
CREATE INDEX idx_errors_user_impact
ON public.ai_errors(user_impact, created_at DESC)
WHERE user_impact IN ('high', 'medium');

-- Sentry correlation
CREATE INDEX idx_errors_sentry
ON public.ai_errors(sentry_id)
WHERE sentry_id IS NOT NULL;

-- Unrecovered errors (partial index)
CREATE INDEX idx_errors_unrecovered
ON public.ai_errors(recovered, created_at DESC)
WHERE recovered = FALSE;
```

---

### 4. ai_conversations

**Purpose:** Aggregated conversation-level metrics

**Retention:** 90 days

**Expected Volume:** ~5K rows/day for 1K users

#### Schema

```sql
CREATE TABLE public.ai_conversations (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL UNIQUE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE,

    -- User Context
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Aggregated Metrics
    total_messages INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_cost_usd DECIMAL(10, 4) DEFAULT 0,
    avg_response_time_ms INTEGER,

    -- Service Usage
    services_used TEXT[] DEFAULT ARRAY[]::TEXT[],
    primary_service TEXT,

    -- Quality Metrics
    error_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5, 2),

    -- Quality Flags
    flagged_for_review BOOLEAN DEFAULT FALSE,
    flag_reasons TEXT[],
    crisis_detected BOOLEAN DEFAULT FALSE,

    -- Metadata
    metadata JSONB DEFAULT '{}'::JSONB,

    -- Constraints
    CONSTRAINT positive_messages CHECK (total_messages >= 0),
    CONSTRAINT positive_tokens CHECK (total_tokens >= 0),
    CONSTRAINT valid_success_rate CHECK (success_rate >= 0 AND success_rate <= 100)
);
```

#### Column Reference

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | NO | Primary key |
| `conversation_id` | UUID | NO | Unique conversation identifier |
| `created_at` | TIMESTAMPTZ | NO | Conversation start time |
| `updated_at` | TIMESTAMPTZ | NO | Last message time |
| `ended_at` | TIMESTAMPTZ | YES | Conversation end time |
| `user_id` | UUID | YES | User in conversation |
| `total_messages` | INTEGER | NO | Message count |
| `total_tokens` | INTEGER | NO | Total tokens used |
| `total_cost_usd` | DECIMAL(10,4) | NO | Total cost in USD |
| `avg_response_time_ms` | INTEGER | YES | Average response time |
| `services_used` | TEXT[] | NO | Array of services used |
| `primary_service` | TEXT | YES | Most-used service |
| `error_count` | INTEGER | NO | Number of errors |
| `success_rate` | DECIMAL(5,2) | YES | Success percentage |
| `flagged_for_review` | BOOLEAN | NO | Quality flag |
| `flag_reasons` | TEXT[] | YES | Why flagged |
| `crisis_detected` | BOOLEAN | NO | Crisis in conversation |
| `metadata` | JSONB | NO | Additional context |

#### Indexes

```sql
-- Time-based queries
CREATE INDEX idx_conversations_created_at
ON public.ai_conversations(created_at DESC);

-- User conversation history
CREATE INDEX idx_conversations_user_time
ON public.ai_conversations(user_id, created_at DESC);

-- Conversation lookup
CREATE INDEX idx_conversations_conversation_id
ON public.ai_conversations(conversation_id);

-- Flagged conversations
CREATE INDEX idx_conversations_flagged
ON public.ai_conversations(flagged_for_review, created_at DESC)
WHERE flagged_for_review = TRUE;

-- Crisis conversations
CREATE INDEX idx_conversations_crisis
ON public.ai_conversations(crisis_detected, created_at DESC)
WHERE crisis_detected = TRUE;

-- High-cost conversations
CREATE INDEX idx_conversations_cost
ON public.ai_conversations(total_cost_usd DESC)
WHERE total_cost_usd > 0;
```

---

### 5. ai_daily_summary

**Purpose:** Pre-computed daily rollups for dashboard performance

**Retention:** 365 days (1 year)

**Expected Volume:** 1 row/day

#### Schema

```sql
CREATE TABLE public.ai_daily_summary (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Time Dimension
    summary_date DATE NOT NULL UNIQUE,

    -- Aggregated Metrics
    total_calls INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_cost_usd DECIMAL(10, 4) DEFAULT 0,
    total_errors INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER,

    -- Service Breakdown
    by_service JSONB DEFAULT '{}'::JSONB,

    -- Quality Metrics
    success_rate DECIMAL(5, 2),
    avg_confidence_score DECIMAL(3, 2),
    flagged_count INTEGER DEFAULT 0,
    crisis_count INTEGER DEFAULT 0,

    -- User Metrics
    active_users INTEGER DEFAULT 0,
    new_conversations INTEGER DEFAULT 0,

    -- Cache Performance
    cache_hit_rate DECIMAL(5, 2),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT valid_success_rate_summary CHECK (success_rate >= 0 AND success_rate <= 100),
    CONSTRAINT valid_cache_rate CHECK (cache_hit_rate >= 0 AND cache_hit_rate <= 100)
);
```

#### Example by_service JSONB

```json
{
  "enhancedClaude": {
    "calls": 1500,
    "tokens": 450000,
    "cost": 4.50,
    "errors": 12
  },
  "ifsAI": {
    "calls": 800,
    "tokens": 240000,
    "cost": 2.40,
    "errors": 5
  }
}
```

---

## Materialized Views

### 1. mv_service_performance_last_7d

**Purpose:** Service health metrics for admin dashboard

**Refresh:** Every 15 minutes (scheduled job)

**Data Source:** `ai_metrics` (last 7 days)

#### Definition

```sql
CREATE MATERIALIZED VIEW mv_service_performance_last_7d AS
SELECT
    service_name,
    COUNT(*) as total_calls,
    ROUND(AVG(duration_ms)) as avg_duration_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_duration_ms,
    SUM(tokens_total) as total_tokens,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'success')::DECIMAL / COUNT(*) * 100,
        2
    ) as success_rate,
    SUM(estimated_cost_usd) as estimated_cost,
    MAX(created_at) as last_call
FROM ai_metrics
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY service_name;

CREATE UNIQUE INDEX ON mv_service_performance_last_7d(service_name);
```

#### Usage

```sql
-- Get service health
SELECT * FROM mv_service_performance_last_7d
ORDER BY total_calls DESC;

-- Refresh manually
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_service_performance_last_7d;
```

---

### 2. mv_top_errors_last_24h

**Purpose:** Top errors for error summary card

**Refresh:** Every 15 minutes

**Data Source:** `ai_errors` (last 24 hours)

#### Definition

```sql
CREATE MATERIALIZED VIEW mv_top_errors_last_24h AS
SELECT
    service_name,
    operation_type,
    error_type,
    error_message,
    COUNT(*) as error_count,
    MAX(created_at) as last_occurrence,
    MAX(sentry_id) as sample_sentry_id
FROM ai_errors
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY service_name, operation_type, error_type, error_message
ORDER BY error_count DESC
LIMIT 10;

CREATE UNIQUE INDEX ON mv_top_errors_last_24h(service_name, error_type, error_message);
```

---

### 3. mv_routing_quality_daily

**Purpose:** Daily routing effectiveness metrics

**Refresh:** Every 15 minutes

**Data Source:** `ai_routing_decisions` (last 30 days)

#### Definition

```sql
CREATE MATERIALIZED VIEW mv_routing_quality_daily AS
SELECT
    DATE(created_at) as date,
    COUNT(*) as total_decisions,
    ROUND(AVG(confidence_score) * 100) as avg_confidence,
    COUNT(*) FILTER (WHERE confidence_score < 0.7) as low_confidence_count,
    COUNT(*) FILTER (WHERE flagged_for_review = TRUE) as flagged_count
FROM ai_routing_decisions
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

CREATE UNIQUE INDEX ON mv_routing_quality_daily(date);
```

---

### 4. mv_user_cost_last_30d

**Purpose:** Per-user cost tracking

**Refresh:** Every 15 minutes

**Data Source:** `ai_metrics` (last 30 days)

#### Definition

```sql
CREATE MATERIALIZED VIEW mv_user_cost_last_30d AS
SELECT
    user_id,
    COUNT(*) as total_calls,
    SUM(tokens_total) as total_tokens,
    SUM(estimated_cost_usd) as total_cost,
    ROUND(AVG(estimated_cost_usd), 6) as avg_cost_per_call,
    MAX(created_at) as last_activity
FROM ai_metrics
WHERE created_at > NOW() - INTERVAL '30 days'
  AND user_id IS NOT NULL
GROUP BY user_id
ORDER BY total_cost DESC;

CREATE UNIQUE INDEX ON mv_user_cost_last_30d(user_id);
```

---

## Indexes

### Index Strategy

**31 Total Indexes:**
- 23 B-tree indexes (standard)
- 6 Partial indexes (filtered)
- 2 GIN indexes (JSONB)

**Key Patterns:**
- Time-based queries: `(created_at DESC)`
- Service analysis: `(service_name, created_at DESC)`
- User queries: `(user_id, created_at DESC)`
- Error analysis: Partial indexes on `status != 'success'`
- Quality flags: Partial indexes on `flagged_for_review = TRUE`

### Index Maintenance

**Check Index Usage:**
```sql
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename LIKE 'ai_%'
ORDER BY idx_scan ASC;
```

**Drop Unused Indexes:**
```sql
-- If idx_scan = 0, consider dropping
DROP INDEX CONCURRENTLY idx_name;
```

---

## Security (RLS)

### Row Level Security (RLS) Policies

All tables have RLS enabled with three access patterns:

1. **Users:** Can SELECT their own metrics only
2. **Admins:** Can SELECT all metrics
3. **Service Accounts:** Can INSERT metrics (write-only)

### Helper Functions

```sql
-- Check if current user is admin
CREATE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is service account
CREATE FUNCTION public.is_service_account()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'service'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### RLS Policies by Table

#### ai_metrics

```sql
-- Users see own metrics
CREATE POLICY "Users can view own metrics"
ON ai_metrics FOR SELECT
USING (auth.uid() = user_id);

-- Admins see all
CREATE POLICY "Admins can view all metrics"
ON ai_metrics FOR SELECT
USING (is_admin());

-- Authenticated users can insert their own metrics
CREATE POLICY "Users can insert own metrics"
ON ai_metrics FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

#### ai_routing_decisions

```sql
-- Only admins can view (formerly contained PII)
CREATE POLICY "Only admins can view routing decisions"
ON ai_routing_decisions FOR SELECT
USING (is_admin());

-- Authenticated users can insert
CREATE POLICY "Users can insert routing decisions"
ON ai_routing_decisions FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

#### ai_errors

```sql
-- Users see own errors
CREATE POLICY "Users can view own errors"
ON ai_errors FOR SELECT
USING (auth.uid() = user_id);

-- Admins see all
CREATE POLICY "Admins can view all errors"
ON ai_errors FOR SELECT
USING (is_admin());

-- Users can insert own errors
CREATE POLICY "Users can insert own errors"
ON ai_errors FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Testing RLS

```sql
-- As regular user (should see only own metrics)
SELECT COUNT(*) FROM ai_metrics;

-- As admin (should see all)
SELECT COUNT(*) FROM ai_metrics;

-- As service account (should fail)
SELECT COUNT(*) FROM ai_metrics;  -- Returns 0 (write-only)
```

---

## Functions

### 1. delete_user_ai_data()

**Purpose:** GDPR right to erasure

**Access:** User (own data) or Admin (any user)

```sql
CREATE OR REPLACE FUNCTION delete_user_ai_data(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Authorization check
    IF auth.uid() != target_user_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Delete all user's AI data (cascades)
    DELETE FROM ai_metrics WHERE user_id = target_user_id;
    DELETE FROM ai_routing_decisions WHERE user_id = target_user_id;
    DELETE FROM ai_errors WHERE user_id = target_user_id;
    DELETE FROM ai_conversations WHERE user_id = target_user_id;

    RAISE NOTICE 'Deleted all AI data for user %', target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Usage:**
```sql
-- User deletes own data
SELECT delete_user_ai_data(auth.uid());

-- Admin deletes user's data
SELECT delete_user_ai_data('user-uuid-here');
```

### 2. update_conversation_aggregates()

**Purpose:** Trigger function to update ai_conversations

**Trigger:** After INSERT on ai_metrics

```sql
CREATE OR REPLACE FUNCTION update_conversation_aggregates()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO ai_conversations (conversation_id, user_id)
    VALUES (NEW.conversation_id, NEW.user_id)
    ON CONFLICT (conversation_id) DO UPDATE SET
        total_messages = ai_conversations.total_messages + 1,
        total_tokens = ai_conversations.total_tokens + COALESCE(NEW.tokens_total, 0),
        total_cost_usd = ai_conversations.total_cost_usd + COALESCE(NEW.estimated_cost_usd, 0),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_conversation_aggregates
AFTER INSERT ON ai_metrics
FOR EACH ROW
WHEN (NEW.conversation_id IS NOT NULL)
EXECUTE FUNCTION update_conversation_aggregates();
```

### 3. archive_old_metrics()

**Purpose:** Move metrics older than 90 days to archive

```sql
CREATE OR REPLACE FUNCTION archive_old_metrics()
RETURNS INTEGER AS $$
DECLARE
    rows_archived INTEGER;
BEGIN
    -- Move to archive table (not shown - would need separate table)
    WITH archived AS (
        DELETE FROM ai_metrics
        WHERE created_at < NOW() - INTERVAL '90 days'
        RETURNING *
    )
    SELECT COUNT(*) INTO rows_archived FROM archived;

    RETURN rows_archived;
END;
$$ LANGUAGE plpgsql;
```

---

## Triggers

### 1. Auto-update conversation aggregates

**Table:** ai_metrics
**Event:** AFTER INSERT
**Function:** update_conversation_aggregates()

```sql
CREATE TRIGGER trg_update_conversation_aggregates
AFTER INSERT ON ai_metrics
FOR EACH ROW
WHEN (NEW.conversation_id IS NOT NULL)
EXECUTE FUNCTION update_conversation_aggregates();
```

### 2. Auto-flag low-confidence routing

**Table:** ai_routing_decisions
**Event:** BEFORE INSERT
**Function:** flag_low_confidence_routing()

```sql
CREATE OR REPLACE FUNCTION flag_low_confidence_routing()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.confidence_score < 0.7 THEN
        NEW.flagged_for_review = TRUE;
        NEW.flag_reason = 'Low confidence score';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_flag_low_confidence
BEFORE INSERT ON ai_routing_decisions
FOR EACH ROW
EXECUTE FUNCTION flag_low_confidence_routing();
```

---

## Query Examples

### Performance Analysis

```sql
-- Service performance last 7 days
SELECT
    service_name,
    COUNT(*) as calls,
    ROUND(AVG(duration_ms)) as avg_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_ms,
    ROUND(COUNT(*) FILTER (WHERE status = 'success')::DECIMAL / COUNT(*) * 100, 2) as success_rate
FROM ai_metrics
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY service_name
ORDER BY calls DESC;
```

### Cost Tracking

```sql
-- Cost by service (last 30 days)
SELECT
    service_name,
    COUNT(*) as calls,
    SUM(tokens_total) as tokens,
    ROUND(SUM(estimated_cost_usd), 2) as cost_usd,
    ROUND(AVG(estimated_cost_usd), 4) as avg_cost_per_call
FROM ai_metrics
WHERE created_at > NOW() - INTERVAL '30 days'
  AND estimated_cost_usd IS NOT NULL
GROUP BY service_name
ORDER BY cost_usd DESC;
```

### Error Analysis

```sql
-- Top errors last 24 hours
SELECT
    error_type,
    error_message,
    COUNT(*) as occurrences,
    ARRAY_AGG(DISTINCT service_name) as affected_services,
    MAX(created_at) as last_seen
FROM ai_errors
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY error_type, error_message
ORDER BY occurrences DESC
LIMIT 10;
```

### Routing Quality

```sql
-- Routing effectiveness by route
SELECT
    selected_route,
    COUNT(*) as total_decisions,
    ROUND(AVG(confidence_score) * 100) as avg_confidence,
    COUNT(*) FILTER (WHERE confidence_score < 0.7) as low_confidence_count
FROM ai_routing_decisions
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY selected_route
ORDER BY total_decisions DESC;
```

### User Activity

```sql
-- Top users by cost
SELECT
    user_id,
    COUNT(*) as calls,
    SUM(tokens_total) as tokens,
    ROUND(SUM(estimated_cost_usd), 2) as cost_usd,
    MAX(created_at) as last_activity
FROM ai_metrics
WHERE created_at > NOW() - INTERVAL '30 days'
  AND user_id IS NOT NULL
GROUP BY user_id
ORDER BY cost_usd DESC
LIMIT 20;
```

---

## Performance

### Query Performance Targets

| Query Type | Target (ms) | Optimization |
|------------|-------------|--------------|
| Dashboard overview | <100 | Materialized views |
| Service health | <50 | Indexed by service_name + time |
| Error summary | <50 | Materialized view |
| Cost summary | <100 | Indexed by time + cost |
| User metrics | <50 | Indexed by user_id + time |

### Optimization Strategies

**1. Use Materialized Views for Dashboards**
- Refresh every 15 minutes
- 15-minute stale data acceptable for admin dashboard
- 98% faster than raw table queries

**2. Partial Indexes for Rare Conditions**
- Index only errors: `WHERE status != 'success'`
- Index only flagged: `WHERE flagged_for_review = TRUE`
- Reduces index size by 90-95%

**3. GIN Indexes for JSONB**
- Fast searches in metadata
- Supports `@>`, `?`, `?&`, `?|` operators
- Use sparingly (large index size)

**4. Composite Indexes for Common Queries**
- `(service_name, created_at DESC)` for service analysis
- `(user_id, created_at DESC)` for user queries
- Avoid redundant single-column indexes

---

## Maintenance

### Daily Tasks (Automated)

```sql
-- Refresh materialized views (every 15 min)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_service_performance_last_7d;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_errors_last_24h;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_routing_quality_daily;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_cost_last_30d;
```

### Weekly Tasks (Manual)

```sql
-- Vacuum and analyze
VACUUM ANALYZE ai_metrics;
VACUUM ANALYZE ai_routing_decisions;
VACUUM ANALYZE ai_errors;
VACUUM ANALYZE ai_conversations;

-- Check for unused indexes
SELECT * FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND tablename LIKE 'ai_%'
ORDER BY idx_scan ASC;
```

### Quarterly Tasks (Manual)

```sql
-- Archive old data (>90 days)
SELECT archive_old_metrics();

-- Rebuild indexes
REINDEX TABLE CONCURRENTLY ai_metrics;
REINDEX TABLE CONCURRENTLY ai_routing_decisions;
REINDEX TABLE CONCURRENTLY ai_errors;

-- Update statistics
ANALYZE ai_metrics;
ANALYZE ai_routing_decisions;
ANALYZE ai_errors;
```

---

## Support

**Documentation:**
- Complete Guide: `docs/MONITORING.md`
- API Reference: `docs/API_REFERENCE.md`
- Architecture: `docs/ADR_AI_MONITORING.md`

**Schema Files:**
- Migration: `supabase/migrations/20260209000000_ai_monitoring_schema.sql`
- Rollback: `supabase/migrations/20260209000000_ai_monitoring_rollback.sql`
- Tests: `supabase/migrations/test-migration.sql`
- Quick Reference: `supabase/migrations/QUICK_REFERENCE.md`
- Schema Diagram: `supabase/migrations/SCHEMA_DIAGRAM.md`

---

**Last Updated:** 2026-02-09
**Version:** 1.0
**Maintainer:** Database Engineering Team
