// User related types
export interface User {
  id: string
  email: string
  created_at: string
}

// Sleep tracking types
export interface SleepRecord {
  id: string
  user_id: string
  date: string
  wake_time: string
  sleep_time: string
  duration_minutes: number
  created_at: string
  updated_at: string
}

// Activity tracking types
export interface Activity {
  id: string
  user_id: string
  name: string
  category: ActivityCategory
  description?: string
  start_time: string
  end_time: string
  duration_minutes: number
  created_at: string
  updated_at: string
}

export type ActivityCategory =
  | 'work'
  | 'personal'
  | 'leisure'
  | 'exercise'
  | 'learning'
  | 'other'

// Goal tracking types
export interface Goal {
  id: string
  user_id: string
  type: 'daily' | 'weekly' | 'monthly'
  target_hours: number
  activity_category?: ActivityCategory
  created_at: string
  updated_at: string
}

// Statistics and analytics types
export interface TimeStatistics {
  date: string
  work_hours: number
  personal_hours: number
  total_hours: number
}

export interface WeeklyStats {
  week_start: string
  total_work_hours: number
  total_personal_hours: number
  average_daily_hours: number
  most_productive_day: string
}

// UI Component Props
export interface TimePickerProps {
  value?: string
  onChange?: (time: string) => void
  placeholder?: string
}

export interface ActivityFormProps {
  onSubmit: (activity: Omit<Activity, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void
  initialValues?: Partial<Activity>
}

export interface SleepFormProps {
  onSubmit: (sleep: Omit<SleepRecord, 'id' | 'user_id' | 'duration_minutes' | 'created_at' | 'updated_at'>) => void
  initialValues?: Partial<SleepRecord>
}