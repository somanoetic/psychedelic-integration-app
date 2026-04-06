-- Migration: Claude API Proxy Infrastructure
-- Created: 2026-02-10
-- Purpose: Support server-side Claude API proxy with rate limiting and usage tracking

-- =====================================================
-- TABLE: user_rate_limits
-- Tracks rate limiting per user per service
-- =====================================================

CREATE TABLE IF NOT EXISTS user_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service TEXT NOT NULL CHECK (service IN ('claude_api', 'other_services')),
  request_count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_request_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one rate limit record per user per service
  UNIQUE (user_id, service)
);

-- Index for fast lookups
CREATE INDEX idx_user_rate_limits_user_service ON user_rate_limits(user_id, service);
CREATE INDEX idx_user_rate_limits_window ON user_rate_limits(window_start) WHERE window_start > NOW() - INTERVAL '7 days';

-- RLS: Users can only read their own rate limit data
ALTER TABLE user_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own rate limits"
  ON user_rate_limits FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can update (edge function)
-- Note: Edge function uses service role key

-- =====================================================
-- TABLE: api_usage_logs
-- Tracks API usage for cost monitoring and analytics
-- =====================================================

CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_estimate NUMERIC(10, 6) NOT NULL DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX idx_api_usage_logs_user ON api_usage_logs(user_id, created_at DESC);
CREATE INDEX idx_api_usage_logs_service ON api_usage_logs(service, created_at DESC);
CREATE INDEX idx_api_usage_logs_created_at ON api_usage_logs(created_at DESC);

-- RLS: Users can only read their own usage logs
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage logs"
  ON api_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTION: Clean up old rate limit windows
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM user_rate_limits
  WHERE window_start < NOW() - INTERVAL '7 days';
END;
$$;

-- =====================================================
-- VIEW: User API usage summary
-- =====================================================

CREATE OR REPLACE VIEW user_api_usage_summary AS
SELECT
  user_id,
  service,
  model,
  DATE(created_at) AS usage_date,
  COUNT(*) AS request_count,
  SUM(input_tokens) AS total_input_tokens,
  SUM(output_tokens) AS total_output_tokens,
  SUM(cost_estimate) AS total_cost
FROM api_usage_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY user_id, service, model, DATE(created_at);

-- RLS on view
ALTER VIEW user_api_usage_summary SET (security_invoker = true);

-- =====================================================
-- GRANT permissions
-- =====================================================

GRANT SELECT ON user_rate_limits TO authenticated;
GRANT SELECT ON api_usage_logs TO authenticated;
GRANT SELECT ON user_api_usage_summary TO authenticated;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE user_rate_limits IS 'Tracks rate limiting per user per service. Updated by edge function.';
COMMENT ON TABLE api_usage_logs IS 'Logs API usage for cost tracking and analytics.';
COMMENT ON VIEW user_api_usage_summary IS 'Aggregated API usage per user per day (last 30 days).';
