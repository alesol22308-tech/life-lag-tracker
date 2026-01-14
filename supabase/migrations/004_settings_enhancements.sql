-- Migration: Settings Page Enhancements
-- Adds reminder preferences, SMS support, and dark mode preference

-- Add columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_reminder_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_reminder_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_phone_number TEXT,
ADD COLUMN IF NOT EXISTS dark_mode_enabled BOOLEAN DEFAULT false;

-- Migrate existing reminder_enabled to email_reminder_enabled for existing users
UPDATE users
SET email_reminder_enabled = reminder_enabled
WHERE email_reminder_enabled IS NULL AND reminder_enabled IS NOT NULL;
