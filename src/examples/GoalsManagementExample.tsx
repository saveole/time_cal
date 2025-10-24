// Example: Goals management using the new backend services
// This file demonstrates how to use the goals API

'use client'

import { useState, useEffect } from 'react'

interface Goal {
  id: string
  type: 'daily' | 'weekly' | 'monthly'
  target_hours: number
  category_id?: string
  start_date: string
  end_date?: string
  is_active: boolean
  created_at: string
  activity_categories?: {
    id: string
    name: string
    color: string
    icon?: string
  }
}

interface GoalProgress {
  goalId: string
  targetHours: number
  completedHours: number
  percentage: number
  isCompleted: boolean
  daysRemaining: number
}

export function GoalsManagementExample() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newGoal, setNewGoal] = useState({
    type: 'daily' as 'daily' | 'weekly' | 'monthly',
    target_hours: 8,
    category_id: '',
    start_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchGoals()
    fetchAnalytics()
  }, [])

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals?withProgress=true')
      if (response.ok) {
        const data = await response.json()
        setGoals(data.goals || [])
      }
    } catch (error) {
      console.error('Error fetching goals:', error)
      setMessage('Error loading goals')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/goals/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const createGoal = async () => {
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGoal)
      })

      if (response.ok) {
        const data = await response.json()
        setGoals(prev => [...prev, data.goal])
        setShowCreateForm(false)
        setNewGoal({
          type: 'daily',
          target_hours: 8,
          category_id: '',
          start_date: new Date().toISOString().split('T')[0]
        })
        setMessage('Goal created successfully!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        const errorData = await response.json()
        setMessage(errorData.error || 'Failed to create goal')
      }
    } catch (error) {
      console.error('Error creating goal:', error)
      setMessage('Error creating goal')
    }
  }

  const deleteGoal = async (goalId: string) => {
    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setGoals(prev => prev.filter(g => g.id !== goalId))
        setMessage('Goal deleted successfully!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Failed to delete goal')
      }
    } catch (error) {
      console.error('Error deleting goal:', error)
      setMessage('Error deleting goal')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewGoal(prev => ({
      ...prev,
      [name]: name === 'target_hours' ? parseFloat(value) || 0 : value
    }))
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center">Loading goals...</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Goals Management</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create New Goal
        </button>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.includes('successfully')
            ? 'bg-green-100 text-green-700 border border-green-300'
            : 'bg-red-100 text-red-700 border border-red-300'
        }`}>
          {message}
        </div>
      )}

      {/* Create Goal Form */}
      {showCreateForm && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Goal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Goal Type
              </label>
              <select
                id="type"
                name="type"
                value={newGoal.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label htmlFor="target_hours" className="block text-sm font-medium text-gray-700 mb-1">
                Target Hours
              </label>
              <input
                type="number"
                id="target_hours"
                name="target_hours"
                value={newGoal.target_hours}
                onChange={handleInputChange}
                min="0.5"
                max="24"
                step="0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="start_date"
                name="start_date"
                value={newGoal.start_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={createGoal}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Create Goal
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Goals List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Active Goals</h2>
          <div className="space-y-4">
            {goals.filter(g => g.is_active).length === 0 ? (
              <p className="text-gray-500">No active goals</p>
            ) : (
              goals.filter(g => g.is_active).map(goal => (
                <div key={goal.id} className="bg-white shadow rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">
                        {goal.type.charAt(0).toUpperCase() + goal.type.slice(1)} Goal
                      </h3>
                      <p className="text-sm text-gray-600">
                        Target: {goal.target_hours} hours
                      </p>
                      {goal.activity_categories && (
                        <div className="flex items-center mt-1">
                          <span
                            className="inline-block w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: goal.activity_categories.color }}
                          />
                          <span className="text-sm text-gray-600">
                            {goal.activity_categories.name}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Progress would be calculated here */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: '0%' }} // This would be actual progress
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Started: {new Date(goal.start_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Analytics</h2>
          {analytics ? (
            <div className="bg-white shadow rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{analytics.totalGoalsCreated}</div>
                  <div className="text-sm text-gray-600">Total Goals</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{analytics.completedGoals}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {analytics.averageCompletionRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Completion</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{analytics.goalStreak}</div>
                  <div className="text-sm text-gray-600">Current Streak</div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Loading analytics...</p>
          )}
        </div>
      </div>
    </div>
  )
}