-- Migration 017: Admin Features
-- Adds role-based access control and reminder logging for analytics

-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  role TEXT DEFAULT 'user' 
  CHECK (role IN ('user', 'admin'));

-- Create reminder_logs table for tracking reminder effectiveness
CREATE TABLE IF NOT EXISTS reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('email', 'sms', 'push')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  -- Track if user checked in within 48 hours of receiving reminder
  checkin_within_48h BOOLEAN DEFAULT NULL,
  checkin_id UUID REFERENCES checkins(id) ON DELETE SET NULL,
  checkin_at TIMESTAMPTZ,
  -- Error tracking
  delivery_status TEXT DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'delivered', 'failed', 'bounced')),
  error_message TEXT
);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_reminder_logs_user_id ON reminder_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_sent_at ON reminder_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_type ON reminder_logs(reminder_type);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_checkin ON reminder_logs(checkin_within_48h) WHERE checkin_within_48h IS NOT NULL;

-- Index for admin analytics on checkins (aggregations)
CREATE INDEX IF NOT EXISTS idx_checkins_created_at ON checkins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_checkins_drift_category ON checkins(drift_category);
CREATE INDEX IF NOT EXISTS idx_checkins_weakest_dimension ON checkins(weakest_dimension);

-- Index for user role lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role) WHERE role = 'admin';

-- Enable RLS on reminder_logs
ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;

-- Reminder logs policies - users can view their own logs, admins can view all (for analytics)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reminder_logs' AND policyname = 'Users can view own reminder logs'
  ) THEN
    CREATE POLICY "Users can view own reminder logs"
      ON reminder_logs FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reminder_logs' AND policyname = 'System can insert reminder logs'
  ) THEN
    -- Allow inserts via service role (for reminder system)
    CREATE POLICY "System can insert reminder logs"
      ON reminder_logs FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reminder_logs' AND policyname = 'System can update reminder logs'
  ) THEN
    -- Allow updates via service role (for tracking check-in completion)
    CREATE POLICY "System can update reminder logs"
      ON reminder_logs FOR UPDATE
      USING (true);
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN users.role IS 'User role for access control: user (default) or admin';
COMMENT ON TABLE reminder_logs IS 'Tracks reminder sends and outcomes for effectiveness analytics';
COMMENT ON COLUMN reminder_logs.checkin_within_48h IS 'Whether user completed a check-in within 48 hours of receiving reminder';
