-- Add api_key column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE;

-- Create index on api_key for fast lookup
CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);

-- Generate a demo api key for the superAdmin (or any specific user)
-- Using a fixed key for demo purposes: 'sk-demo-key-123456'
UPDATE users 
SET api_key = 'sk-demo-key-123456'
WHERE phone = '13570226397';
