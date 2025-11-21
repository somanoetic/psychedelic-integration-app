-- Create table for regulating resources discovery
-- Stores both conversation history and extracted resources by category

CREATE TABLE IF NOT EXISTS regulating_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Conversation history (JSONB array of messages)
  conversation JSONB,

  -- Extracted resources by category
  sensory_resources TEXT[], -- Things seen, heard, felt, smelled, tasted
  movement_resources TEXT[], -- Movement and body-based
  connection_resources TEXT[], -- People, pets, communities
  creative_resources TEXT[], -- Creative activities
  spiritual_resources TEXT[], -- Spiritual practices, meaning-making
  cognitive_resources TEXT[], -- Mental practices, reframing

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS regulating_resources_user_id_idx ON regulating_resources(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS regulating_resources_created_at_idx ON regulating_resources(created_at DESC);

-- Enable Row Level Security
ALTER TABLE regulating_resources ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own resources
CREATE POLICY "Users can view their own resources"
  ON regulating_resources
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own resources
CREATE POLICY "Users can insert their own resources"
  ON regulating_resources
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own resources
CREATE POLICY "Users can update their own resources"
  ON regulating_resources
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own resources
CREATE POLICY "Users can delete their own resources"
  ON regulating_resources
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_regulating_resources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_regulating_resources_updated_at_trigger
  BEFORE UPDATE ON regulating_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_regulating_resources_updated_at();

-- Grant permissions
GRANT ALL ON regulating_resources TO authenticated;
GRANT ALL ON regulating_resources TO service_role;
