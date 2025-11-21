-- Enhanced IFS Parts Inventory Table
-- Stores all discovered parts with full lifecycle tracking (discovery → accessing → unburdening → integration)

CREATE TABLE IF NOT EXISTS ifs_parts_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Part Identity
  part_name TEXT, -- User-given name or descriptor
  part_role TEXT NOT NULL CHECK (part_role IN ('manager', 'firefighter', 'exile')),
  discovery_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_worked_with TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Discovery Phase Data (6 F's)
  location_in_body TEXT, -- Where the part is felt/located
  appearance_description TEXT, -- What the part looks like
  age_of_part INTEGER, -- How old the part feels
  feelings_toward_part TEXT, -- User's feelings toward this part (checking for Self-energy)
  part_feelings TEXT, -- What the part itself is feeling
  part_wants TEXT, -- What the part wants/needs
  part_fears TEXT, -- What the part is afraid would happen if it stopped its role
  protective_strategy TEXT, -- How this part protects (especially for managers/firefighters)

  -- Relationships Between Parts
  protects_which_exile UUID REFERENCES ifs_parts_inventory(id) ON DELETE SET NULL,
  is_exile BOOLEAN DEFAULT false,
  protected_by_parts UUID[], -- Array of protector IDs (for exiles)

  -- Exile Phase Data (only populated if is_exile = true)
  exile_accessed BOOLEAN DEFAULT false,
  exile_access_date TIMESTAMP WITH TIME ZONE,
  original_wound_age INTEGER, -- How old the exile was when wounded
  original_wound_description TEXT, -- What happened to this part
  original_wound_context TEXT, -- Where, who was involved, etc.
  burdens_carried JSONB DEFAULT '[]'::jsonb, -- ["shame", "worthlessness", "terror", "I'm not enough"]

  -- Unburdening Phase Data
  unburdened BOOLEAN DEFAULT false,
  unburdening_date TIMESTAMP WITH TIME ZONE,
  unburdening_method TEXT CHECK (unburdening_method IN ('light', 'water', 'fire', 'earth', 'wind', 'other', NULL)),
  burdens_released JSONB DEFAULT '[]'::jsonb, -- What was released
  new_qualities JSONB DEFAULT '[]'::jsonb, -- ["peace", "joy", "innocence", "worthiness"]
  new_role TEXT, -- The exile's new role in the system after unburdening

  -- Progress & Phase Tracking
  work_phase TEXT DEFAULT 'discovery' CHECK (work_phase IN ('discovery', 'accessing', 'unburdening', 'integrated')),
  sessions_count INTEGER DEFAULT 1, -- How many times user has worked with this part
  needs_follow_up BOOLEAN DEFAULT false,
  follow_up_notes TEXT,

  -- Session Notes (accumulated over time)
  session_notes JSONB DEFAULT '[]'::jsonb, -- [{date, type, key_insights, next_steps}]

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ifs_parts_user ON ifs_parts_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_ifs_parts_role ON ifs_parts_inventory(part_role);
CREATE INDEX IF NOT EXISTS idx_ifs_parts_phase ON ifs_parts_inventory(work_phase);
CREATE INDEX IF NOT EXISTS idx_ifs_parts_last_worked ON ifs_parts_inventory(last_worked_with DESC);
CREATE INDEX IF NOT EXISTS idx_ifs_parts_exiles ON ifs_parts_inventory(is_exile) WHERE is_exile = true;
CREATE INDEX IF NOT EXISTS idx_ifs_parts_unburdened ON ifs_parts_inventory(unburdened) WHERE unburdened = true;

-- Row Level Security
ALTER TABLE ifs_parts_inventory ENABLE ROW LEVEL SECURITY;

-- Users can only see their own parts
CREATE POLICY "Users can view own parts" ON ifs_parts_inventory
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own parts
CREATE POLICY "Users can insert own parts" ON ifs_parts_inventory
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own parts
CREATE POLICY "Users can update own parts" ON ifs_parts_inventory
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own parts
CREATE POLICY "Users can delete own parts" ON ifs_parts_inventory
  FOR DELETE USING (auth.uid() = user_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ifs_parts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
DROP TRIGGER IF EXISTS ifs_parts_updated_at_trigger ON ifs_parts_inventory;
CREATE TRIGGER ifs_parts_updated_at_trigger
  BEFORE UPDATE ON ifs_parts_inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_ifs_parts_updated_at();

-- Comment on table
COMMENT ON TABLE ifs_parts_inventory IS 'Stores all IFS parts discovered by users with full lifecycle tracking from discovery through unburdening';
