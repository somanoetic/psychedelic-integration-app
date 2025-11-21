-- Add discussion transcript field to core beliefs assessments
-- Allows saving AI discussion of results

ALTER TABLE core_beliefs_assessments
ADD COLUMN IF NOT EXISTS discussion_transcript JSONB,
ADD COLUMN IF NOT EXISTS discussion_date TIMESTAMP WITH TIME ZONE;

-- Add index for discussion queries
CREATE INDEX IF NOT EXISTS idx_core_beliefs_discussion ON core_beliefs_assessments(user_id, discussion_date DESC)
WHERE discussion_transcript IS NOT NULL;

-- Comment
COMMENT ON COLUMN core_beliefs_assessments.discussion_transcript IS 'JSONB array of AI conversation about assessment results';
COMMENT ON COLUMN core_beliefs_assessments.discussion_date IS 'When the discussion phase was completed';
