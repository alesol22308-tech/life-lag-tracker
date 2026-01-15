-- Migration: Auto-advance Setting
-- Adds auto-advance preference for check-in questions and removes dark mode

-- Add auto_advance_enabled column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS auto_advance_enabled BOOLEAN DEFAULT true;

-- Remove dark_mode_enabled column if it exists
ALTER TABLE users
DROP COLUMN IF EXISTS dark_mode_enabled;
