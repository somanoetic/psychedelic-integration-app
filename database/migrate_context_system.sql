-- ============================================================================
-- CONTEXT SYSTEM MIGRATION
-- ============================================================================
-- This migration creates the complete context tracking system for:
-- - IFS Parts Work (discovery, accessing, unburdening)
-- - Polyvagal/Nervous System Patterns
-- - User's therapeutic progress over time
--
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. IFS PARTS INVENTORY (Enhanced)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ifs_parts_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Part Identity
  part_name TEXT,
  part_role TEXT NOT NULL CHECK (part_role IN ('manager', 'firefighter', 'exile')),
  discovery_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_worked_with TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Discovery Phase Data (6 F's)
  location_in_body TEXT,
  appearance_description TEXT,
  age_of_part INTEGER,
  feelings_toward_part TEXT,
  part_feelings TEXT,
  part_wants TEXT,
  part_fears TEXT,
  protective_strategy TEXT,

  -- Relationships Between Parts
  protects_which_exile UUID REFERENCES ifs_parts_inventory(id) ON DELETE SET NULL,
  is_exile BOOLEAN DEFAULT false,
  protected_by_parts UUID[],

  -- Exile Phase Data
  exile_accessed BOOLEAN DEFAULT false,
  exile_access_date TIMESTAMP WITH TIME ZONE,
  original_wound_age INTEGER,
  original_wound_description TEXT,
  original_wound_context TEXT,
  burdens_carried JSONB DEFAULT '[]'::jsonb,

  -- Unburdening Phase Data
  unburdened BOOLEAN DEFAULT false,
  unburdening_date TIMESTAMP WITH TIME ZONE,
  unburdening_method TEXT CHECK (unburdening_method IN ('light', 'water', 'fire', 'earth', 'wind', 'other', NULL)),
  burdens_released JSONB DEFAULT '[]'::jsonb,
  new_qualities JSONB DEFAULT '[]'::jsonb,
  new_role TEXT,

  -- Progress Tracking
  work_phase TEXT DEFAULT 'discovery' CHECK (work_phase IN ('discovery', 'accessing', 'unburdening', 'integrated')),
  sessions_count INTEGER DEFAULT 1,
  needs_follow_up BOOLEAN DEFAULT false,
  follow_up_notes TEXT,
  session_notes JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ifs_parts_user ON ifs_parts_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_ifs_parts_role ON ifs_parts_inventory(part_role);
CREATE INDEX IF NOT EXISTS idx_ifs_parts_phase ON ifs_parts_inventory(work_phase);
CREATE INDEX IF NOT EXISTS idx_ifs_parts_last_worked ON ifs_parts_inventory(last_worked_with DESC);
CREATE INDEX IF NOT EXISTS idx_ifs_parts_exiles ON ifs_parts_inventory(is_exile) WHERE is_exile = true;

ALTER TABLE ifs_parts_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own parts" ON ifs_parts_inventory
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own parts" ON ifs_parts_inventory
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own parts" ON ifs_parts_inventory
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own parts" ON ifs_parts_inventory
  FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_ifs_parts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ifs_parts_updated_at_trigger ON ifs_parts_inventory;
CREATE TRIGGER ifs_parts_updated_at_trigger
  BEFORE UPDATE ON ifs_parts_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_ifs_parts_updated_at();

-- ============================================================================
-- 2. IFS SESSION HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS ifs_session_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  part_id UUID REFERENCES ifs_parts_inventory(id) ON DELETE CASCADE,

  session_type TEXT NOT NULL CHECK (session_type IN ('discovery', 'check_in', 'exile_access', 'unburdening', 'follow_up')),
  session_phase TEXT,
  duration_minutes INTEGER,

  starting_question TEXT,
  part_was_known BOOLEAN DEFAULT false,
  conversation_summary TEXT,
  key_insights TEXT,

  protector_permissions JSONB DEFAULT '[]'::jsonb,
  exile_work_attempted BOOLEAN DEFAULT false,
  exile_work_successful BOOLEAN,

  nervous_system_state_start TEXT,
  nervous_system_state_end TEXT,
  grounding_needed BOOLEAN DEFAULT false,

  completed BOOLEAN DEFAULT false,
  session_outcome TEXT,
  next_steps TEXT,
  follow_up_needed BOOLEAN DEFAULT false,
  follow_up_date DATE,

  session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ifs_sessions_user ON ifs_session_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ifs_sessions_part ON ifs_session_history(part_id);
CREATE INDEX IF NOT EXISTS idx_ifs_sessions_date ON ifs_session_history(session_date DESC);

ALTER TABLE ifs_session_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON ifs_session_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON ifs_session_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON ifs_session_history
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON ifs_session_history
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- 3. POLYVAGAL PATTERNS
-- ============================================================================

CREATE TABLE IF NOT EXISTS polyvagal_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  ventral_patterns JSONB DEFAULT '{"situations": [], "body_sensations": [], "thoughts": [], "behaviors": [], "personal_language": []}'::jsonb,
  sympathetic_patterns JSONB DEFAULT '{"situations": [], "body_sensations": [], "thoughts": [], "behaviors": [], "personal_language": []}'::jsonb,
  dorsal_patterns JSONB DEFAULT '{"situations": [], "body_sensations": [], "thoughts": [], "behaviors": [], "personal_language": []}'::jsonb,

  most_common_triggers JSONB DEFAULT '[]'::jsonb,
  most_reliable_glimmers JSONB DEFAULT '[]'::jsonb,
  individual_resources JSONB DEFAULT '[]'::jsonb,
  interactive_resources JSONB DEFAULT '[]'::jsonb,

  personal_state_language JSONB DEFAULT '{}'::jsonb,
  early_warning_signs JSONB DEFAULT '[]'::jsonb,
  successful_interventions JSONB DEFAULT '[]'::jsonb,

  regulation_capacity TEXT CHECK (regulation_capacity IN ('building', 'developing', 'moderate', 'strong', NULL)),
  awareness_level TEXT CHECK (awareness_level IN ('beginning', 'developing', 'practiced', 'embodied', NULL)),

  mapping_sessions_count INTEGER DEFAULT 0,
  triggers_sessions_count INTEGER DEFAULT 0,
  resources_sessions_count INTEGER DEFAULT 0,

  first_mapped_at TIMESTAMP WITH TIME ZONE,
  last_mapped_at TIMESTAMP WITH TIME ZONE,

  user_notes TEXT,
  ai_observations TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_polyvagal_user ON polyvagal_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_polyvagal_last_mapped ON polyvagal_patterns(last_mapped_at DESC);

ALTER TABLE polyvagal_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own patterns" ON polyvagal_patterns
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own patterns" ON polyvagal_patterns
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own patterns" ON polyvagal_patterns
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own patterns" ON polyvagal_patterns
  FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_polyvagal_patterns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS polyvagal_patterns_updated_at_trigger ON polyvagal_patterns;
CREATE TRIGGER polyvagal_patterns_updated_at_trigger
  BEFORE UPDATE ON polyvagal_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_polyvagal_patterns_updated_at();

-- ============================================================================
-- 4. NERVOUS SYSTEM CONTEXT
-- ============================================================================

CREATE TABLE IF NOT EXISTS nervous_system_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  understands_three_states BOOLEAN DEFAULT false,
  can_identify_current_state BOOLEAN DEFAULT false,
  notices_state_shifts BOOLEAN DEFAULT false,

  knows_their_triggers BOOLEAN DEFAULT false,
  knows_their_glimmers BOOLEAN DEFAULT false,
  recognizes_cycles TEXT,

  has_individual_resources BOOLEAN DEFAULT false,
  has_interactive_resources BOOLEAN DEFAULT false,
  uses_resources_regularly BOOLEAN DEFAULT false,

  regulation_capacity TEXT DEFAULT 'building' CHECK (regulation_capacity IN ('building', 'developing', 'moderate', 'strong')),
  awareness_level TEXT DEFAULT 'beginning' CHECK (awareness_level IN ('beginning', 'developing', 'practiced', 'embodied')),

  can_stay_present_in_dysregulation BOOLEAN DEFAULT false,
  has_compassion_for_states BOOLEAN DEFAULT false,
  sees_states_as_protective BOOLEAN DEFAULT false,

  progress_notes TEXT,
  therapist_notes TEXT,

  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ns_context_user ON nervous_system_context(user_id);

ALTER TABLE nervous_system_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own context" ON nervous_system_context
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own context" ON nervous_system_context
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own context" ON nervous_system_context
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own context" ON nervous_system_context
  FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_ns_context_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ns_context_last_updated_trigger ON nervous_system_context;
CREATE TRIGGER ns_context_last_updated_trigger
  BEFORE UPDATE ON nervous_system_context
  FOR EACH ROW
  EXECUTE FUNCTION update_ns_context_last_updated();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables were created
DO $$
BEGIN
  RAISE NOTICE 'Context system migration complete!';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  - ifs_parts_inventory (enhanced with full lifecycle tracking)';
  RAISE NOTICE '  - ifs_session_history (session tracking)';
  RAISE NOTICE '  - polyvagal_patterns (accumulated nervous system patterns)';
  RAISE NOTICE '  - nervous_system_context (high-level awareness tracking)';
  RAISE NOTICE '';
  RAISE NOTICE 'All tables have RLS enabled and user-specific policies configured.';
END $$;
