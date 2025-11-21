-- Therapeutic Connections Table
-- Stores cross-domain connections between different therapeutic data
-- Enables AI to make "remember that owl?" type references

CREATE TABLE IF NOT EXISTS therapeutic_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Source (where connection originates)
  source_type TEXT NOT NULL CHECK (source_type IN (
    'integration_journal',
    'ifs_part',
    'ns_pattern',
    'belief_domain',
    'session_intention',
    'daily_glimmer',
    'baseline_log'
  )),
  source_id UUID NOT NULL,  -- ID of the source record
  source_description TEXT,   -- Human-readable description

  -- Target (what it connects to)
  target_type TEXT NOT NULL CHECK (target_type IN (
    'integration_journal',
    'ifs_part',
    'ns_pattern',
    'belief_domain',
    'session_intention',
    'daily_glimmer',
    'baseline_log'
  )),
  target_id UUID NOT NULL,  -- ID of the target record
  target_description TEXT,   -- Human-readable description

  -- Connection details
  connection_type TEXT NOT NULL CHECK (connection_type IN (
    'somatic_match',        -- Body sensation similarity
    'emotional_theme',      -- Emotional pattern connection
    'visual_symbol',        -- Visual imagery match
    'belief_pattern',       -- Core belief connection
    'protective_strategy',  -- IFS protection link
    'trigger_pattern',      -- Nervous system trigger link
    'temporal',             -- Time-based relationship
    'causal',               -- One led to another
    'thematic',             -- General theme/topic
    'other'
  )),

  -- Rich description of the connection
  connection_description TEXT NOT NULL,

  -- Connection metadata
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),  -- 0.00 to 1.00
  discovered_by TEXT NOT NULL CHECK (discovered_by IN ('ai', 'user', 'clinician')),
  confirmed_by_user BOOLEAN DEFAULT false,
  user_notes TEXT,

  -- Therapeutic value
  clinically_significant BOOLEAN DEFAULT false,
  integration_insight TEXT,  -- How this connection aids integration

  -- Timestamps
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_therapeutic_connections_user_id ON therapeutic_connections(user_id);
CREATE INDEX idx_therapeutic_connections_source ON therapeutic_connections(source_type, source_id);
CREATE INDEX idx_therapeutic_connections_target ON therapeutic_connections(target_type, target_id);
CREATE INDEX idx_therapeutic_connections_type ON therapeutic_connections(connection_type);
CREATE INDEX idx_therapeutic_connections_confidence ON therapeutic_connections(confidence DESC);
CREATE INDEX idx_therapeutic_connections_confirmed ON therapeutic_connections(user_id, confirmed_by_user);

-- Composite index for finding connections from a specific source
CREATE INDEX idx_therapeutic_connections_from_source ON therapeutic_connections(
  user_id,
  source_type,
  source_id,
  confidence DESC
);

-- Composite index for finding connections to a specific target
CREATE INDEX idx_therapeutic_connections_to_target ON therapeutic_connections(
  user_id,
  target_type,
  target_id,
  confidence DESC
);

-- Row Level Security
ALTER TABLE therapeutic_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own therapeutic connections"
  ON therapeutic_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own therapeutic connections"
  ON therapeutic_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own therapeutic connections"
  ON therapeutic_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own therapeutic connections"
  ON therapeutic_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Updated timestamp trigger
CREATE TRIGGER update_therapeutic_connections_updated_at
  BEFORE UPDATE ON therapeutic_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE therapeutic_connections IS 'Cross-domain connections between therapeutic data for integrated AI context';
COMMENT ON COLUMN therapeutic_connections.source_type IS 'Type of source record (e.g., integration_journal, ifs_part)';
COMMENT ON COLUMN therapeutic_connections.source_id IS 'UUID of the source record';
COMMENT ON COLUMN therapeutic_connections.target_type IS 'Type of target record';
COMMENT ON COLUMN therapeutic_connections.target_id IS 'UUID of the target record';
COMMENT ON COLUMN therapeutic_connections.connection_type IS 'Nature of the connection (somatic_match, emotional_theme, etc.)';
COMMENT ON COLUMN therapeutic_connections.confidence IS 'AI confidence score 0.00-1.00';
COMMENT ON COLUMN therapeutic_connections.discovered_by IS 'Who identified this connection (ai, user, clinician)';
COMMENT ON COLUMN therapeutic_connections.confirmed_by_user IS 'Has user validated this connection?';
