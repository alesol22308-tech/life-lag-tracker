-- Add push notification and mid-week check columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS push_notification_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS push_notification_token TEXT,
ADD COLUMN IF NOT EXISTS mid_week_check_enabled BOOLEAN DEFAULT false;
