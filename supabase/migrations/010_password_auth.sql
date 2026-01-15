-- Add password tracking to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_password BOOLEAN DEFAULT false;

-- Update existing users to check if they have a password set
-- This will be updated via application logic when users set passwords
