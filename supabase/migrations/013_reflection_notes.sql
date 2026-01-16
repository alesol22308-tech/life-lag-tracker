-- Migration: Reflection Notes
-- Adds reflection_notes column to checkins table for optional user reflections

-- Add reflection_notes column to checkins table
ALTER TABLE checkins
ADD COLUMN IF NOT EXISTS reflection_notes TEXT;

-- Add check constraint for 200 character limit
ALTER TABLE checkins
ADD CONSTRAINT check_reflection_notes_length 
CHECK (reflection_notes IS NULL OR length(reflection_notes) <= 200);

-- Create index for faster queries when filtering by reflection notes
CREATE INDEX IF NOT EXISTS idx_checkins_reflection_notes ON checkins(user_id, created_at DESC) 
WHERE reflection_notes IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN checkins.reflection_notes IS 'Optional user reflection notes (max 200 characters)';
