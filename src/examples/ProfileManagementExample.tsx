// Example: Profile management using the new backend services
// This file demonstrates how to use the profile management API

'use client'

import { useState, useEffect } from 'react'

interface Profile {
  id: string
  email?: string
  full_name?: string
  avatar_url?: string
  timezone: string
  github_username?: string
  github_id?: number
  auth_provider?: 'email' | 'github'
}

interface UserStats {
  totalActivities: number
  totalSleepRecords: number
  activeGoals: number
  accountAge: string
}

export function ProfileManagementExample() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: '',
    timezone: 'UTC'
  })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/profile?includeStats=true&sanitize=true')

      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
        setStats(data.stats)
        setEditForm({
          full_name: data.profile?.full_name || '',
          timezone: data.profile?.timezone || 'UTC'
        })
      } else {
        setMessage('Failed to load profile')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setMessage('Error loading profile')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async () => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
        setIsEditing(false)
        setMessage('Profile updated successfully!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        const errorData = await response.json()
        setMessage(errorData.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage('Error updating profile')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
  }

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="text-center">Loading profile...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="text-center text-red-600">Profile not found</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Profile Management</h1>

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

        {/* Profile Header */}
        <div className="flex items-center space-x-4 mb-6">
          {profile.avatar_url && (
            <img
              src={profile.avatar_url}
              alt="Profile"
              className="w-16 h-16 rounded-full"
            />
          )}
          <div>
            <h2 className="text-xl font-semibold">{profile.full_name || 'Anonymous User'}</h2>
            {profile.email && (
              <p className="text-gray-600">{profile.email}</p>
            )}
            {profile.github_username && (
              <p className="text-sm text-gray-500">
                GitHub: @{profile.github_username}
              </p>
            )}
            <div className="flex items-center mt-1">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                profile.auth_provider === 'github'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {profile.auth_provider === 'github' ? 'GitHub OAuth' : 'Email'}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="space-y-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={editForm.full_name}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <select
              id="timezone"
              name="timezone"
              value={editForm.timezone}
              onChange={handleInputChange}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (CET)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
              <option value="Asia/Shanghai">Shanghai (CST)</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  onClick={updateProfile}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditForm({
                      full_name: profile.full_name || '',
                      timezone: profile.timezone
                    })
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* User Statistics */}
        {stats && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Account Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalActivities}</div>
                <div className="text-sm text-gray-600">Total Activities</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.totalSleepRecords}</div>
                <div className="text-sm text-gray-600">Sleep Records</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.activeGoals}</div>
                <div className="text-sm text-gray-600">Active Goals</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-lg font-bold text-orange-600">{stats.accountAge}</div>
                <div className="text-sm text-gray-600">Account Age</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}