-- Migration: Results Persistence
-- Adds result_data column to checkins table to store full CheckinResult object

-- Add result_data column to checkins table
ALTER TABLE checkins
ADD COLUMN IF NOT EXISTS result_data JSONB;

-- Create index for faster queries on result_data (optional, for future use)
CREATE INDEX IF NOT EXISTS idx_checkins_result_data ON checkins USING GIN (result_data);
