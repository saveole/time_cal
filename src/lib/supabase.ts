import { createClient } from '@supabase/supabase-js'

// Database connection without Supabase Auth
// This maintains database connectivity for data operations only
// Authentication is now handled via JWT tokens and GitHub OAuth

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create Supabase client for database operations only
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Note: Auth operations should not use this client
// Use JWT-based authentication via API routes instead