import { supabase } from '@/lib/supabase'
import type {
  Activity,
  ActivityInsert,
  ActivityUpdate,
  ActivityCategory
} from '@/types/database'

export class ActivitiesService {
  // Get all activity categories for a user
  async getActivityCategories(userId: string) {
    const { data, error } = await supabase
      .from('activity_categories')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching activity categories:', error)
      throw error
    }

    return data || []
  }

  // Create activity category
  async createActivityCategory(category: Omit<ActivityCategory, 'id' | 'user_id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('activity_categories')
      .insert(category)
      .select()
      .single()

    if (error) {
      console.error('Error creating activity category:', error)
      throw error
    }

    return data
  }

  // Get activities for a user with optional date range
  async getActivities(userId: string, startDate?: string, endDate?: string, limit = 50) {
    let query = supabase
      .from('activities')
      .select(`
        *,
        activity_categories (
          id,
          name,
          color,
          icon
        )
      `)
      .eq('user_id', userId)
      .order('start_time', { ascending: false })
      .limit(limit)

    if (startDate) {
      query = query.gte('start_time', startDate)
    }
    if (endDate) {
      query = query.lte('start_time', endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching activities:', error)
      throw error
    }

    return data || []
  }

  // Get active activity
  async getActiveActivity(userId: string) {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        activity_categories (
          id,
          name,
          color,
          icon
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching active activity:', error)
      throw error
    }

    return data
  }

  // Create activity
  async createActivity(activity: ActivityInsert) {
    const { data, error } = await supabase
      .from('activities')
      .insert(activity)
      .select(`
        *,
        activity_categories (
          id,
          name,
          color,
          icon
        )
      `)
      .single()

    if (error) {
      console.error('Error creating activity:', error)
      throw error
    }

    return data
  }

  // Update activity
  async updateActivity(id: string, updates: ActivityUpdate) {
    const { data, error } = await supabase
      .from('activities')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        activity_categories (
          id,
          name,
          color,
          icon
        )
      `)
      .single()

    if (error) {
      console.error('Error updating activity:', error)
      throw error
    }

    return data
  }

  // Stop activity (set end_time and calculate duration)
  async stopActivity(id: string, endTime = new Date().toISOString()) {
    const { data, error } = await supabase
      .from('activities')
      .update({
        end_time: endTime,
        is_active: false
      })
      .eq('id', id)
      .select(`
        *,
        activity_categories (
          id,
          name,
          color,
          icon
        )
      `)
      .single()

    if (error) {
      console.error('Error stopping activity:', error)
      throw error
    }

    return data
  }

  // Delete activity
  async deleteActivity(id: string) {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting activity:', error)
      throw error
    }
  }

  // Get activity statistics for a date range
  async getActivityStats(userId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('activities')
      .select(`
        duration_minutes,
        activity_categories!inner (
          name,
          color
        )
      `)
      .eq('user_id', userId)
      .gte('start_time', startDate)
      .lte('start_time', endDate)
      .not('duration_minutes', 'is', null)

    if (error) {
      console.error('Error fetching activity stats:', error)
      throw error
    }

    const activities = data || []

    // Group by category
    const statsByCategory = activities.reduce((acc, activity) => {
      const category = activity.activity_categories as any
      const categoryName = category.name
      if (!acc[categoryName]) {
        acc[categoryName] = {
          name: categoryName,
          color: category.color,
          totalMinutes: 0,
          count: 0
        }
      }
      acc[categoryName].totalMinutes += activity.duration_minutes
      acc[categoryName].count += 1
      return acc
    }, {} as Record<string, { name: string; color: string; totalMinutes: number; count: number }>)

    // Convert to array and calculate hours
    const stats = Object.values(statsByCategory).map(stat => ({
      ...stat,
      totalHours: Math.round((stat.totalMinutes / 60) * 10) / 10
    }))

    return {
      totalActivities: activities.length,
      totalMinutes: activities.reduce((sum, activity) => sum + activity.duration_minutes, 0),
      stats
    }
  }

  // Get daily activity summary
  async getDailyActivitySummary(userId: string, date: string) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        activity_categories (
          name,
          color
        )
      `)
      .eq('user_id', userId)
      .gte('start_time', startOfDay.toISOString())
      .lte('start_time', endOfDay.toISOString())
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching daily activity summary:', error)
      throw error
    }

    return data || []
  }
}

export const activitiesService = new ActivitiesService()