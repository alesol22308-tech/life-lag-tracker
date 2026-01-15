-- Add menu_position column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS menu_position TEXT DEFAULT 'left' CHECK (menu_position IN ('left', 'right'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_menu_position ON users(menu_position);
