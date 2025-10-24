import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Database connection without Supabase Auth
// This maintains database connectivity for data operations only
// Authentication is now handled via JWT tokens and GitHub OAuth

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Enhanced client configuration
const supabaseOptions = {
  auth: {
    persistSession: false, // We handle JWT tokens manually
    autoRefreshToken: false, // JWT tokens are refreshed via API routes
    detectSessionInUrl: false // We handle OAuth flow manually
  },
  realtime: {
    params: {
      eventsPerSecond: 10 // Limit real-time events for performance
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'time-cal/2.0.0'
    }
  }
}

// Create Supabase client for database operations only
export const supabase = createClient(supabaseUrl, supabaseAnonKey, supabaseOptions)

// Connection health monitoring
class ConnectionMonitor {
  private isHealthy = true
  private lastCheck = new Date()
  private checkInterval = 30000 // 30 seconds

  async checkHealth(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .single()

      this.isHealthy = !error
      this.lastCheck = new Date()
      return this.isHealthy
    } catch (error) {
      console.error('Supabase health check failed:', error)
      this.isHealthy = false
      this.lastCheck = new Date()
      return false
    }
  }

  getStatus(): { isHealthy: boolean; lastCheck: Date } {
    return {
      isHealthy: this.isHealthy,
      lastCheck: this.lastCheck
    }
  }

  startMonitoring(): void {
    setInterval(() => {
      this.checkHealth().catch(console.error)
    }, this.checkInterval)
  }
}

export const connectionMonitor = new ConnectionMonitor()

// Retry mechanism for database operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      if (attempt === maxRetries) {
        console.error(`Operation failed after ${maxRetries + 1} attempts:`, error)
        throw lastError
      }

      // Check if connection is healthy before retrying
      const isHealthy = await connectionMonitor.checkHealth()
      if (!isHealthy) {
        console.warn('Connection unhealthy, waiting before retry...')
      }

      // Exponential backoff
      const delay = delayMs * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))

      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`)
    }
  }

  throw lastError!
}

// Batch operation helper
export async function batchOperation<T>(
  operations: Array<() => Promise<T>>,
  batchSize = 5,
  delayBetweenBatches = 100
): Promise<T[]> {
  const results: T[] = []

  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize)

    try {
      const batchResults = await Promise.all(
        batch.map(op => withRetry(op))
      )
      results.push(...batchResults)
    } catch (error) {
      console.error(`Batch operation failed at index ${i}:`, error)
      throw error
    }

    // Add delay between batches to avoid rate limiting
    if (i + batchSize < operations.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches))
    }
  }

  return results
}

// Error handling wrapper
export function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  return withRetry(async () => {
    try {
      return await operation()
    } catch (error) {
      console.error(`Error in ${context}:`, error)

      // Add context to error
      if (error instanceof Error) {
        throw new Error(`${context}: ${error.message}`)
      }

      throw new Error(`${context}: Unknown error occurred`)
    }
  })
}

// Create authenticated client for specific operations
export function createAuthenticatedClient(jwt: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    ...supabaseOptions,
    global: {
      ...supabaseOptions.global,
      headers: {
        ...supabaseOptions.global?.headers,
        Authorization: `Bearer ${jwt}`
      }
    }
  })
}

// Utility for subscription management
export class SubscriptionManager {
  private subscriptions: Map<string, any> = new Map()

  addSubscription(name: string, subscription: any): void {
    // Clean up existing subscription with same name
    if (this.subscriptions.has(name)) {
      this.subscriptions.get(name)?.unsubscribe()
    }

    this.subscriptions.set(name, subscription)
  }

  removeSubscription(name: string): void {
    const subscription = this.subscriptions.get(name)
    if (subscription) {
      subscription.unsubscribe()
      this.subscriptions.delete(name)
    }
  }

  removeAllSubscriptions(): void {
    this.subscriptions.forEach((subscription, name) => {
      subscription.unsubscribe()
    })
    this.subscriptions.clear()
  }

  getSubscriptionCount(): number {
    return this.subscriptions.size
  }
}

export const subscriptionManager = new SubscriptionManager()

// Initialize connection monitoring
if (typeof window !== 'undefined') {
  connectionMonitor.startMonitoring()
}

// Note: Auth operations should not use this client
// Use JWT-based authentication via API routes instead