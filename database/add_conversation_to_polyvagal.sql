-- Add conversation field to polyvagal_patterns table
-- Stores the full AI conversation history from nervous system mapping

ALTER TABLE polyvagal_patterns
ADD COLUMN IF NOT EXISTS conversation JSONB;

COMMENT ON COLUMN polyvagal_patterns.conversation IS 'Full AI conversation history from nervous system mapping session';
