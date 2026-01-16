-- Migration 016: Onboarding Tracking
-- Adds onboarding completion tracking to users table

-- Add onboarding completed flag to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  onboarding_completed BOOLEAN DEFAULT false;

-- Add onboarding completed timestamp to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  onboarding_completed_at TIMESTAMPTZ;

-- Create index for query performance
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed ON users(onboarding_completed);

-- Add comments for documentation
COMMENT ON COLUMN users.onboarding_completed IS 'Whether user has completed the onboarding tour';
COMMENT ON COLUMN users.onboarding_completed_at IS 'Timestamp when user completed onboarding';
