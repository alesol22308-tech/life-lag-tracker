-- Migration: Add narrative summary to checkins
-- Stores the continuity/narrative message with each check-in for historical reference and email inclusion

ALTER TABLE checkins
ADD COLUMN IF NOT EXISTS narrative_summary TEXT;
