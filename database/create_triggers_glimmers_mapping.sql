-- Triggers & Glimmers Mapping Table
-- Conversational exploration of nervous system activators and regulators

CREATE TABLE IF NOT EXISTS triggers_glimmers_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Conversation data
  conversation JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Triggers (things that dysregulate)
  sympathetic_triggers TEXT[], -- Fight/flight activators
  dorsal_triggers TEXT[], -- Shutdown activators
  general_triggers TEXT[], -- Uncategorized triggers

  -- Glimmers (micro-moments of safety)
  sensory_glimmers TEXT[], -- Sights, sounds, smells, textures, tastes
  relational_glimmers TEXT[], -- People, pets, memories
  activity_glimmers TEXT[], -- Rituals, hobbies, movement
  nature_glimmers TEXT[], -- Outdoor elements, weather, animals

  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_triggers_glimmers_user_id ON triggers_glimmers_mapping(user_id);
CREATE INDEX IF NOT EXISTS idx_triggers_glimmers_created_at ON triggers_glimmers_mapping(created_at DESC);

-- Row Level Security
ALTER TABLE triggers_glimmers_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY triggers_glimmers_select_policy ON triggers_glimmers_mapping
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY triggers_glimmers_insert_policy ON triggers_glimmers_mapping
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY triggers_glimmers_update_policy ON triggers_glimmers_mapping
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY triggers_glimmers_delete_policy ON triggers_glimmers_mapping
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_triggers_glimmers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER triggers_glimmers_updated_at_trigger
  BEFORE UPDATE ON triggers_glimmers_mapping
  FOR EACH ROW
  EXECUTE FUNCTION update_triggers_glimmers_updated_at();

COMMENT ON TABLE triggers_glimmers_mapping IS 'Conversational mapping of nervous system triggers and glimmers';
