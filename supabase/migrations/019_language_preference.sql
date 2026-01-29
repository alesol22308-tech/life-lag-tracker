-- Migration 019: Language Preference
-- Adds multi-language support with user language preference

-- Add language_preference column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  language_preference TEXT DEFAULT 'en' 
  CHECK (language_preference IN ('en', 'es', 'fr', 'pt'));

-- Create index for language preference (useful for batch operations like emails)
CREATE INDEX IF NOT EXISTS idx_users_language ON users(language_preference);

-- Add comment
COMMENT ON COLUMN users.language_preference IS 'User preferred language: en (English), es (Spanish), fr (French), pt (Portuguese)';
