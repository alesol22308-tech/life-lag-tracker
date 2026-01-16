-- Migration 012: Feature Enhancements
-- Theme preference, reflection notes, micro goal tracking, tip feedback, and data export requests

-- Add theme preference to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  theme_preference TEXT DEFAULT 'system' 
  CHECK (theme_preference IN ('system', 'light', 'dark'));

-- Add reflection notes to checkins table (max 200 chars enforced in app)
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS 
  reflection_notes TEXT;

-- Add micro goal completion tracking to checkins table
-- Structure: { "goal_id": "completed" | "skipped" | "in_progress" }
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS 
  micro_goal_completion_status JSONB;

-- Add tip feedback tracking to checkins table
-- Structure: { "helpful": boolean, "used": boolean, "comment": string }
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS 
  tip_feedback JSONB;

-- Create data export requests table
CREATE TABLE IF NOT EXISTS data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL CHECK (export_type IN ('csv', 'json', 'pdf')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_theme_preference ON users(theme_preference);
CREATE INDEX IF NOT EXISTS idx_export_requests_user ON data_export_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_export_requests_status ON data_export_requests(status);
CREATE INDEX IF NOT EXISTS idx_export_requests_created ON data_export_requests(created_at DESC);

-- Add comments for documentation
COMMENT ON COLUMN users.theme_preference IS 'User theme preference: system (follows OS), light, or dark';
COMMENT ON COLUMN checkins.reflection_notes IS 'Optional user reflection notes (max 200 chars enforced in app)';
COMMENT ON COLUMN checkins.micro_goal_completion_status IS 'Tracks completion status of micro goals for this checkin';
COMMENT ON COLUMN checkins.tip_feedback IS 'User feedback on the tip provided with this checkin';
COMMENT ON TABLE data_export_requests IS 'Tracks user data export requests for GDPR compliance and user convenience';
