-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  reminder_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Checkins table
CREATE TABLE IF NOT EXISTS checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  lag_score INTEGER NOT NULL CHECK (lag_score >= 0 AND lag_score <= 100),
  drift_category TEXT NOT NULL CHECK (drift_category IN ('aligned', 'mild', 'moderate', 'heavy', 'critical')),
  weakest_dimension TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streaks table
CREATE TABLE IF NOT EXISTS streaks (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  last_checkin_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_checkins_user_id_created_at ON checkins(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_streaks_user_id ON streaks(user_id);

-- Row Level Security (RLS) Policies

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Checkins policies
CREATE POLICY "Users can view own checkins"
  ON checkins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins"
  ON checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Streaks policies
CREATE POLICY "Users can view own streak"
  ON streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own streak"
  ON streaks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streak"
  ON streaks FOR INSERT
  WITH CHECK (auth.uid() = user_id);
