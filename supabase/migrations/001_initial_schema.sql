-- Initial schema for time management system
-- Created during refactoring from vanilla JS to modern tech stack

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Sleep records table
CREATE TABLE IF NOT EXISTS sleep_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  wake_time TIME NOT NULL,
  sleep_time TIME NOT NULL,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    (EXTRACT(EPOCH FROM (sleep_time::timestamp - wake_time::timestamp)) / 60)::INTEGER
  ) STORED,
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, date)
);

-- Activity categories table
CREATE TABLE IF NOT EXISTS activity_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  icon TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, name)
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES activity_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN end_time IS NOT NULL THEN
        (EXTRACT(EPOCH FROM (end_time - start_time)) / 60)::INTEGER
      ELSE NULL
    END
  ) STORED,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly')),
  target_hours DECIMAL(5,2) NOT NULL CHECK (target_hours > 0),
  category_id UUID REFERENCES activity_categories(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  language TEXT DEFAULT 'en',
  time_format TEXT DEFAULT '24h' CHECK (time_format IN ('12h', '24h')),
  date_format TEXT DEFAULT 'YYYY-MM-DD',
  default_reminders JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sleep_records_user_date ON sleep_records(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user_time ON activities(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_activities_active ON activities(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_goals_user_active ON goals(user_id, is_active) WHERE is_active = TRUE;

-- RLS (Row Level Security) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Sleep records policies
CREATE POLICY "Users can view own sleep records" ON sleep_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sleep records" ON sleep_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sleep records" ON sleep_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sleep records" ON sleep_records FOR DELETE USING (auth.uid() = user_id);

-- Activity categories policies
CREATE POLICY "Users can view own categories" ON activity_categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own categories" ON activity_categories FOR ALL USING (auth.uid() = user_id);

-- Activities policies
CREATE POLICY "Users can view own activities" ON activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activities" ON activities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own activities" ON activities FOR DELETE USING (auth.uid() = user_id);

-- Goals policies
CREATE POLICY "Users can view own goals" ON goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own goals" ON goals FOR ALL USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);

-- Functions and triggers for updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER set_profiles_timestamp BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_sleep_records_timestamp BEFORE UPDATE ON sleep_records FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_activities_timestamp BEFORE UPDATE ON activities FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_goals_timestamp BEFORE UPDATE ON goals FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_user_preferences_timestamp BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();

-- Default activity categories for new users
INSERT INTO activity_categories (user_id, name, color, icon, is_default) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Work', '#3b82f6', 'briefcase', TRUE),
  ('00000000-0000-0000-0000-000000000000', 'Personal', '#10b981', 'user', TRUE),
  ('00000000-0000-0000-0000-000000000000', 'Leisure', '#f59e0b', 'coffee', TRUE),
  ('00000000-0000-0000-0000-000000000000', 'Exercise', '#ef4444', 'activity', TRUE),
  ('00000000-0000-0000-0000-000000000000', 'Learning', '#8b5cf6', 'book', TRUE),
  ('00000000-0000-0000-0000-000000000000', 'Other', '#6b7280', 'more-horizontal', TRUE)
ON CONFLICT (user_id, name) DO NOTHING;