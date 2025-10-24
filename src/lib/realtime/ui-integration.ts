import { realtimeSubscriptionManager } from './subscriptions'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { toast } from 'react-hot-toast'

// Type alias for simplicity
type RealtimePayload = RealtimePostgresChangesPayload<any>

// Real-time UI integration utilities
export class RealtimeUIIntegration {
  // Activity real-time updates
  static setupActivityUpdates(userId: string, callbacks: {
    onActivityCreated?: (activity: any) => void
    onActivityUpdated?: (activity: any) => void
    onActivityDeleted?: (activity: any) => void
    onActivityStarted?: (activity: any) => void
    onActivityStopped?: (activity: any) => void
  }): void {
    realtimeSubscriptionManager.subscribe(`activities-ui-${userId}`, {
      table: 'activities',
      filter: `user_id=eq.${userId}`,
      callback: (payload: RealtimePayload) => {
        switch (payload.eventType) {
          case 'INSERT':
            if (payload.new && callbacks.onActivityCreated) {
              callbacks.onActivityCreated(payload.new)
              if ((payload.new as any).is_active) {
                callbacks.onActivityStarted?.(payload.new)
              }
              toast.success('Activity created')
            }
            break

          case 'UPDATE':
            if (payload.new && payload.old) {
              const oldActivity = payload.old as any
              const newActivity = payload.new as any

              if (callbacks.onActivityUpdated) {
                callbacks.onActivityUpdated(newActivity)
              }

              // Check if activity was started or stopped
              if (!oldActivity.is_active && newActivity.is_active && callbacks.onActivityStarted) {
                callbacks.onActivityStarted(newActivity)
                toast.success('Activity started')
              } else if (oldActivity.is_active && !newActivity.is_active && callbacks.onActivityStopped) {
                callbacks.onActivityStopped(newActivity)
                toast.success('Activity stopped')
              } else {
                toast.success('Activity updated')
              }
            }
            break

          case 'DELETE':
            if (payload.old && callbacks.onActivityDeleted) {
              callbacks.onActivityDeleted(payload.old)
              toast.success('Activity deleted')
            }
            break
        }
      },
      userId
    }).catch(console.error)
  }

  // Sleep record real-time updates
  static setupSleepUpdates(userId: string, callbacks: {
    onSleepCreated?: (sleep: any) => void
    onSleepUpdated?: (sleep: any) => void
    onSleepDeleted?: (sleep: any) => void
  }): void {
    realtimeSubscriptionManager.subscribe(`sleep-ui-${userId}`, {
      table: 'sleep_records',
      filter: `user_id=eq.${userId}`,
      callback: (payload: RealtimePayload) => {
        switch (payload.eventType) {
          case 'INSERT':
            if (payload.new && callbacks.onSleepCreated) {
              callbacks.onSleepCreated(payload.new)
              toast.success('Sleep record added')
            }
            break

          case 'UPDATE':
            if (payload.new && callbacks.onSleepUpdated) {
              callbacks.onSleepUpdated(payload.new)
              toast.success('Sleep record updated')
            }
            break

          case 'DELETE':
            if (payload.old && callbacks.onSleepDeleted) {
              callbacks.onSleepDeleted(payload.old)
              toast.success('Sleep record deleted')
            }
            break
        }
      },
      userId
    }).catch(console.error)
  }

  // Goal real-time updates
  static setupGoalUpdates(userId: string, callbacks: {
    onGoalCreated?: (goal: any) => void
    onGoalUpdated?: (goal: any) => void
    onGoalDeleted?: (goal: any) => void
    onGoalCompleted?: (goal: any) => void
  }): void {
    realtimeSubscriptionManager.subscribe(`goals-ui-${userId}`, {
      table: 'goals',
      filter: `user_id=eq.${userId}`,
      callback: (payload: RealtimePayload) => {
        switch (payload.eventType) {
          case 'INSERT':
            if (payload.new && callbacks.onGoalCreated) {
              callbacks.onGoalCreated(payload.new)
              toast.success('Goal created')
            }
            break

          case 'UPDATE':
            if (payload.new && payload.old) {
              const oldGoal = payload.old as any
              const newGoal = payload.new as any

              if (callbacks.onGoalUpdated) {
                callbacks.onGoalUpdated(newGoal)
              }

              // Check if goal was completed
              if (oldGoal.is_active && !newGoal.is_active && callbacks.onGoalCompleted) {
                callbacks.onGoalCompleted(newGoal)
                toast.success('🎉 Goal completed!')
              } else {
                toast.success('Goal updated')
              }
            }
            break

          case 'DELETE':
            if (payload.old && callbacks.onGoalDeleted) {
              callbacks.onGoalDeleted(payload.old)
              toast.success('Goal deleted')
            }
            break
        }
      },
      userId
    }).catch(console.error)
  }

  // Profile real-time updates
  static setupProfileUpdates(userId: string, callbacks: {
    onProfileUpdated?: (profile: any) => void
  }): void {
    realtimeSubscriptionManager.subscribe(`profile-ui-${userId}`, {
      table: 'profiles',
      filter: `id=eq.${userId}`,
      callback: (payload: RealtimePayload) => {
        if (payload.eventType === 'UPDATE' && payload.new && callbacks.onProfileUpdated) {
          callbacks.onProfileUpdated(payload.new)
          toast.success('Profile updated')
        }
      },
      userId
    }).catch(console.error)
  }

  // User preferences real-time updates
  static setupPreferencesUpdates(userId: string, callbacks: {
    onPreferencesUpdated?: (preferences: any) => void
    onThemeChanged?: (theme: string) => void
    onLanguageChanged?: (language: string) => void
  }): void {
    realtimeSubscriptionManager.subscribe(`preferences-ui-${userId}`, {
      table: 'user_preferences',
      filter: `user_id=eq.${userId}`,
      callback: (payload: RealtimePayload) => {
        if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
          const newPrefs = payload.new as any
          const oldPrefs = payload.old as any

          if (callbacks.onPreferencesUpdated) {
            callbacks.onPreferencesUpdated(newPrefs)
          }

          // Check for specific preference changes
          if (oldPrefs.theme !== newPrefs.theme && callbacks.onThemeChanged) {
            callbacks.onThemeChanged(newPrefs.theme)
            toast.success('Theme updated')
          }

          if (oldPrefs.language !== newPrefs.language && callbacks.onLanguageChanged) {
            callbacks.onLanguageChanged(newPrefs.language)
            toast.success('Language updated')
          }

          if (oldPrefs.theme === newPrefs.theme && oldPrefs.language === newPrefs.language) {
            toast.success('Preferences updated')
          }
        }
      },
      userId
    }).catch(console.error)
  }

  // Setup all real-time updates for a user
  static setupAllRealtimeUpdates(userId: string, callbacks: {
    activities?: {
      onActivityCreated?: (activity: any) => void
      onActivityUpdated?: (activity: any) => void
      onActivityDeleted?: (activity: any) => void
      onActivityStarted?: (activity: any) => void
      onActivityStopped?: (activity: any) => void
    }
    sleep?: {
      onSleepCreated?: (sleep: any) => void
      onSleepUpdated?: (sleep: any) => void
      onSleepDeleted?: (sleep: any) => void
    }
    goals?: {
      onGoalCreated?: (goal: any) => void
      onGoalUpdated?: (goal: any) => void
      onGoalDeleted?: (goal: any) => void
      onGoalCompleted?: (goal: any) => void
    }
    profile?: {
      onProfileUpdated?: (profile: any) => void
    }
    preferences?: {
      onPreferencesUpdated?: (preferences: any) => void
      onThemeChanged?: (theme: string) => void
      onLanguageChanged?: (language: string) => void
    }
  }): void {
    if (callbacks.activities) {
      this.setupActivityUpdates(userId, callbacks.activities)
    }

    if (callbacks.sleep) {
      this.setupSleepUpdates(userId, callbacks.sleep)
    }

    if (callbacks.goals) {
      this.setupGoalUpdates(userId, callbacks.goals)
    }

    if (callbacks.profile) {
      this.setupProfileUpdates(userId, callbacks.profile)
    }

    if (callbacks.preferences) {
      this.setupPreferencesUpdates(userId, callbacks.preferences)
    }
  }

  // Cleanup all real-time updates for a user
  static async cleanupAllRealtimeUpdates(userId: string): Promise<void> {
    const subscriptions = [
      `activities-ui-${userId}`,
      `sleep-ui-${userId}`,
      `goals-ui-${userId}`,
      `profile-ui-${userId}`,
      `preferences-ui-${userId}`
    ]

    for (const subscription of subscriptions) {
      await realtimeSubscriptionManager.unsubscribe(subscription)
    }
  }

  // Connection status indicator utilities
  static getConnectionStatusColor(): string {
    const status = realtimeSubscriptionManager.getConnectionStatus()
    switch (status) {
      case 'connected':
        return 'bg-green-500'
      case 'connecting':
      case 'reconnecting':
        return 'bg-yellow-500'
      case 'disconnected':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  static getConnectionStatusText(): string {
    const status = realtimeSubscriptionManager.getConnectionStatus()
    switch (status) {
      case 'connected':
        return 'Connected'
      case 'connecting':
        return 'Connecting...'
      case 'reconnecting':
        return 'Reconnecting...'
      case 'disconnected':
        return 'Disconnected'
      default:
        return 'Unknown'
    }
  }
}

// Optimistic update utilities
export class OptimisticUpdates {
  // Create optimistic activity
  static createOptimisticActivity(activity: any): any {
    return {
      ...activity,
      id: `temp-${Date.now()}`,
      created_at: new Date().toISOString(),
      isOptimistic: true
    }
  }

  // Create optimistic activity update
  static createOptimisticActivityUpdate(originalActivity: any, updates: any): any {
    return {
      ...originalActivity,
      ...updates,
      updated_at: new Date().toISOString(),
      isOptimistic: true
    }
  }

  // Check if an update is optimistic
  static isOptimistic(item: any): boolean {
    return item.isOptimistic === true || (typeof item.id === 'string' && item.id.startsWith('temp-'))
  }

  // Merge optimistic updates with real data
  static mergeOptimisticItems<T extends { id: string; created_at: string; name?: string }>(
    optimisticItems: T[],
    realItems: T[]
  ): T[] {
    const merged = [...optimisticItems]
    const realIds = new Set(realItems.map(item => item.id))

    // Remove optimistic items that have been confirmed by real data
    const filteredOptimistic = merged.filter(item => {
      if (this.isOptimistic(item)) {
        // Check if there's a real item that matches this optimistic item
        return !realItems.some(realItem => {
          // Simple matching logic - can be enhanced based on your needs
          return realItem.name === item.name &&
                 Math.abs(new Date(realItem.created_at).getTime() - new Date(item.created_at).getTime()) < 5000
        })
      }
      return true
    })

    // Add real items that aren't already in optimistic list
    realItems.forEach(realItem => {
      if (!merged.some(item => item.id === realItem.id)) {
        filteredOptimistic.push(realItem)
      }
    })

    return filteredOptimistic
  }
}

// Conflict resolution utilities
export class ConflictResolution {
  // Resolve activity conflicts
  static resolveActivityConflict(
    localActivity: any,
    remoteActivity: any,
    conflictResolution: 'local' | 'remote' | 'merge' = 'merge'
  ): any {
    switch (conflictResolution) {
      case 'local':
        return localActivity
      case 'remote':
        return remoteActivity
      case 'merge':
        return this.mergeActivities(localActivity, remoteActivity)
      default:
        return remoteActivity
    }
  }

  // Merge two activities
  private static mergeActivities(local: any, remote: any): any {
    // Use most recent data, but preserve user intent
    const merged = { ...remote }

    // If local activity has a more recent update time, use local values
    if (local.updated_at && remote.updated_at &&
        new Date(local.updated_at) > new Date(remote.updated_at)) {
      merged.name = local.name
      merged.description = local.description
      merged.category_id = local.category_id
    }

    // If local activity is active and remote is not, keep it active
    if (local.is_active && !remote.is_active) {
      merged.is_active = true
      merged.end_time = null
    }

    return merged
  }

  // Detect conflicts between two items
  static hasConflict<T extends { updated_at: string }>(local: T, remote: T): boolean {
    const localTime = new Date(local.updated_at).getTime()
    const remoteTime = new Date(remote.updated_at).getTime()

    // Consider it a conflict if both were updated within a small time window
    const timeDiff = Math.abs(localTime - remoteTime)
    return timeDiff < 5000 && timeDiff > 0 // 5 second window
  }
}