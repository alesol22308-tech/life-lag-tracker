-- Migration: Micro-Goals
-- Adds micro_goals table for user-defined small habits linked to dimensions

-- Create micro_goals table
CREATE TABLE IF NOT EXISTS micro_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dimension TEXT NOT NULL CHECK (dimension IN ('energy', 'sleep', 'structure', 'initiation', 'engagement', 'sustainability')),
  goal_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_micro_goals_user_id ON micro_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_micro_goals_user_dimension ON micro_goals(user_id, dimension);
CREATE INDEX IF NOT EXISTS idx_micro_goals_user_active ON micro_goals(user_id, is_active);

-- Enable RLS on micro_goals
ALTER TABLE micro_goals ENABLE ROW LEVEL SECURITY;

-- Micro-goals policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'micro_goals' AND policyname = 'Users can view own micro-goals'
  ) THEN
    CREATE POLICY "Users can view own micro-goals"
      ON micro_goals FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'micro_goals' AND policyname = 'Users can insert own micro-goals'
  ) THEN
    CREATE POLICY "Users can insert own micro-goals"
      ON micro_goals FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'micro_goals' AND policyname = 'Users can update own micro-goals'
  ) THEN
    CREATE POLICY "Users can update own micro-goals"
      ON micro_goals FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'micro_goals' AND policyname = 'Users can delete own micro-goals'
  ) THEN
    CREATE POLICY "Users can delete own micro-goals"
      ON micro_goals FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;
