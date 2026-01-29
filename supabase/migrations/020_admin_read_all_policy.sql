-- Migration 020: Admin Read All Policy
-- Allows admin users to read all data for analytics purposes

-- Policy for admins to read all checkins
DROP POLICY IF EXISTS "Admins can view all checkins" ON checkins;
CREATE POLICY "Admins can view all checkins"
  ON checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy for admins to read all users (for aggregate counts)
DROP POLICY IF EXISTS "Admins can view all users" ON users;
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    auth.uid() = id 
    OR EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

-- Policy for admins to read all streaks
DROP POLICY IF EXISTS "Admins can view all streaks" ON streaks;
CREATE POLICY "Admins can view all streaks"
  ON streaks FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy for admins to read all milestones
DROP POLICY IF EXISTS "Admins can view all milestones" ON milestones;
CREATE POLICY "Admins can view all milestones"
  ON milestones FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy for admins to read all reminder logs
DROP POLICY IF EXISTS "Admins can view all reminder logs" ON reminder_logs;
CREATE POLICY "Admins can view all reminder logs"
  ON reminder_logs FOR SELECT
  USING (
    auth.uid() = user_id 
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Add comments
COMMENT ON POLICY "Admins can view all checkins" ON checkins IS 'Allows admin users to read all checkins for analytics';
COMMENT ON POLICY "Admins can view all users" ON users IS 'Allows admin users to read all user records for analytics';
