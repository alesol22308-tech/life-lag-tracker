-- Migration: Push Notifications
-- Adds push notification support for mobile app and optional mid-week check notifications

-- Add push notification columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS push_notification_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS push_notification_token TEXT,
ADD COLUMN IF NOT EXISTS mid_week_check_enabled BOOLEAN DEFAULT false;

-- Create push_notification_devices table (for multi-device support)
CREATE TABLE IF NOT EXISTS push_notification_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_token)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_push_devices_user_id ON push_notification_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_push_devices_token ON push_notification_devices(device_token);

-- Enable RLS on push_notification_devices
ALTER TABLE push_notification_devices ENABLE ROW LEVEL SECURITY;

-- Push notification devices policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'push_notification_devices' AND policyname = 'Users can view own push devices'
  ) THEN
    CREATE POLICY "Users can view own push devices"
      ON push_notification_devices FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'push_notification_devices' AND policyname = 'Users can insert own push devices'
  ) THEN
    CREATE POLICY "Users can insert own push devices"
      ON push_notification_devices FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'push_notification_devices' AND policyname = 'Users can update own push devices'
  ) THEN
    CREATE POLICY "Users can update own push devices"
      ON push_notification_devices FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'push_notification_devices' AND policyname = 'Users can delete own push devices'
  ) THEN
    CREATE POLICY "Users can delete own push devices"
      ON push_notification_devices FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;
