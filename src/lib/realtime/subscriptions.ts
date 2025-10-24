import { supabase, subscriptionManager } from '@/lib/supabase'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

// Types for real-time events
export type RealtimeEvent = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  schema: string
  new: any
  old: any
  timestamp: string
}

export type SubscriptionCallback = (payload: RealtimePostgresChangesPayload<any>) => void

export interface SubscriptionConfig {
  table: string
  schema?: string
  filter?: string
  callback: SubscriptionCallback
  userId?: string
}

// Real-time subscription manager class
export class RealtimeSubscriptionManager {
  private subscriptions: Map<string, RealtimeChannel> = new Map()
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'reconnecting' = 'disconnected'
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor() {
    this.setupConnectionListeners()
  }

  // Set up connection status listeners
  private setupConnectionListeners(): void {
    if (typeof window === 'undefined') return

    // Listen for online/offline events
    window.addEventListener('online', () => {
      console.log('Network connection restored')
      this.handleReconnection()
    })

    window.addEventListener('offline', () => {
      console.log('Network connection lost')
      this.connectionStatus = 'disconnected'
    })

    // Set up heartbeat to monitor connection
    this.startHeartbeat()
  }

  // Start heartbeat monitoring
  private startHeartbeat(): void {
    if (typeof window === 'undefined') return

    this.heartbeatInterval = setInterval(() => {
      this.checkConnectionHealth()
    }, 30000) // Check every 30 seconds
  }

  // Check connection health
  private async checkConnectionHealth(): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)

      if (error) {
        if (this.connectionStatus === 'connected') {
          console.warn('Connection health check failed:', error)
          this.handleDisconnection()
        }
      } else {
        if (this.connectionStatus !== 'connected') {
          this.connectionStatus = 'connected'
          this.reconnectAttempts = 0
          console.log('Connection restored')
        }
      }
    } catch (error) {
      console.error('Connection health check error:', error)
      this.handleDisconnection()
    }
  }

  // Handle disconnection
  private handleDisconnection(): void {
    this.connectionStatus = 'disconnected'
    console.log('Handling disconnection')
  }

  // Handle reconnection
  private async handleReconnection(): Promise<void> {
    if (this.connectionStatus === 'connected' || this.connectionStatus === 'connecting') {
      return
    }

    this.connectionStatus = 'connecting'
    console.log('Attempting to reconnect...')

    try {
      // Wait a bit before attempting reconnection
      await new Promise(resolve => setTimeout(resolve, this.reconnectDelay))

      // Resubscribe to all active subscriptions
      const subscriptionsToResubscribe = Array.from(this.subscriptions.entries())

      for (const [name, channel] of subscriptionsToResubscribe) {
        try {
          await supabase.removeChannel(channel)
        } catch (error) {
          console.warn(`Error removing channel ${name} during reconnection:`, error)
        }
      }

      this.subscriptions.clear()

      // Re-subscribe to all channels
      const configs = Array.from(this.getSubscriptionConfigs().entries())
      for (const [name, config] of configs) {
        await this.subscribe(name, config)
      }

      this.connectionStatus = 'connected'
      this.reconnectAttempts = 0
      console.log('Reconnection successful')
    } catch (error) {
      console.error('Reconnection failed:', error)
      this.connectionStatus = 'disconnected'
      this.reconnectAttempts++

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        // Exponential backoff
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000)
        setTimeout(() => this.handleReconnection(), this.reconnectDelay)
      } else {
        console.error('Max reconnection attempts reached')
      }
    }
  }

  // Store subscription configs for reconnection
  private subscriptionConfigs: Map<string, SubscriptionConfig> = new Map()

  private getSubscriptionConfigs(): Map<string, SubscriptionConfig> {
    return this.subscriptionConfigs
  }

  // Subscribe to a table
  async subscribe(name: string, config: SubscriptionConfig): Promise<RealtimeChannel> {
    try {
      // Remove existing subscription if it exists
      if (this.subscriptions.has(name)) {
        await this.unsubscribe(name)
      }

      // Store config for reconnection
      this.subscriptionConfigs.set(name, config)

      // Build the channel
      let channel = supabase
        .channel(`${config.schema || 'public'}-${config.table}-${name}`)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events
            schema: config.schema || 'public',
            table: config.table,
            filter: config.filter
          },
          (payload) => {
            this.handleRealtimeEvent(payload, config)
          }
        )

      // Subscribe to the channel
      const subscription = await channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to ${name}`)
          this.connectionStatus = 'connected'
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Error subscribing to ${name}`)
          this.handleDisconnection()
        } else if (status === 'TIMED_OUT') {
          console.warn(`Subscription to ${name} timed out`)
        }
      })

      this.subscriptions.set(name, channel)
      return subscription
    } catch (error) {
      console.error(`Error subscribing to ${name}:`, error)
      throw error
    }
  }

  // Handle real-time events
  private handleRealtimeEvent(
    payload: RealtimePostgresChangesPayload<any>,
    config: SubscriptionConfig
  ): void {
    try {
      // Add user filter if userId is provided
      if (config.userId) {
        const payloadData = payload.new as any || payload.old as any
        if (payloadData && payloadData.user_id !== config.userId) {
          return // Ignore events for other users
        }
      }

      // Call the callback with the payload
      config.callback(payload)
    } catch (error) {
      console.error('Error handling real-time event:', error)
    }
  }

  // Unsubscribe from a channel
  async unsubscribe(name: string): Promise<void> {
    try {
      const channel = this.subscriptions.get(name)
      if (channel) {
        await supabase.removeChannel(channel)
        this.subscriptions.delete(name)
        this.subscriptionConfigs.delete(name)
        console.log(`Unsubscribed from ${name}`)
      }
    } catch (error) {
      console.error(`Error unsubscribing from ${name}:`, error)
    }
  }

  // Unsubscribe from all channels
  async unsubscribeAll(): Promise<void> {
    const unsubscribePromises = Array.from(this.subscriptions.keys()).map(name =>
      this.unsubscribe(name)
    )

    await Promise.all(unsubscribePromises)
    console.log('Unsubscribed from all channels')
  }

  // Get connection status
  getConnectionStatus(): string {
    return this.connectionStatus
  }

  // Get subscription count
  getSubscriptionCount(): number {
    return this.subscriptions.size
  }

  // Get active subscriptions
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys())
  }

  // Subscribe to user-specific data
  async subscribeToUserData(userId: string, callbacks: {
    onProfileChange?: SubscriptionCallback
    onActivityChange?: SubscriptionCallback
    onSleepChange?: SubscriptionCallback
    onGoalChange?: SubscriptionCallback
    onPreferenceChange?: SubscriptionCallback
  }): Promise<void> {
    try {
      // Subscribe to profile changes
      if (callbacks.onProfileChange) {
        await this.subscribe(`profile-${userId}`, {
          table: 'profiles',
          filter: `id=eq.${userId}`,
          callback: callbacks.onProfileChange,
          userId
        })
      }

      // Subscribe to activity changes
      if (callbacks.onActivityChange) {
        await this.subscribe(`activities-${userId}`, {
          table: 'activities',
          filter: `user_id=eq.${userId}`,
          callback: callbacks.onActivityChange,
          userId
        })
      }

      // Subscribe to sleep record changes
      if (callbacks.onSleepChange) {
        await this.subscribe(`sleep-${userId}`, {
          table: 'sleep_records',
          filter: `user_id=eq.${userId}`,
          callback: callbacks.onSleepChange,
          userId
        })
      }

      // Subscribe to goal changes
      if (callbacks.onGoalChange) {
        await this.subscribe(`goals-${userId}`, {
          table: 'goals',
          filter: `user_id=eq.${userId}`,
          callback: callbacks.onGoalChange,
          userId
        })
      }

      // Subscribe to preference changes
      if (callbacks.onPreferenceChange) {
        await this.subscribe(`preferences-${userId}`, {
          table: 'user_preferences',
          filter: `user_id=eq.${userId}`,
          callback: callbacks.onPreferenceChange,
          userId
        })
      }

      console.log(`Subscribed to all user data for user ${userId}`)
    } catch (error) {
      console.error('Error subscribing to user data:', error)
      throw error
    }
  }

  // Subscribe to goal progress updates
  async subscribeToGoalProgress(
    userId: string,
    goalId: string,
    callback: SubscriptionCallback
  ): Promise<void> {
    await this.subscribe(`goal-progress-${goalId}`, {
      table: 'activities',
      filter: `user_id=eq.${userId}`,
      callback: (payload) => {
        // Filter activities that affect this goal
        const activity = payload.new as any || payload.old as any
        if (activity && (!activity.category_id || activity.category_id === 'specific-goal-category')) {
          callback(payload)
        }
      },
      userId
    })
  }

  // Cleanup method
  cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    this.unsubscribeAll().catch(console.error)
  }
}

// Global instance
export const realtimeSubscriptionManager = new RealtimeSubscriptionManager()

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    realtimeSubscriptionManager.cleanup()
  })
}

// Note: React hooks for real-time functionality can be implemented in the frontend
// This file focuses on the core subscription management functionality