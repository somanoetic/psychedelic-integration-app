-- Migration: Fix AI metrics RLS policies
-- Created: 2026-03-03
-- Issue: INSERT policies required user_id = auth.uid(), but metricsService
--        often sends user_id as NULL, and NULL = NULL is false in SQL.
-- Fix: Allow any authenticated user to insert. SELECT still restricted to own rows.

-- Drop overly strict INSERT policies
DROP POLICY IF EXISTS "Users can insert own metrics" ON public.ai_metrics;
DROP POLICY IF EXISTS "Users can insert own routing decisions" ON public.ai_routing_decisions;
DROP POLICY IF EXISTS "Users can insert own errors" ON public.ai_errors;

-- Allow any authenticated user to insert metrics
CREATE POLICY "Authenticated users can insert metrics"
ON public.ai_metrics FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert routing decisions"
ON public.ai_routing_decisions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert errors"
ON public.ai_errors FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
