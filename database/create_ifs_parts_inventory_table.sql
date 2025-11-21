-- IFS Parts Inventory Table
-- Stores user's identified IFS parts (Managers, Firefighters, Exiles)

CREATE TABLE IF NOT EXISTS ifs_parts_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parts JSONB NOT NULL DEFAULT '{"managers": [], "firefighters": [], "exiles": []}',
  custom_notes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add RLS policies
ALTER TABLE ifs_parts_inventory ENABLE ROW LEVEL SECURITY;

-- Users can read their own parts inventory
CREATE POLICY "Users can read own parts inventory"
  ON ifs_parts_inventory
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own parts inventory
CREATE POLICY "Users can insert own parts inventory"
  ON ifs_parts_inventory
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own parts inventory
CREATE POLICY "Users can update own parts inventory"
  ON ifs_parts_inventory
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own parts inventory
CREATE POLICY "Users can delete own parts inventory"
  ON ifs_parts_inventory
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ifs_parts_inventory_user_id
  ON ifs_parts_inventory(user_id);

-- Create index for updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_ifs_parts_inventory_updated_at
  ON ifs_parts_inventory(updated_at DESC);
