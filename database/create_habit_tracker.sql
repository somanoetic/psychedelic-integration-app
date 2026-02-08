-- Habit Tracker Tables
-- Track daily therapeutic habits and practices

-- Habits table - defines which habits the user wants to track
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Habit definition
  habit_name TEXT NOT NULL,
  habit_description TEXT,
  habit_category TEXT NOT NULL CHECK (habit_category IN ('morning', 'evening', 'anytime', 'weekly')),
  icon TEXT DEFAULT 'check-circle', -- MaterialIcons name
  color TEXT DEFAULT '#8b5cf6',

  -- Tracking settings
  frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'custom')),
  target_days INTEGER DEFAULT 7, -- For weekly: how many days per week
  reminder_time TEXT, -- Optional reminder time (HH:MM format)

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Habit completions - tracks when habits are completed
CREATE TABLE IF NOT EXISTS habit_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,

  -- Completion details
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completion_date DATE NOT NULL DEFAULT CURRENT_DATE, -- For easy daily queries
  notes TEXT, -- Optional notes about the completion

  -- Streak tracking
  streak_count INTEGER DEFAULT 1, -- Current streak at time of completion

  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_habit FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
  CONSTRAINT unique_habit_completion_per_day UNIQUE (habit_id, completion_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_category ON habits(habit_category);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_id ON habit_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON habit_completions(completion_date DESC);

-- Row Level Security
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;

-- Habits policies
CREATE POLICY habits_select_policy ON habits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY habits_insert_policy ON habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY habits_update_policy ON habits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY habits_delete_policy ON habits
  FOR DELETE USING (auth.uid() = user_id);

-- Habit completions policies
CREATE POLICY habit_completions_select_policy ON habit_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY habit_completions_insert_policy ON habit_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY habit_completions_update_policy ON habit_completions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY habit_completions_delete_policy ON habit_completions
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_habits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER habits_updated_at_trigger
  BEFORE UPDATE ON habits
  FOR EACH ROW
  EXECUTE FUNCTION update_habits_updated_at();

COMMENT ON TABLE habits IS 'User-defined therapeutic habits to track daily';
COMMENT ON TABLE habit_completions IS 'Log of habit completions with streak tracking';
