-- Migration: Enable push notifications by default
-- Changes default for push_notification_enabled from false to true

-- Update default for new users
ALTER TABLE users ALTER COLUMN push_notification_enabled SET DEFAULT true;

-- Update existing users who have null (never explicitly set) to true
UPDATE users SET push_notification_enabled = true WHERE push_notification_enabled IS NULL;
