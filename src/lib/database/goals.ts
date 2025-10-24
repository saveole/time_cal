import { supabase } from '@/lib/supabase'
import type {
  Goal,
  GoalInsert,
  GoalUpdate,
  GoalProgress,
  Activity
} from '@/types/database'

export class GoalsService {
  // Get all goals for a user
  async getGoals(userId: string, includeInactive = false): Promise<Goal[]> {
    let query = supabase
      .from('goals')
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
      .order('created_at', { ascending: false })

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching goals:', error)
      throw error
    }

    return data || []
  }

  // Get goal by ID
  async getGoal(goalId: string, userId: string): Promise<Goal | null> {
    const { data, error } = await supabase
      .from('goals')
      .select(`
        *,
        activity_categories (
          id,
          name,
          color,
          icon
        )
      `)
      .eq('id', goalId)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Goal not found
      }
      console.error('Error fetching goal:', error)
      throw error
    }

    return data
  }

  // Create new goal
  async createGoal(goal: GoalInsert): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .insert(goal)
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
      console.error('Error creating goal:', error)
      throw error
    }

    return data
  }

  // Update existing goal
  async updateGoal(goalId: string, userId: string, updates: GoalUpdate): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', goalId)
      .eq('user_id', userId)
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
      console.error('Error updating goal:', error)
      throw error
    }

    return data
  }

  // Delete goal
  async deleteGoal(goalId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting goal:', error)
      throw error
    }
  }

  // Deactivate goal (soft delete)
  async deactivateGoal(goalId: string, userId: string): Promise<Goal> {
    return await this.updateGoal(goalId, userId, {
      is_active: false,
      end_date: new Date().toISOString().split('T')[0]
    })
  }

  // Calculate goal progress
  async getGoalProgress(goalId: string, userId: string): Promise<GoalProgress | null> {
    try {
      const goal = await this.getGoal(goalId, userId)
      if (!goal) {
        return null
      }

      const completedHours = await this.calculateCompletedHours(goal, userId)
      const percentage = goal.target_hours > 0 ? (completedHours / goal.target_hours) * 100 : 0
      const daysRemaining = this.calculateDaysRemaining(goal)

      return {
        goalId,
        targetHours: goal.target_hours,
        completedHours,
        percentage: Math.round(percentage * 10) / 10,
        isCompleted: percentage >= 100,
        daysRemaining
      }
    } catch (error) {
      console.error('Error calculating goal progress:', error)
      throw error
    }
  }

  // Calculate completed hours for a goal
  private async calculateCompletedHours(goal: Goal, userId: string): Promise<number> {
    const startDate = this.getStartDateForGoal(goal)
    const endDate = this.getEndDateForGoal(goal)

    let query = supabase
      .from('activities')
      .select('duration_minutes')
      .eq('user_id', userId)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .not('duration_minutes', 'is', null)

    // Filter by category if goal has a category
    if (goal.category_id) {
      query = query.eq('category_id', goal.category_id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error calculating completed hours:', error)
      return 0
    }

    const activities = data || []
    const totalMinutes = activities.reduce((sum, activity) => sum + (activity.duration_minutes || 0), 0)
    return Math.round((totalMinutes / 60) * 100) / 100
  }

  // Get start date for goal calculation
  private getStartDateForGoal(goal: Goal): Date {
    const now = new Date()
    const goalStart = new Date(goal.start_date)

    switch (goal.type) {
      case 'daily':
        // For daily goals, always use today
        return new Date(now.getFullYear(), now.getMonth(), now.getDate())
      case 'weekly':
        // For weekly goals, use start of current week
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        startOfWeek.setHours(0, 0, 0, 0)
        return startOfWeek
      case 'monthly':
        // For monthly goals, use start of current month
        return new Date(now.getFullYear(), now.getMonth(), 1)
      default:
        return goalStart > now ? goalStart : now
    }
  }

  // Get end date for goal calculation
  private getEndDateForGoal(goal: Goal): Date {
    const startDate = this.getStartDateForGoal(goal)

    switch (goal.type) {
      case 'daily':
        // End of today
        const endOfDay = new Date(startDate)
        endOfDay.setDate(startDate.getDate() + 1)
        endOfDay.setHours(0, 0, 0, 0)
        return endOfDay
      case 'weekly':
        // End of this week
        const endOfWeek = new Date(startDate)
        endOfWeek.setDate(startDate.getDate() + 7)
        return endOfWeek
      case 'monthly':
        // End of this month
        const endOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1)
        return endOfMonth
      default:
        return goal.end_date ? new Date(goal.end_date) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
    }
  }

  // Calculate days remaining for goal
  private calculateDaysRemaining(goal: Goal): number {
    const endDate = this.getEndDateForGoal(goal)
    const now = new Date()
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  // Get all goals with progress
  async getGoalsWithProgress(userId: string): Promise<(Goal & { progress: GoalProgress })[]> {
    try {
      const goals = await this.getGoals(userId)
      const goalsWithProgress = await Promise.all(
        goals.map(async (goal) => {
          const progress = await this.getGoalProgress(goal.id, userId)
          return {
            ...goal,
            progress: progress || {
              goalId: goal.id,
              targetHours: goal.target_hours,
              completedHours: 0,
              percentage: 0,
              isCompleted: false,
              daysRemaining: this.calculateDaysRemaining(goal)
            }
          }
        })
      )
      return goalsWithProgress
    } catch (error) {
      console.error('Error fetching goals with progress:', error)
      throw error
    }
  }

  // Get goal analytics and insights
  async getGoalAnalytics(userId: string, weeks = 8): Promise<{
    totalGoalsCreated: number
    completedGoals: number
    averageCompletionRate: number
    mostProductiveCategory: string | null
    goalStreak: number
    weeklyTrends: Array<{
      week: string
      completedGoals: number
      totalGoals: number
    }>
  }> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - (weeks * 7))

      // Get goals in the period
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())

      if (goalsError) {
        console.error('Error fetching goals for analytics:', goalsError)
        throw goalsError
      }

      const allGoals = goals || []
      const totalGoalsCreated = allGoals.length

      // Calculate completed goals (goals that reached 100% completion)
      let completedGoals = 0
      for (const goal of allGoals) {
        const progress = await this.getGoalProgress(goal.id, userId)
        if (progress && progress.isCompleted) {
          completedGoals++
        }
      }

      // Calculate average completion rate
      let totalCompletionRate = 0
      let goalsWithProgress = 0
      for (const goal of allGoals) {
        const progress = await this.getGoalProgress(goal.id, userId)
        if (progress) {
          totalCompletionRate += progress.percentage
          goalsWithProgress++
        }
      }
      const averageCompletionRate = goalsWithProgress > 0 ? totalCompletionRate / goalsWithProgress : 0

      // Find most productive category
      const categoryHours: Record<string, number> = {}
      for (const goal of allGoals) {
        if (goal.category_id) {
          const progress = await this.getGoalProgress(goal.id, userId)
          if (progress) {
            categoryHours[goal.category_id] = (categoryHours[goal.category_id] || 0) + progress.completedHours
          }
        }
      }

      let mostProductiveCategory: string | null = null
      let maxHours = 0
      for (const [categoryId, hours] of Object.entries(categoryHours)) {
        if (hours > maxHours) {
          maxHours = hours
          mostProductiveCategory = categoryId
        }
      }

      // Calculate weekly trends
      const weeklyTrends = []
      for (let i = 0; i < weeks; i++) {
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - (i * 7))
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 7)

        const weekGoals = allGoals.filter(goal => {
          const goalDate = new Date(goal.created_at)
          return goalDate >= weekStart && goalDate < weekEnd
        })

        let weekCompletedGoals = 0
        for (const goal of weekGoals) {
          const progress = await this.getGoalProgress(goal.id, userId)
          if (progress && progress.isCompleted) {
            weekCompletedGoals++
          }
        }

        weeklyTrends.unshift({
          week: `Week ${i + 1}`,
          completedGoals: weekCompletedGoals,
          totalGoals: weekGoals.length
        })
      }

      return {
        totalGoalsCreated,
        completedGoals,
        averageCompletionRate: Math.round(averageCompletionRate * 10) / 10,
        mostProductiveCategory,
        goalStreak: await this.calculateGoalStreak(userId),
        weeklyTrends
      }
    } catch (error) {
      console.error('Error generating goal analytics:', error)
      throw error
    }
  }

  // Calculate current goal streak
  private async calculateGoalStreak(userId: string): Promise<number> {
    try {
      const today = new Date()
      let streak = 0
      let currentDate = new Date(today)

      // Check backwards from today for completed goals
      while (streak < 365) { // Maximum 1 year streak
        const dateStr = currentDate.toISOString().split('T')[0]

        // Check if there are any goals that should be completed by this date
        const { data: dayGoals } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .lte('start_date', dateStr)
          .or(`end_date.is.null,end_date.gte.${dateStr}`)

        if (dayGoals && dayGoals.length > 0) {
          let dayCompleted = false
          for (const goal of dayGoals) {
            const progress = await this.getGoalProgress(goal.id, userId)
            if (progress && progress.isCompleted) {
              dayCompleted = true
              break
            }
          }
          if (dayCompleted) {
            streak++
          } else {
            break
          }
        } else {
          // No goals for this day, break the streak
          break
        }

        currentDate.setDate(currentDate.getDate() - 1)
      }

      return streak
    } catch (error) {
      console.error('Error calculating goal streak:', error)
      return 0
    }
  }

  // Auto-renew goals for next period
  async autoRenewGoals(userId: string): Promise<void> {
    try {
      const now = new Date()
      const today = now.toISOString().split('T')[0]

      // Get goals that need renewal
      const { data: goalsToRenew, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .lt('end_date', today)

      if (error) {
        console.error('Error fetching goals to renew:', error)
        return
      }

      for (const goal of goalsToRenew || []) {
        const nextStartDate = this.getNextPeriodStartDate(goal.type)
        const nextEndDate = this.getNextPeriodEndDate(goal.type, nextStartDate)

        // Create new goal for next period
        await this.createGoal({
          user_id: userId,
          type: goal.type,
          target_hours: goal.target_hours,
          category_id: goal.category_id,
          start_date: nextStartDate,
          end_date: nextEndDate,
          is_active: true
        })

        // Deactivate old goal
        await this.deactivateGoal(goal.id, userId)
      }
    } catch (error) {
      console.error('Error auto-renewing goals:', error)
      throw error
    }
  }

  // Get next period start date
  private getNextPeriodStartDate(goalType: string): string {
    const now = new Date()
    switch (goalType) {
      case 'daily':
        return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString().split('T')[0]
      case 'weekly':
        const startOfNextWeek = new Date(now)
        startOfNextWeek.setDate(now.getDate() + (7 - now.getDay()))
        return startOfNextWeek.toISOString().split('T')[0]
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0]
      default:
        return now.toISOString().split('T')[0]
    }
  }

  // Get next period end date
  private getNextPeriodEndDate(goalType: string, startDate: string): string | null {
    const start = new Date(startDate)
    switch (goalType) {
      case 'daily':
        return start.toISOString().split('T')[0] // Same day for daily goals
      case 'weekly':
        const endOfWeek = new Date(start)
        endOfWeek.setDate(start.getDate() + 7)
        return endOfWeek.toISOString().split('T')[0]
      case 'monthly':
        return new Date(start.getFullYear(), start.getMonth() + 1, 1).toISOString().split('T')[0]
      default:
        return null
    }
  }
}

export const goalsService = new GoalsService()