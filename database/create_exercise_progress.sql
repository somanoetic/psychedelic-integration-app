-- Exercise Progress Table
-- Track user progress through the exercise library/curriculum

CREATE TABLE IF NOT EXISTS exercise_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Exercise identification
  exercise_id TEXT NOT NULL, -- Unique identifier for the exercise (category_title slug)
  exercise_title TEXT NOT NULL,
  exercise_category TEXT NOT NULL,

  -- Completion tracking
  times_completed INTEGER DEFAULT 1,
  first_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- User feedback (optional)
  rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- How helpful was it (1-5)
  notes TEXT, -- Personal notes about the exercise

  -- Favorite flag
  is_favorite BOOLEAN DEFAULT FALSE,

  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_exercise UNIQUE (user_id, exercise_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exercise_progress_user_id ON exercise_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_progress_category ON exercise_progress(exercise_category);
CREATE INDEX IF NOT EXISTS idx_exercise_progress_last_completed ON exercise_progress(last_completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_progress_favorites ON exercise_progress(user_id, is_favorite) WHERE is_favorite = TRUE;

-- Row Level Security
ALTER TABLE exercise_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY exercise_progress_select_policy ON exercise_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY exercise_progress_insert_policy ON exercise_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY exercise_progress_update_policy ON exercise_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY exercise_progress_delete_policy ON exercise_progress
  FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE exercise_progress IS 'Tracks user progress through the exercise curriculum';
COMMENT ON COLUMN exercise_progress.exercise_id IS 'Unique slug identifier for the exercise';
COMMENT ON COLUMN exercise_progress.times_completed IS 'Number of times user has completed this exercise';
COMMENT ON COLUMN exercise_progress.rating IS 'User rating of how helpful the exercise was (1-5)';
COMMENT ON COLUMN exercise_progress.is_favorite IS 'Whether user has marked this as a favorite';
