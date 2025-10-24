-- GitHub OAuth Integration Migration
-- Add GitHub OAuth fields to profiles table and update related policies

-- Add GitHub OAuth fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS github_username TEXT,
ADD COLUMN IF NOT EXISTS github_id INTEGER,
ADD COLUMN IF NOT EXISTS auth_provider TEXT CHECK (auth_provider IN ('email', 'github'));

-- Add comments for new fields
COMMENT ON COLUMN profiles.github_username IS 'GitHub username from OAuth authentication';
COMMENT ON COLUMN profiles.github_id IS 'GitHub user ID from OAuth authentication';
COMMENT ON COLUMN profiles.auth_provider IS 'Authentication provider used for the account';

-- Create indexes for GitHub OAuth fields for performance
CREATE INDEX IF NOT EXISTS idx_profiles_github_id ON profiles(github_id) WHERE github_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_github_username ON profiles(github_username) WHERE github_username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_auth_provider ON profiles(auth_provider) WHERE auth_provider IS NOT NULL;

-- Add unique constraint for GitHub ID to prevent duplicate GitHub accounts
ALTER TABLE profiles ADD CONSTRAINT unique_github_id UNIQUE (github_id) WHERE github_id IS NOT NULL;

-- Update RLS policies to handle new fields
-- Drop existing policies to recreate them with updated logic
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Recreate policies with support for GitHub OAuth fields
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Add function to handle GitHub profile creation/update
CREATE OR REPLACE FUNCTION handle_github_oauth_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Set auth_provider based on whether GitHub fields are present
  IF NEW.github_id IS NOT NULL THEN
    NEW.auth_provider := 'github';
  ELSIF NEW.email IS NOT NULL THEN
    NEW.auth_provider := 'email';
  END IF;

  -- Auto-set updated_at timestamp
  NEW.updated_at := timezone('utc'::text, now());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for profile updates
DROP TRIGGER IF EXISTS handle_profile_updates ON profiles;
CREATE TRIGGER handle_profile_updates
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_github_oauth_profile();

-- Create function to get or create profile from GitHub OAuth data
CREATE OR REPLACE FUNCTION get_or_create_github_profile(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL,
  p_github_username TEXT DEFAULT NULL,
  p_github_id INTEGER DEFAULT NULL,
  p_timezone TEXT DEFAULT 'UTC'
)
RETURNS TABLE (id UUID, email TEXT, full_name TEXT, avatar_url TEXT, github_username TEXT, github_id INTEGER, auth_provider TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ) AS $$
BEGIN
  -- Try to update existing profile first
  UPDATE profiles
  SET
    email = COALESCE(p_email, email),
    full_name = COALESCE(p_full_name, full_name),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    github_username = COALESCE(p_github_username, github_username),
    github_id = COALESCE(p_github_id, github_id),
    auth_provider = 'github',
    timezone = COALESCE(p_timezone, timezone),
    updated_at = timezone('utc'::text, now())
  WHERE id = p_user_id
  RETURNING
    id, email, full_name, avatar_url, github_username, github_id, auth_provider, created_at, updated_at;

  -- If no rows were updated, insert new profile
  IF NOT FOUND THEN
    INSERT INTO profiles (
      id, email, full_name, avatar_url, github_username, github_id, auth_provider, timezone
    ) VALUES (
      p_user_id, p_email, p_full_name, p_avatar_url, p_github_username, p_github_id, 'github', p_timezone
    )
    RETURNING
      id, email, full_name, avatar_url, github_username, github_id, auth_provider, created_at, updated_at
    INTO
      id, email, full_name, avatar_url, github_username, github_id, auth_provider, created_at, updated_at;
  END IF;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;