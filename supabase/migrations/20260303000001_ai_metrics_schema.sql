-- Migration: AI Metrics & Observability Tables
-- Created: 2026-03-03
-- Bug: BUG-207 - Missing ai_metrics table (PGRST205 error)
-- Purpose: Create tables for AI usage tracking (cost, latency, tokens, errors)
-- Column names match lib/metricsService.js exactly

-- =====================================================
-- TABLE: ai_metrics
-- Core event stream for all AI service interactions
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Service identification
    service_name TEXT NOT NULL,
    operation TEXT NOT NULL,

    -- Performance
    duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
    input_tokens INTEGER CHECK (input_tokens >= 0),
    output_tokens INTEGER CHECK (output_tokens >= 0),
    total_tokens INTEGER CHECK (total_tokens >= 0),
    estimated_cost DECIMAL(10, 6),

    -- Status
    status TEXT NOT NULL CHECK (status IN ('success', 'error', 'timeout', 'rate_limited', 'cancelled')),

    -- Context
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}'::JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ai_metrics_timestamp ON public.ai_metrics(timestamp DESC);
CREATE INDEX idx_ai_metrics_service ON public.ai_metrics(service_name, timestamp DESC);
CREATE INDEX idx_ai_metrics_user ON public.ai_metrics(user_id, timestamp DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_ai_metrics_status ON public.ai_metrics(status) WHERE status != 'success';

COMMENT ON TABLE public.ai_metrics IS 'AI service usage metrics - tracks performance, cost, and token usage';

-- =====================================================
-- TABLE: ai_routing_decisions
-- Audit log for conversational routing
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_routing_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Routing decision
    input_text TEXT,
    selected_route TEXT NOT NULL,
    confidence DECIMAL(3, 2) CHECK (confidence >= 0 AND confidence <= 1),
    alternatives_considered JSONB DEFAULT '[]'::JSONB,

    -- Context
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}'::JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_routing_timestamp ON public.ai_routing_decisions(timestamp DESC);
CREATE INDEX idx_routing_user ON public.ai_routing_decisions(user_id, timestamp DESC);
CREATE INDEX idx_routing_route ON public.ai_routing_decisions(selected_route, timestamp DESC);

COMMENT ON TABLE public.ai_routing_decisions IS 'Audit log for AI conversational routing decisions';

-- =====================================================
-- TABLE: ai_errors
-- Detailed error tracking for AI services
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Service context
    service_name TEXT NOT NULL,
    operation TEXT NOT NULL,

    -- Error details
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    sentry_event_id TEXT,

    -- Context
    context JSONB DEFAULT '{}'::JSONB,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_errors_timestamp ON public.ai_errors(timestamp DESC);
CREATE INDEX idx_errors_service ON public.ai_errors(service_name, timestamp DESC);
CREATE INDEX idx_errors_type ON public.ai_errors(error_type, timestamp DESC);

COMMENT ON TABLE public.ai_errors IS 'Detailed error tracking for AI service failures';

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.ai_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_routing_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_errors ENABLE ROW LEVEL SECURITY;

-- INSERT: any authenticated user can insert metrics
CREATE POLICY "Authenticated users can insert metrics"
ON public.ai_metrics FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert routing decisions"
ON public.ai_routing_decisions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert errors"
ON public.ai_errors FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- SELECT: users can only read their own rows
CREATE POLICY "Users can view own metrics"
ON public.ai_metrics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own routing decisions"
ON public.ai_routing_decisions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view own errors"
ON public.ai_errors FOR SELECT
USING (auth.uid() = user_id);
