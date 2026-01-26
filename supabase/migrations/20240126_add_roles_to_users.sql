-- Add roles column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT ARRAY['user'];

-- Create index on roles for faster filtering (using GIN index for array)
CREATE INDEX IF NOT EXISTS idx_users_roles ON users USING GIN (roles);

-- Initialize superAdmin user
-- Setting roles to include 'superAdmin' and 'admin' and 'user' for full compatibility
UPDATE users 
SET roles = ARRAY['superAdmin', 'admin', 'user']
WHERE phone = '13570226397';

-- Ensure all existing users have at least 'user' role if they are null (though default handles new ones)
UPDATE users
SET roles = ARRAY['user']
WHERE roles IS NULL;
