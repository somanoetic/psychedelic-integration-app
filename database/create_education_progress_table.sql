-- Create education_progress table to track user progress through education modules
CREATE TABLE IF NOT EXISTS education_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  module_type TEXT NOT NULL CHECK (module_type IN (
    'nervous_system',
    'ifs_parts',
    'polyvagal_mapping',
    'triggers_glimmers',
    'regulating_resources',
    'ifs_chat'
  )),
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  progress_data JSONB DEFAULT '{}'::jsonb,
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, module_type)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_education_progress_user_id ON education_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_education_progress_module_type ON education_progress(module_type);
CREATE INDEX IF NOT EXISTS idx_education_progress_completed ON education_progress(completed);
CREATE INDEX IF NOT EXISTS idx_education_progress_last_accessed ON education_progress(last_accessed_at DESC);

-- Enable Row Level Security
ALTER TABLE education_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own progress
CREATE POLICY "Users can view own education progress"
  ON education_progress
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own progress
CREATE POLICY "Users can insert own education progress"
  ON education_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own progress
CREATE POLICY "Users can update own education progress"
  ON education_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_education_progress_updated_at
  BEFORE UPDATE ON education_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
