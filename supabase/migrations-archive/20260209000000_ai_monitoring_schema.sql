-- ============================================================================
-- AI Monitoring & Observability Schema Migration
-- ============================================================================
-- Feature: FEAT-203
-- Version: 1.0
-- Date: 2026-02-09
-- Author: Database Engineering Team
-- Description: Complete schema for AI system monitoring, observability, and quality tracking
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================================================
-- TABLE 1: ai_metrics
-- ============================================================================
-- Purpose: Event stream for all AI service interactions
-- Retention: 90 days (then archive)
-- Expected Volume: ~10K rows/day for 1K users

CREATE TABLE IF NOT EXISTS public.ai_metrics (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Service Identification
    service_name TEXT NOT NULL,
    operation_type TEXT NOT NULL, -- 'chat', 'routing', 'context_building', 'analysis'

    -- User Context
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID, -- Groups related messages together

    -- Performance Metrics
    duration_ms INTEGER NOT NULL, -- Response time in milliseconds
    tokens_input INTEGER,
    tokens_output INTEGER,
    tokens_total INTEGER GENERATED ALWAYS AS (COALESCE(tokens_input, 0) + COALESCE(tokens_output, 0)) STORED,
    estimated_cost_usd DECIMAL(10, 6), -- Cost in USD

    -- Quality Metrics
    status TEXT NOT NULL, -- 'success', 'error', 'timeout', 'rate_limited'
    error_message TEXT,
    error_code TEXT,

    -- Context & Metadata
    model_name TEXT, -- 'claude-3-5-sonnet-20241022', etc.
    cache_hit BOOLEAN DEFAULT FALSE,
    cache_type TEXT, -- 'prompt_cache', 'context_cache', null

    -- Quality Flags
    flagged_for_review BOOLEAN DEFAULT FALSE,
    flag_reason TEXT, -- 'low_confidence', 'crisis_detected', 'inappropriate_content', etc.

    -- Flexible Metadata Storage
    metadata JSONB DEFAULT '{}'::JSONB,

    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('success', 'error', 'timeout', 'rate_limited', 'cancelled')),
    CONSTRAINT valid_operation CHECK (operation_type IN ('chat', 'routing', 'context_building', 'analysis', 'journal', 'assessment')),
    CONSTRAINT positive_duration CHECK (duration_ms >= 0),
    CONSTRAINT positive_tokens CHECK (tokens_input >= 0 AND tokens_output >= 0)
);

-- Indexes for ai_metrics
CREATE INDEX idx_ai_metrics_created_at ON public.ai_metrics(created_at DESC);
CREATE INDEX idx_ai_metrics_service_time ON public.ai_metrics(service_name, created_at DESC);
CREATE INDEX idx_ai_metrics_user_time ON public.ai_metrics(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_ai_metrics_conversation ON public.ai_metrics(conversation_id, created_at) WHERE conversation_id IS NOT NULL;
CREATE INDEX idx_ai_metrics_status ON public.ai_metrics(status) WHERE status != 'success'; -- Partial index for errors
CREATE INDEX idx_ai_metrics_flagged ON public.ai_metrics(flagged_for_review, created_at DESC) WHERE flagged_for_review = TRUE;
CREATE INDEX idx_ai_metrics_metadata ON public.ai_metrics USING GIN(metadata); -- For JSONB queries

-- Comments
COMMENT ON TABLE public.ai_metrics IS 'Event stream for all AI service interactions - tracks performance, cost, and quality';
COMMENT ON COLUMN public.ai_metrics.operation_type IS 'Type of AI operation: chat, routing, context_building, analysis, journal, assessment';
COMMENT ON COLUMN public.ai_metrics.cache_hit IS 'Whether this request used cached prompt or context';
COMMENT ON COLUMN public.ai_metrics.flagged_for_review IS 'Automatically flagged for quality review (low confidence, crisis, etc.)';

-- ============================================================================
-- TABLE 2: ai_routing_decisions
-- ============================================================================
-- Purpose: Audit log for conversational routing decisions
-- Retention: 90 days
-- Expected Volume: ~2K rows/day for 1K users
-- Security: Admin-only access (contains user input preview)

CREATE TABLE IF NOT EXISTS public.ai_routing_decisions (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Links
    metric_id UUID REFERENCES public.ai_metrics(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID,

    -- Routing Decision
    user_input_preview TEXT, -- First 200 chars only (PII-safe preview)
    selected_route TEXT NOT NULL, -- 'huxley', 'ifs', 'polyvagal', 'journal', etc.
    confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
    reasoning TEXT, -- Why this route was chosen

    -- Alternative Routes (not chosen)
    alternative_routes JSONB DEFAULT '[]'::JSONB, -- [{route: 'ifs', score: 0.65}, ...]

    -- Context Used
    context_signals JSONB DEFAULT '{}'::JSONB, -- {recent_topics: [...], emotional_state: 'distressed', ...}

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

-- Indexes for ai_routing_decisions
CREATE INDEX idx_routing_created_at ON public.ai_routing_decisions(created_at DESC);
CREATE INDEX idx_routing_user_time ON public.ai_routing_decisions(user_id, created_at DESC);
CREATE INDEX idx_routing_route ON public.ai_routing_decisions(selected_route, created_at DESC);
CREATE INDEX idx_routing_confidence ON public.ai_routing_decisions(confidence_score) WHERE confidence_score < 0.7; -- Low confidence
CREATE INDEX idx_routing_flagged ON public.ai_routing_decisions(flagged_for_review, created_at DESC) WHERE flagged_for_review = TRUE;
CREATE INDEX idx_routing_alternatives ON public.ai_routing_decisions USING GIN(alternative_routes);

-- Comments
COMMENT ON TABLE public.ai_routing_decisions IS 'Audit log for conversational routing - tracks why each message was routed to specific service';
COMMENT ON COLUMN public.ai_routing_decisions.user_input_preview IS 'First 200 chars of user input - ADMIN ONLY ACCESS';
COMMENT ON COLUMN public.ai_routing_decisions.confidence_score IS 'Routing confidence from 0.00 to 1.00 - flag if < 0.7';
COMMENT ON COLUMN public.ai_routing_decisions.alternative_routes IS 'Other routes considered with their scores (JSONB array)';

-- ============================================================================
-- TABLE 3: ai_errors
-- ============================================================================
-- Purpose: Detailed error tracking with stack traces and Sentry integration
-- Retention: 90 days
-- Expected Volume: ~100 rows/day for 1K users

CREATE TABLE IF NOT EXISTS public.ai_errors (
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
    error_type TEXT NOT NULL, -- 'api_error', 'timeout', 'validation', 'rate_limit', etc.
    error_message TEXT NOT NULL,
    error_code TEXT, -- HTTP status code or API error code
    stack_trace TEXT,

    -- External Integration
    sentry_id TEXT, -- Sentry event ID for correlation
    sentry_url TEXT, -- Direct link to Sentry issue

    -- Recovery Information
    retry_count INTEGER DEFAULT 0,
    recovered BOOLEAN DEFAULT FALSE,
    recovery_action TEXT, -- 'retry_succeeded', 'fallback_used', 'user_notified'

    -- Context
    user_impact TEXT, -- 'high', 'medium', 'low' - how much did this affect the user?
    metadata JSONB DEFAULT '{}'::JSONB,

    -- Constraints
    CONSTRAINT valid_error_type CHECK (error_type IN (
        'api_error', 'timeout', 'validation', 'rate_limit',
        'network', 'parsing', 'internal', 'unknown'
    )),
    CONSTRAINT valid_user_impact CHECK (user_impact IN ('high', 'medium', 'low', 'none'))
);

-- Indexes for ai_errors
CREATE INDEX idx_errors_created_at ON public.ai_errors(created_at DESC);
CREATE INDEX idx_errors_service_time ON public.ai_errors(service_name, created_at DESC);
CREATE INDEX idx_errors_type ON public.ai_errors(error_type, created_at DESC);
CREATE INDEX idx_errors_user_impact ON public.ai_errors(user_impact, created_at DESC) WHERE user_impact IN ('high', 'medium');
CREATE INDEX idx_errors_sentry ON public.ai_errors(sentry_id) WHERE sentry_id IS NOT NULL;
CREATE INDEX idx_errors_unrecovered ON public.ai_errors(recovered, created_at DESC) WHERE recovered = FALSE;

-- Comments
COMMENT ON TABLE public.ai_errors IS 'Detailed error tracking with stack traces and Sentry integration';
COMMENT ON COLUMN public.ai_errors.sentry_id IS 'Sentry event ID for correlation with error monitoring platform';
COMMENT ON COLUMN public.ai_errors.user_impact IS 'Severity of user experience impact: high, medium, low, none';
COMMENT ON COLUMN public.ai_errors.recovery_action IS 'How the error was handled: retry, fallback, notification, etc.';

-- ============================================================================
-- TABLE 4: ai_conversations
-- ============================================================================
-- Purpose: Aggregated metrics per conversation (for cost tracking and quality monitoring)
-- Retention: 90 days
-- Expected Volume: ~5K rows/day for 1K users

CREATE TABLE IF NOT EXISTS public.ai_conversations (
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
    services_used TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array of service names used
    primary_service TEXT, -- Most frequently used service

    -- Quality Metrics
    error_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5, 2), -- Percentage (0.00 to 100.00)

    -- Quality Flags
    flagged_for_review BOOLEAN DEFAULT FALSE,
    flag_reasons TEXT[], -- Multiple reasons possible
    crisis_detected BOOLEAN DEFAULT FALSE,

    -- Metadata
    metadata JSONB DEFAULT '{}'::JSONB,

    -- Constraints
    CONSTRAINT positive_messages CHECK (total_messages >= 0),
    CONSTRAINT positive_tokens CHECK (total_tokens >= 0),
    CONSTRAINT valid_success_rate CHECK (success_rate >= 0 AND success_rate <= 100)
);

-- Indexes for ai_conversations
CREATE INDEX idx_conversations_created_at ON public.ai_conversations(created_at DESC);
CREATE INDEX idx_conversations_user_time ON public.ai_conversations(user_id, created_at DESC);
CREATE INDEX idx_conversations_conversation_id ON public.ai_conversations(conversation_id);
CREATE INDEX idx_conversations_flagged ON public.ai_conversations(flagged_for_review, created_at DESC) WHERE flagged_for_review = TRUE;
CREATE INDEX idx_conversations_crisis ON public.ai_conversations(crisis_detected, created_at DESC) WHERE crisis_detected = TRUE;
CREATE INDEX idx_conversations_cost ON public.ai_conversations(total_cost_usd DESC) WHERE total_cost_usd > 0;

-- Comments
COMMENT ON TABLE public.ai_conversations IS 'Aggregated conversation-level metrics for cost tracking and quality monitoring';
COMMENT ON COLUMN public.ai_conversations.services_used IS 'Array of all services used in this conversation';
COMMENT ON COLUMN public.ai_conversations.success_rate IS 'Percentage of successful messages (0-100)';
COMMENT ON COLUMN public.ai_conversations.crisis_detected IS 'Whether any message in conversation was flagged as crisis';

-- ============================================================================
-- TABLE 5: ai_daily_summary
-- ============================================================================
-- Purpose: Pre-computed daily rollups for dashboard performance
-- Retention: 365 days (1 year)
-- Expected Volume: 1 row/day (can be per-service for more granularity)

CREATE TABLE IF NOT EXISTS public.ai_daily_summary (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Time Dimension
    summary_date DATE NOT NULL,

    -- Aggregated Metrics
    total_calls INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_cost_usd DECIMAL(10, 4) DEFAULT 0,
    total_errors INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER,

    -- Service Breakdown (JSONB for flexibility)
    by_service JSONB DEFAULT '{}'::JSONB,
    -- Example: {"huxley": {"calls": 1500, "tokens": 45000, "cost": 0.45}, ...}

    -- Quality Metrics
    success_rate DECIMAL(5, 2),
    avg_confidence_score DECIMAL(3, 2),
    flagged_count INTEGER DEFAULT 0,
    crisis_count INTEGER DEFAULT 0,

    -- User Metrics
    active_users INTEGER DEFAULT 0,
    new_conversations INTEGER DEFAULT 0,

    -- Cache Performance
    cache_hit_rate DECIMAL(5, 2), -- Percentage

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT unique_summary_date UNIQUE(summary_date),
    CONSTRAINT valid_success_rate_summary CHECK (success_rate >= 0 AND success_rate <= 100),
    CONSTRAINT valid_cache_rate CHECK (cache_hit_rate >= 0 AND cache_hit_rate <= 100)
);

-- Indexes for ai_daily_summary
CREATE INDEX idx_daily_summary_date ON public.ai_daily_summary(summary_date DESC);
CREATE INDEX idx_daily_summary_by_service ON public.ai_daily_summary USING GIN(by_service);

-- Comments
COMMENT ON TABLE public.ai_daily_summary IS 'Pre-computed daily rollups for fast dashboard queries - refreshed nightly';
COMMENT ON COLUMN public.ai_daily_summary.by_service IS 'Service-level breakdown stored as JSONB: {service: {calls, tokens, cost}}';
COMMENT ON COLUMN public.ai_daily_summary.cache_hit_rate IS 'Percentage of requests served from cache (0-100)';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- Security Model:
-- - Users: Can SELECT their own metrics only
-- - Admins: Can SELECT all metrics
-- - Service accounts: Can INSERT metrics (write-only)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.ai_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_routing_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_daily_summary ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND raw_user_meta_data->>'role' = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check service account
CREATE OR REPLACE FUNCTION public.is_service_account()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND raw_user_meta_data->>'account_type' = 'service'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS POLICIES: ai_metrics
-- ============================================================================

-- Users can view their own metrics
CREATE POLICY "Users can view own metrics"
ON public.ai_metrics FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all metrics
CREATE POLICY "Admins can view all metrics"
ON public.ai_metrics FOR SELECT
USING (is_admin());

-- Service accounts can insert metrics
CREATE POLICY "Service accounts can insert metrics"
ON public.ai_metrics FOR INSERT
WITH CHECK (is_service_account());

-- ============================================================================
-- RLS POLICIES: ai_routing_decisions
-- ============================================================================

-- Only admins can view routing decisions (contains user input preview)
CREATE POLICY "Only admins can view routing decisions"
ON public.ai_routing_decisions FOR SELECT
USING (is_admin());

-- Service accounts can insert routing decisions
CREATE POLICY "Service accounts can insert routing decisions"
ON public.ai_routing_decisions FOR INSERT
WITH CHECK (is_service_account());

-- ============================================================================
-- RLS POLICIES: ai_errors
-- ============================================================================

-- Users can view their own errors
CREATE POLICY "Users can view own errors"
ON public.ai_errors FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all errors
CREATE POLICY "Admins can view all errors"
ON public.ai_errors FOR SELECT
USING (is_admin());

-- Service accounts can insert errors
CREATE POLICY "Service accounts can insert errors"
ON public.ai_errors FOR INSERT
WITH CHECK (is_service_account());

-- ============================================================================
-- RLS POLICIES: ai_conversations
-- ============================================================================

-- Users can view their own conversations
CREATE POLICY "Users can view own conversations"
ON public.ai_conversations FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all conversations
CREATE POLICY "Admins can view all conversations"
ON public.ai_conversations FOR SELECT
USING (is_admin());

-- Service accounts can insert/update conversations
CREATE POLICY "Service accounts can insert conversations"
ON public.ai_conversations FOR INSERT
WITH CHECK (is_service_account());

CREATE POLICY "Service accounts can update conversations"
ON public.ai_conversations FOR UPDATE
USING (is_service_account());

-- ============================================================================
-- RLS POLICIES: ai_daily_summary
-- ============================================================================

-- All authenticated users can view daily summaries (no personal data)
CREATE POLICY "Authenticated users can view daily summaries"
ON public.ai_daily_summary FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Service accounts can insert/update daily summaries
CREATE POLICY "Service accounts can insert daily summaries"
ON public.ai_daily_summary FOR INSERT
WITH CHECK (is_service_account());

CREATE POLICY "Service accounts can update daily summaries"
ON public.ai_daily_summary FOR UPDATE
USING (is_service_account());

-- ============================================================================
-- MATERIALIZED VIEWS FOR DASHBOARD QUERIES
-- ============================================================================

-- ============================================================================
-- VIEW 1: Service Performance (Last 7 Days)
-- ============================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_service_performance_last_7d AS
SELECT
    service_name,
    COUNT(*) as total_calls,
    COUNT(*) FILTER (WHERE status = 'success') as successful_calls,
    COUNT(*) FILTER (WHERE status != 'success') as failed_calls,
    ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'success') / COUNT(*), 2) as success_rate,
    ROUND(AVG(duration_ms)::numeric, 0) as avg_duration_ms,
    ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms)::numeric, 0) as p95_duration_ms,
    ROUND(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms)::numeric, 0) as p99_duration_ms,
    SUM(tokens_total) as total_tokens,
    SUM(estimated_cost_usd) as total_cost_usd,
    COUNT(*) FILTER (WHERE cache_hit = TRUE) as cache_hits,
    ROUND(100.0 * COUNT(*) FILTER (WHERE cache_hit = TRUE) / COUNT(*), 2) as cache_hit_rate,
    COUNT(*) FILTER (WHERE flagged_for_review = TRUE) as flagged_count,
    MAX(created_at) as last_call_at
FROM public.ai_metrics
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY service_name;

-- Index for materialized view
CREATE UNIQUE INDEX idx_mv_service_perf_service ON public.mv_service_performance_last_7d(service_name);

-- ============================================================================
-- VIEW 2: Top Errors (Last 24 Hours)
-- ============================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_top_errors_last_24h AS
SELECT
    service_name,
    error_type,
    error_code,
    LEFT(error_message, 200) as error_message_preview,
    COUNT(*) as occurrence_count,
    COUNT(DISTINCT user_id) as affected_users,
    AVG(CASE WHEN user_impact = 'high' THEN 3 WHEN user_impact = 'medium' THEN 2 ELSE 1 END)::numeric(3,2) as avg_impact_score,
    MAX(created_at) as last_occurred_at,
    ARRAY_AGG(DISTINCT sentry_id) FILTER (WHERE sentry_id IS NOT NULL) as sentry_ids
FROM public.ai_errors
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY service_name, error_type, error_code, LEFT(error_message, 200)
ORDER BY occurrence_count DESC
LIMIT 50;

-- Index for materialized view
CREATE UNIQUE INDEX idx_mv_top_errors_composite ON public.mv_top_errors_last_24h(service_name, error_type, error_code, error_message_preview);

-- ============================================================================
-- VIEW 3: Routing Quality (Daily)
-- ============================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_routing_quality_daily AS
SELECT
    DATE(created_at) as routing_date,
    selected_route,
    COUNT(*) as total_routes,
    ROUND(AVG(confidence_score)::numeric, 3) as avg_confidence,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY confidence_score)::numeric, 3) as median_confidence,
    COUNT(*) FILTER (WHERE confidence_score < 0.7) as low_confidence_count,
    COUNT(*) FILTER (WHERE flagged_for_review = TRUE) as flagged_count,
    ROUND(100.0 * COUNT(*) FILTER (WHERE confidence_score < 0.7) / COUNT(*), 2) as low_confidence_rate
FROM public.ai_routing_decisions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), selected_route;

-- Index for materialized view
CREATE UNIQUE INDEX idx_mv_routing_quality_date_route ON public.mv_routing_quality_daily(routing_date, selected_route);

-- ============================================================================
-- VIEW 4: User Cost Summary (Last 30 Days)
-- ============================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_user_cost_last_30d AS
SELECT
    user_id,
    COUNT(*) as total_calls,
    SUM(tokens_total) as total_tokens,
    SUM(estimated_cost_usd) as total_cost_usd,
    ROUND(AVG(duration_ms)::numeric, 0) as avg_response_time_ms,
    COUNT(DISTINCT conversation_id) as conversation_count,
    COUNT(DISTINCT service_name) as services_used_count,
    COUNT(*) FILTER (WHERE status != 'success') as error_count,
    MAX(created_at) as last_activity_at
FROM public.ai_metrics
WHERE created_at >= NOW() - INTERVAL '30 days'
    AND user_id IS NOT NULL
GROUP BY user_id;

-- Index for materialized view
CREATE UNIQUE INDEX idx_mv_user_cost_user_id ON public.mv_user_cost_last_30d(user_id);

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATING AGGREGATES
-- ============================================================================

-- Trigger function: Update ai_conversations aggregate on new metric
CREATE OR REPLACE FUNCTION public.update_conversation_aggregate()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.ai_conversations (
        conversation_id,
        user_id,
        total_messages,
        total_tokens,
        total_cost_usd,
        services_used,
        error_count,
        updated_at
    ) VALUES (
        NEW.conversation_id,
        NEW.user_id,
        1,
        NEW.tokens_total,
        NEW.estimated_cost_usd,
        ARRAY[NEW.service_name],
        CASE WHEN NEW.status != 'success' THEN 1 ELSE 0 END,
        NOW()
    )
    ON CONFLICT (conversation_id) DO UPDATE SET
        total_messages = ai_conversations.total_messages + 1,
        total_tokens = ai_conversations.total_tokens + NEW.tokens_total,
        total_cost_usd = ai_conversations.total_cost_usd + COALESCE(NEW.estimated_cost_usd, 0),
        services_used = array_append(
            ai_conversations.services_used,
            NEW.service_name
        ),
        error_count = ai_conversations.error_count + CASE WHEN NEW.status != 'success' THEN 1 ELSE 0 END,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to ai_metrics
CREATE TRIGGER trigger_update_conversation_aggregate
AFTER INSERT ON public.ai_metrics
FOR EACH ROW
WHEN (NEW.conversation_id IS NOT NULL)
EXECUTE FUNCTION public.update_conversation_aggregate();

-- Trigger function: Auto-flag low confidence routing decisions
CREATE OR REPLACE FUNCTION public.auto_flag_routing_decisions()
RETURNS TRIGGER AS $$
BEGIN
    -- Flag low confidence routes
    IF NEW.confidence_score < 0.7 THEN
        NEW.flagged_for_review := TRUE;
        NEW.flag_reason := 'low_confidence';
    END IF;

    -- Flag crisis routes
    IF NEW.selected_route = 'crisis' THEN
        NEW.flagged_for_review := TRUE;
        NEW.flag_reason := COALESCE(NEW.flag_reason || ', ', '') || 'crisis_route';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to ai_routing_decisions
CREATE TRIGGER trigger_auto_flag_routing
BEFORE INSERT ON public.ai_routing_decisions
FOR EACH ROW
EXECUTE FUNCTION public.auto_flag_routing_decisions();

-- ============================================================================
-- SCHEDULED REFRESH FUNCTIONS
-- ============================================================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION public.refresh_ai_monitoring_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_service_performance_last_7d;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_top_errors_last_24h;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_routing_quality_daily;
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_user_cost_last_30d;
END;
$$ LANGUAGE plpgsql;

-- Note: Schedule this function to run every 15 minutes using pg_cron or Supabase Edge Function
-- Example: SELECT cron.schedule('refresh-ai-views', '*/15 * * * *', 'SELECT refresh_ai_monitoring_views()');

-- ============================================================================
-- GDPR COMPLIANCE: Data Deletion Function
-- ============================================================================

-- Function to delete all user data for GDPR compliance
CREATE OR REPLACE FUNCTION public.delete_user_ai_data(target_user_id UUID)
RETURNS void AS $$
BEGIN
    DELETE FROM public.ai_metrics WHERE user_id = target_user_id;
    DELETE FROM public.ai_routing_decisions WHERE user_id = target_user_id;
    DELETE FROM public.ai_errors WHERE user_id = target_user_id;
    DELETE FROM public.ai_conversations WHERE user_id = target_user_id;
    -- Note: ai_daily_summary is anonymized, no user_id to delete
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DATA RETENTION: Archive Old Data
-- ============================================================================

-- Function to archive data older than 90 days (move to separate archive table or delete)
CREATE OR REPLACE FUNCTION public.archive_old_ai_metrics()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.ai_metrics
    WHERE created_at < NOW() - INTERVAL '90 days'
    RETURNING COUNT(*) INTO deleted_count;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Note: Schedule this function to run daily using pg_cron or Supabase Edge Function
-- Example: SELECT cron.schedule('archive-ai-metrics', '0 2 * * *', 'SELECT archive_old_ai_metrics()');

-- ============================================================================
-- SAMPLE TEST DATA (for development/testing only)
-- ============================================================================
-- Uncomment to insert sample data for testing

/*
-- Sample ai_metrics entries
INSERT INTO public.ai_metrics (
    service_name, operation_type, duration_ms, tokens_input, tokens_output,
    estimated_cost_usd, status, model_name, metadata
) VALUES
    ('enhancedClaudeService', 'chat', 1250, 150, 300, 0.0045, 'success', 'claude-3-5-sonnet-20241022', '{"session_id": "test-123"}'),
    ('conversationalRoutingService', 'routing', 350, 100, 50, 0.0015, 'success', 'claude-3-5-sonnet-20241022', '{}'),
    ('ifsAIService', 'analysis', 2100, 200, 450, 0.0065, 'success', 'claude-3-5-sonnet-20241022', '{}'),
    ('polyvagalAIService', 'assessment', 1800, 180, 400, 0.0058, 'error', 'claude-3-5-sonnet-20241022', '{"error": "timeout"}');

-- Sample routing decisions
INSERT INTO public.ai_routing_decisions (
    user_input_preview, selected_route, confidence_score, reasoning
) VALUES
    ('I am feeling overwhelmed and anxious...', 'polyvagal', 0.92, 'User expressing distress - route to nervous system regulation'),
    ('Can you help me understand my parts?', 'ifs', 0.88, 'User asking about Internal Family Systems - direct language match'),
    ('What should I journal about today?', 'journal', 0.95, 'Direct journal request - clear routing decision');
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON SCHEMA public IS 'AI Monitoring & Observability schema v1.0 - deployed 2026-02-09';

-- Verification queries (run these to verify successful migration)
-- SELECT COUNT(*) FROM public.ai_metrics;
-- SELECT COUNT(*) FROM public.ai_routing_decisions;
-- SELECT COUNT(*) FROM public.ai_errors;
-- SELECT COUNT(*) FROM public.ai_conversations;
-- SELECT COUNT(*) FROM public.ai_daily_summary;
-- SELECT * FROM public.mv_service_performance_last_7d;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
