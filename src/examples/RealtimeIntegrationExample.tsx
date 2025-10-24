// Example: Real-time integration with the new backend services
// This file demonstrates how to use the real-time features in a React component

'use client'

import { useEffect, useState } from 'react'
import { realtimeSubscriptionManager } from '@/lib/realtime/subscriptions'
import { RealtimeUIIntegration } from '@/lib/realtime/ui-integration'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface Activity {
  id: string
  name: string
  description?: string
  start_time: string
  end_time?: string
  duration_minutes?: number
  is_active: boolean
}

export function RealtimeIntegrationExample({ userId }: { userId: string }) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected')

  useEffect(() => {
    // Set up real-time updates for activities
    RealtimeUIIntegration.setupActivityUpdates(userId, {
      onActivityCreated: (activity) => {
        console.log('Activity created:', activity)
        setActivities(prev => [...prev, activity])
      },
      onActivityUpdated: (activity) => {
        console.log('Activity updated:', activity)
        setActivities(prev =>
          prev.map(a => a.id === activity.id ? activity : a)
        )
      },
      onActivityDeleted: (activity) => {
        console.log('Activity deleted:', activity)
        setActivities(prev => prev.filter(a => a.id !== activity.id))
      },
      onActivityStarted: (activity) => {
        console.log('Activity started:', activity)
        setActivities(prev =>
          prev.map(a => a.id === activity.id ? activity : a)
        )
      },
      onActivityStopped: (activity) => {
        console.log('Activity stopped:', activity)
        setActivities(prev =>
          prev.map(a => a.id === activity.id ? activity : a)
        )
      }
    })

    // Monitor connection status
    const updateConnectionStatus = () => {
      setConnectionStatus(realtimeSubscriptionManager.getConnectionStatus())
    }

    const interval = setInterval(updateConnectionStatus, 1000)

    // Initial load of activities
    fetchActivities()

    return () => {
      clearInterval(interval)
      RealtimeUIIntegration.cleanupAllRealtimeUpdates(userId)
    }
  }, [userId])

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/activities')
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }

  const createActivity = async (name: string) => {
    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          start_time: new Date().toISOString(),
          is_active: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Activity created successfully:', data.activity)
      }
    } catch (error) {
      console.error('Error creating activity:', error)
    }
  }

  const stopActivity = async (activityId: string) => {
    try {
      const response = await fetch(`/api/activities/${activityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          end_time: new Date().toISOString(),
          is_active: false
        })
      })

      if (response.ok) {
        console.log('Activity stopped successfully')
      }
    } catch (error) {
      console.error('Error stopping activity:', error)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Real-time Activity Tracking</h1>

        {/* Connection Status Indicator */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-3 h-3 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-500' :
            connectionStatus === 'connecting' ? 'bg-yellow-500' :
            'bg-red-500'
          }`} />
          <span className="text-sm text-gray-600">
            {connectionStatus === 'connected' ? 'Connected' :
             connectionStatus === 'connecting' ? 'Connecting...' :
             'Disconnected'}
          </span>
          <span className="text-xs text-gray-500">
            ({realtimeSubscriptionManager.getSubscriptionCount()} subscriptions)
          </span>
        </div>

        {/* Create Activity Button */}
        <button
          onClick={() => createActivity(`Activity ${Date.now()}`)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-6"
        >
          Create New Activity
        </button>
      </div>

      {/* Activities List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Activities</h2>

        {activities.length === 0 ? (
          <p className="text-gray-500">No activities yet. Create one to see real-time updates!</p>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className={`p-4 border rounded-lg ${
                  activity.is_active
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{activity.name}</h3>
                    {activity.description && (
                      <p className="text-sm text-gray-600">{activity.description}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Started: {new Date(activity.start_time).toLocaleString()}
                    </p>
                    {activity.end_time && (
                      <p className="text-xs text-gray-500">
                        Ended: {new Date(activity.end_time).toLocaleString()}
                      </p>
                    )}
                    {activity.duration_minutes && (
                      <p className="text-xs text-gray-500">
                        Duration: {activity.duration_minutes} minutes
                      </p>
                    )}
                  </div>

                  {activity.is_active && (
                    <button
                      onClick={() => stopActivity(activity.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Stop
                    </button>
                  )}
                </div>

                {activity.is_active && (
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Example usage in a page component:
export default function ExamplePage() {
  // In a real application, you would get the userId from authentication
  const userId = 'user-id-here'

  return (
    <div>
      <RealtimeIntegrationExample userId={userId} />
    </div>
  )
}