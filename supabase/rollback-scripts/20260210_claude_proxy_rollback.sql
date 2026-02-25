-- Rollback Migration: Claude API Proxy Infrastructure
-- Created: 2026-02-10

-- Drop view
DROP VIEW IF EXISTS user_api_usage_summary;

-- Drop function
DROP FUNCTION IF EXISTS cleanup_old_rate_limits();

-- Drop tables (CASCADE will drop dependent objects)
DROP TABLE IF EXISTS api_usage_logs CASCADE;
DROP TABLE IF EXISTS user_rate_limits CASCADE;

-- Indexes and policies are automatically dropped with tables
