-- Migration: Account Deletion & Grace Period
-- Adds soft delete capabilities with optional 30-day grace period

-- Add deletion tracking columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deletion_scheduled_for TIMESTAMPTZ;

-- Create index on deleted_at for filtering active users
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) 
WHERE deleted_at IS NULL;

-- Create index on deletion_scheduled_for for scheduled deletion processing
CREATE INDEX IF NOT EXISTS idx_users_deletion_scheduled ON users(deletion_scheduled_for) 
WHERE deletion_scheduled_for IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.deleted_at IS 'Timestamp when account was soft deleted (NULL = active account)';
COMMENT ON COLUMN users.deletion_scheduled_for IS 'Scheduled deletion date (30-day grace period)';
