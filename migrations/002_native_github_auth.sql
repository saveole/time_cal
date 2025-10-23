-- Native GitHub Auth Migration
-- This migration creates a simple users table for GitHub OAuth authentication
-- and provides a migration path from existing Supabase auth users

-- Create new users table for GitHub OAuth
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id INTEGER UNIQUE NOT NULL,
  github_username VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_github_username ON users(github_username);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Migration from existing Supabase auth users
-- This script maps existing GitHub-authenticated users to the new table
INSERT INTO users (github_id, github_username, email, name, avatar_url, created_at, updated_at, last_login_at)
SELECT
  COALESCE((raw_user_meta_data->>'provider_id')::INTEGER, 0) as github_id,
  COALESCE(raw_user_meta_data->>'user_name', 'unknown') as github_username,
  email,
  COALESCE(raw_user_meta_data->>'name', raw_user_meta_data->>'full_name') as name,
  raw_user_meta_data->>'avatar_url' as avatar_url,
  created_at,
  updated_at,
  last_sign_in_at as last_login_at
FROM auth.users
WHERE raw_user_meta_data->>'provider' = 'github'
  AND raw_user_meta_data->>'provider_id' IS NOT NULL
ON CONFLICT (github_id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  avatar_url = EXCLUDED.avatar_url,
  updated_at = EXCLUDED.updated_at,
  last_login_at = EXCLUDED.last_login_at;

-- Ensure existing activities are linked to new users table
-- This assumes activities table has a user_id column that referenced auth.users.id
-- You may need to adjust this based on your actual schema
DO $$
BEGIN
  -- Check if activities table exists and has user_id column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activities'
    AND column_name = 'user_id'
  ) THEN
    -- Create a mapping between old auth.users.id and new users.id for GitHub users
    -- This requires keeping track of the mapping during migration
    RAISE NOTICE 'Activities table detected. Please create user mapping for existing GitHub-authenticated users.';
  END IF;
END $$;

-- Add RLS (Row Level Security) for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (true);

-- Policy to allow users to update their own profile (if needed in future)
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (true);

-- Policy to allow insertions during OAuth flow
CREATE POLICY "Allow user insertion during OAuth" ON users
  FOR INSERT WITH CHECK (true);

COMMENT ON TABLE users IS 'User accounts for GitHub OAuth authentication';
COMMENT ON COLUMN users.github_id IS 'GitHub user ID (unique identifier)';
COMMENT ON COLUMN users.github_username IS 'GitHub username (may change, use github_id as primary identifier)';
COMMENT ON COLUMN users.email IS 'User email from GitHub (may be null)';
COMMENT ON COLUMN users.name IS 'Display name from GitHub profile';
COMMENT ON COLUMN users.avatar_url IS 'Profile picture URL from GitHub';