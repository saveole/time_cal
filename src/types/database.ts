// Database types that match the Supabase schema
// These types are generated based on the SQL schema

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          timezone: string
          github_username: string | null
          github_id: number | null
          auth_provider: 'email' | 'github' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string
          github_username?: string | null
          github_id?: number | null
          auth_provider?: 'email' | 'github' | null
        }
        Update: {
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string
          github_username?: string | null
          github_id?: number | null
          auth_provider?: 'email' | 'github' | null
        }
      }
      sleep_records: {
        Row: {
          id: string
          user_id: string
          date: string
          wake_time: string
          sleep_time: string
          duration_minutes: number
          quality_rating: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          wake_time: string
          sleep_time: string
          quality_rating?: number | null
          notes?: string | null
        }
        Update: {
          date?: string
          wake_time?: string
          sleep_time?: string
          quality_rating?: number | null
          notes?: string | null
        }
      }
      activity_categories: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          icon: string | null
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          icon?: string | null
          is_default?: boolean
        }
        Update: {
          name?: string
          color?: string
          icon?: string | null
          is_default?: boolean
        }
      }
      activities: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          name: string
          description: string | null
          start_time: string
          end_time: string | null
          duration_minutes: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id?: string | null
          name: string
          description?: string | null
          start_time: string
          end_time?: string | null
          is_active?: boolean
        }
        Update: {
          category_id?: string | null
          name?: string
          description?: string | null
          start_time?: string
          end_time?: string | null
          is_active?: boolean
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          type: 'daily' | 'weekly' | 'monthly'
          target_hours: number
          category_id: string | null
          start_date: string
          end_date: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'daily' | 'weekly' | 'monthly'
          target_hours: number
          category_id?: string | null
          start_date: string
          end_date?: string | null
          is_active?: boolean
        }
        Update: {
          type?: 'daily' | 'weekly' | 'monthly'
          target_hours?: number
          category_id?: string | null
          start_date?: string
          end_date?: string | null
          is_active?: boolean
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          theme: 'light' | 'dark' | 'system'
          language: string
          time_format: '12h' | '24h'
          date_format: string
          default_reminders: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: 'light' | 'dark' | 'system'
          language?: string
          time_format?: '12h' | '24h'
          date_format?: string
          default_reminders?: Record<string, any>
        }
        Update: {
          theme?: 'light' | 'dark' | 'system'
          language?: string
          time_format?: '12h' | '24h'
          date_format?: string
          default_reminders?: Record<string, any>
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Utility types for common operations
export type Profile = Database['public']['Tables']['profiles']['Row']
export type SleepRecord = Database['public']['Tables']['sleep_records']['Row']
export type ActivityCategory = Database['public']['Tables']['activity_categories']['Row']
export type Activity = Database['public']['Tables']['activities']['Row']
export type Goal = Database['public']['Tables']['goals']['Row']
export type UserPreferences = Database['public']['Tables']['user_preferences']['Row']

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type SleepRecordInsert = Database['public']['Tables']['sleep_records']['Insert']
export type ActivityCategoryInsert = Database['public']['Tables']['activity_categories']['Insert']
export type ActivityInsert = Database['public']['Tables']['activities']['Insert']
export type GoalInsert = Database['public']['Tables']['goals']['Insert']
export type UserPreferencesInsert = Database['public']['Tables']['user_preferences']['Insert']

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type SleepRecordUpdate = Database['public']['Tables']['sleep_records']['Update']
export type ActivityCategoryUpdate = Database['public']['Tables']['activity_categories']['Update']
export type ActivityUpdate = Database['public']['Tables']['activities']['Update']
export type GoalUpdate = Database['public']['Tables']['goals']['Update']
export type UserPreferencesUpdate = Database['public']['Tables']['user_preferences']['Update']

// GitHub OAuth specific types
export type GitHubProfileData = {
  github_username?: string | null
  github_id?: number | null
  auth_provider?: 'github'
  email?: string | null
  full_name?: string | null
  avatar_url?: string | null
  timezone?: string
}

export type ProfileWithGitHub = Profile & {
  github_username: string | null
  github_id: number | null
  auth_provider: 'email' | 'github' | null
}

// Goal progress types
export type GoalProgress = {
  goalId: string
  targetHours: number
  completedHours: number
  percentage: number
  isCompleted: boolean
  daysRemaining: number
}

// User preference validation types
export type ValidTheme = 'light' | 'dark' | 'system'
export type ValidTimeFormat = '12h' | '24h'
export type ValidLanguage = 'en' | 'zh' | 'es' | 'fr' | 'de' | 'ja'

export type ValidatedUserPreferences = {
  theme: ValidTheme
  language: ValidLanguage
  time_format: ValidTimeFormat
  date_format: string
  default_reminders: Record<string, any>
}