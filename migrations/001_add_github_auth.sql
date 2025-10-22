-- Add GitHub authentication fields to profiles table
-- This migration adds support for GitHub OAuth authentication

ALTER TABLE profiles
ADD COLUMN github_username TEXT NULL,
ADD COLUMN github_id INTEGER NULL,
ADD COLUMN auth_provider TEXT NULL CHECK (auth_provider IN ('email', 'github'));

-- Create index on github_id for faster lookups
CREATE INDEX idx_profiles_github_id ON profiles(github_id);

-- Update existing profiles to set auth_provider to 'email' for users who registered via email
UPDATE profiles
SET auth_provider = 'email'
WHERE auth_provider IS NULL AND email IS NOT NULL;

-- Add a comment to document the new fields
COMMENT ON COLUMN profiles.github_username IS 'GitHub username from OAuth authentication';
COMMENT ON COLUMN profiles.github_id IS 'GitHub user ID from OAuth authentication';
COMMENT ON COLUMN profiles.auth_provider IS 'Authentication provider used (email or github)';