-- Migration 022: Micro-Goal Commitment and Status Tracking
-- Adds commitment tracking on check-ins and a dedicated status table for micro-goal progress

-- Add micro_goal_commitment column to checkins table
-- Stores user's low-friction intention selection: 'tomorrow', 'later_this_week', or 'not_sure'
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS 
  micro_goal_commitment TEXT;

-- Add comment for documentation
COMMENT ON COLUMN checkins.micro_goal_commitment IS 'User commitment to try the micro-goal: tomorrow, later_this_week, or not_sure';

-- Create micro_goal_status table for tracking status of micro-goals from check-ins
CREATE TABLE IF NOT EXISTS micro_goal_status (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checkin_id UUID NOT NULL REFERENCES checkins(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, checkin_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_micro_goal_status_user_updated ON micro_goal_status(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_micro_goal_status_checkin ON micro_goal_status(checkin_id);

-- Add comment for documentation
COMMENT ON TABLE micro_goal_status IS 'Tracks user progress on micro-goals from check-ins (not_started, in_progress, completed, skipped)';

-- Enable RLS on micro_goal_status
ALTER TABLE micro_goal_status ENABLE ROW LEVEL SECURITY;

-- RLS policies for micro_goal_status
DO $$
BEGIN
  -- Users can view own micro-goal status
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'micro_goal_status' AND policyname = 'Users can view own micro-goal status'
  ) THEN
    CREATE POLICY "Users can view own micro-goal status"
      ON micro_goal_status FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  -- Users can insert own micro-goal status
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'micro_goal_status' AND policyname = 'Users can insert own micro-goal status'
  ) THEN
    CREATE POLICY "Users can insert own micro-goal status"
      ON micro_goal_status FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Users can update own micro-goal status
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'micro_goal_status' AND policyname = 'Users can update own micro-goal status'
  ) THEN
    CREATE POLICY "Users can update own micro-goal status"
      ON micro_goal_status FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;
