-- Migration: Retention & Engagement Features
-- Adds fields for continuity, soft streaks, milestones, and preferences

-- Add columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS preferred_checkin_day TEXT,
ADD COLUMN IF NOT EXISTS preferred_checkin_time TIME,
ADD COLUMN IF NOT EXISTS checkin_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS first_checkin_at TIMESTAMPTZ;

-- Add columns to streaks table
ALTER TABLE streaks
ADD COLUMN IF NOT EXISTS streak_type TEXT DEFAULT 'maintenance';

-- Add columns to checkins table
ALTER TABLE checkins
ADD COLUMN IF NOT EXISTS previous_score INTEGER,
ADD COLUMN IF NOT EXISTS score_delta INTEGER;

-- Create milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN ('checkin_count', 'streak', 'recovery')),
  milestone_value INTEGER NOT NULL,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  notified BOOLEAN DEFAULT false,
  UNIQUE(user_id, milestone_type, milestone_value)
);

-- Index for milestones
CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_user_type ON milestones(user_id, milestone_type);

-- Enable RLS on milestones
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Milestones policies (create only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'milestones' AND policyname = 'Users can view own milestones'
  ) THEN
    CREATE POLICY "Users can view own milestones"
      ON milestones FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'milestones' AND policyname = 'Users can insert own milestones'
  ) THEN
    CREATE POLICY "Users can insert own milestones"
      ON milestones FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'milestones' AND policyname = 'Users can update own milestones'
  ) THEN
    CREATE POLICY "Users can update own milestones"
      ON milestones FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;
