-- Migration 015: Accessibility Preferences
-- Adds font size and high contrast mode preferences to users table

-- Add font size preference to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  font_size_preference TEXT DEFAULT 'default' 
  CHECK (font_size_preference IN ('default', 'large', 'extra-large'));

-- Add high contrast mode preference to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  high_contrast_mode BOOLEAN DEFAULT false;

-- Create indexes for query performance
CREATE INDEX IF NOT EXISTS idx_users_font_size_preference ON users(font_size_preference);
CREATE INDEX IF NOT EXISTS idx_users_high_contrast_mode ON users(high_contrast_mode);

-- Add comments for documentation
COMMENT ON COLUMN users.font_size_preference IS 'User font size preference: default (16px), large (18px), or extra-large (20px)';
COMMENT ON COLUMN users.high_contrast_mode IS 'User high contrast mode preference for better accessibility';
