// Backend validation script for the complete Supabase integration
// This file contains validation functions to test all implemented services

import { profileService } from '@/lib/database/profiles'
import { goalsService } from '@/lib/database/goals'
import { userPreferencesService } from '@/lib/database/preferences'
import { realtimeSubscriptionManager } from '@/lib/realtime/subscriptions'

// Validation utilities
export class BackendValidator {
  // Test profile service
  static async validateProfileService(userId: string): Promise<{
    success: boolean
    tests: string[]
    errors: string[]
  }> {
    const tests: string[] = []
    const errors: string[] = []

    try {
      // Test 1: Get profile
      tests.push('Testing profile retrieval...')
      const profile = await profileService.getProfile(userId)
      if (profile) {
        tests.push('✅ Profile retrieved successfully')
      } else {
        errors.push('❌ Failed to retrieve profile')
      }

      // Test 2: Get profile with GitHub data
      tests.push('Testing profile with GitHub data...')
      const profileWithGitHub = await profileService.getProfileWithGitHub(userId)
      if (profileWithGitHub) {
        tests.push('✅ Profile with GitHub data retrieved successfully')
      } else {
        errors.push('❌ Failed to retrieve profile with GitHub data')
      }

      // Test 3: Get user stats
      tests.push('Testing user statistics...')
      const stats = await profileService.getUserStats(userId)
      if (stats && typeof stats.totalActivities === 'number') {
        tests.push('✅ User statistics retrieved successfully')
      } else {
        errors.push('❌ Failed to retrieve user statistics')
      }

      // Test 4: Update profile
      tests.push('Testing profile update...')
      if (profile) {
        const updatedProfile = await profileService.updatePreferences(userId, {
          timezone: profile.timezone || 'UTC'
        })
        if (updatedProfile) {
          tests.push('✅ Profile updated successfully')
        } else {
          errors.push('❌ Failed to update profile')
        }
      }

    } catch (error) {
      errors.push(`❌ Profile service error: ${error}`)
    }

    return {
      success: errors.length === 0,
      tests,
      errors
    }
  }

  // Test goals service
  static async validateGoalsService(userId: string): Promise<{
    success: boolean
    tests: string[]
    errors: string[]
  }> {
    const tests: string[] = []
    const errors: string[] = []

    try {
      // Test 1: Get goals
      tests.push('Testing goals retrieval...')
      const goals = await goalsService.getGoals(userId)
      if (Array.isArray(goals)) {
        tests.push(`✅ Retrieved ${goals.length} goals successfully`)
      } else {
        errors.push('❌ Failed to retrieve goals')
      }

      // Test 2: Create goal
      tests.push('Testing goal creation...')
      const testGoal = {
        user_id: userId,
        type: 'daily' as const,
        target_hours: 8,
        start_date: new Date().toISOString().split('T')[0],
        is_active: true
      }
      const createdGoal = await goalsService.createGoal(testGoal)
      if (createdGoal && createdGoal.id) {
        tests.push('✅ Goal created successfully')

        // Test 3: Update goal
        tests.push('Testing goal update...')
        const updatedGoal = await goalsService.updateGoal(createdGoal.id, userId, {
          target_hours: 9
        })
        if (updatedGoal && updatedGoal.target_hours === 9) {
          tests.push('✅ Goal updated successfully')
        } else {
          errors.push('❌ Failed to update goal')
        }

        // Test 4: Get goal progress
        tests.push('Testing goal progress calculation...')
        const progress = await goalsService.getGoalProgress(createdGoal.id, userId)
        if (progress) {
          tests.push('✅ Goal progress calculated successfully')
        } else {
          errors.push('❌ Failed to calculate goal progress')
        }

        // Test 5: Delete goal
        tests.push('Testing goal deletion...')
        await goalsService.deleteGoal(createdGoal.id, userId)
        tests.push('✅ Goal deleted successfully')

      } else {
        errors.push('❌ Failed to create goal')
      }

      // Test 6: Get goals with progress
      tests.push('Testing goals with progress...')
      const goalsWithProgress = await goalsService.getGoalsWithProgress(userId)
      if (Array.isArray(goalsWithProgress)) {
        tests.push('✅ Goals with progress retrieved successfully')
      } else {
        errors.push('❌ Failed to retrieve goals with progress')
      }

    } catch (error) {
      errors.push(`❌ Goals service error: ${error}`)
    }

    return {
      success: errors.length === 0,
      tests,
      errors
    }
  }

  // Test user preferences service
  static async validateUserPreferencesService(userId: string): Promise<{
    success: boolean
    tests: string[]
    errors: string[]
  }> {
    const tests: string[] = []
    const errors: string[] = []

    try {
      // Test 1: Get preferences with defaults
      tests.push('Testing preferences retrieval...')
      const preferences = await userPreferencesService.getPreferencesWithDefaults(userId)
      if (preferences && preferences.theme) {
        tests.push('✅ Preferences retrieved successfully')
      } else {
        errors.push('❌ Failed to retrieve preferences')
      }

      // Test 2: Update theme
      tests.push('Testing theme update...')
      const updatedPrefs = await userPreferencesService.updateTheme(userId, 'dark')
      if (updatedPrefs && updatedPrefs.theme === 'dark') {
        tests.push('✅ Theme updated successfully')
      } else {
        errors.push('❌ Failed to update theme')
      }

      // Test 3: Update language
      tests.push('Testing language update...')
      const langPrefs = await userPreferencesService.updateLanguage(userId, 'en')
      if (langPrefs && langPrefs.language === 'en') {
        tests.push('✅ Language updated successfully')
      } else {
        errors.push('❌ Failed to update language')
      }

      // Test 4: Update time format
      tests.push('Testing time format update...')
      const timePrefs = await userPreferencesService.updateTimeFormat(userId, '24h')
      if (timePrefs && timePrefs.time_format === '24h') {
        tests.push('✅ Time format updated successfully')
      } else {
        errors.push('❌ Failed to update time format')
      }

      // Test 5: Update date format
      tests.push('Testing date format update...')
      const datePrefs = await userPreferencesService.updateDateFormat(userId, 'YYYY-MM-DD')
      if (datePrefs && datePrefs.date_format === 'YYYY-MM-DD') {
        tests.push('✅ Date format updated successfully')
      } else {
        errors.push('❌ Failed to update date format')
      }

      // Test 6: Update default reminders
      tests.push('Testing default reminders update...')
      const reminderPrefs = await userPreferencesService.updateDefaultReminders(userId, {
        activities: true,
        sleep: true,
        goals: false
      })
      if (reminderPrefs && reminderPrefs.default_reminders) {
        tests.push('✅ Default reminders updated successfully')
      } else {
        errors.push('❌ Failed to update default reminders')
      }

      // Test 7: Export preferences
      tests.push('Testing preferences export...')
      const exportedPrefs = await userPreferencesService.exportPreferences(userId)
      if (exportedPrefs && exportedPrefs.theme) {
        tests.push('✅ Preferences exported successfully')
      } else {
        errors.push('❌ Failed to export preferences')
      }

    } catch (error) {
      errors.push(`❌ User preferences service error: ${error}`)
    }

    return {
      success: errors.length === 0,
      tests,
      errors
    }
  }

  // Test real-time functionality
  static validateRealtimeFunctionality(): {
    success: boolean
    tests: string[]
    errors: string[]
  } {
    const tests: string[] = []
    const errors: string[] = []

    try {
      // Test 1: Subscription manager initialization
      tests.push('Testing subscription manager...')
      if (realtimeSubscriptionManager) {
        tests.push('✅ Subscription manager initialized successfully')
      } else {
        errors.push('❌ Subscription manager not initialized')
      }

      // Test 2: Connection status
      tests.push('Testing connection status...')
      const status = realtimeSubscriptionManager.getConnectionStatus()
      if (typeof status === 'string') {
        tests.push(`✅ Connection status: ${status}`)
      } else {
        errors.push('❌ Failed to get connection status')
      }

      // Test 3: Subscription count
      tests.push('Testing subscription count...')
      const count = realtimeSubscriptionManager.getSubscriptionCount()
      if (typeof count === 'number') {
        tests.push(`✅ Active subscriptions: ${count}`)
      } else {
        errors.push('❌ Failed to get subscription count')
      }

    } catch (error) {
      errors.push(`❌ Real-time functionality error: ${error}`)
    }

    return {
      success: errors.length === 0,
      tests,
      errors
    }
  }

  // Run all validation tests
  static async runFullValidation(userId: string): Promise<{
    overall: boolean
    results: {
      profile: any
      goals: any
      preferences: any
      realtime: any
    }
  }> {
    console.log('🔍 Starting backend validation tests...\n')

    const results = {
      profile: await this.validateProfileService(userId),
      goals: await this.validateGoalsService(userId),
      preferences: await this.validateUserPreferencesService(userId),
      realtime: this.validateRealtimeFunctionality()
    }

    const overall = Object.values(results).every(result => result.success)

    // Print results
    console.log('📊 VALIDATION RESULTS:')
    console.log('=====================')

    Object.entries(results).forEach(([service, result]) => {
      console.log(`\n${service.toUpperCase()} SERVICE:`)
      if (result.success) {
        console.log('✅ PASSED')
      } else {
        console.log('❌ FAILED')
      }
      result.tests.forEach(test => console.log(`  ${test}`))
      result.errors.forEach(error => console.log(`  ${error}`))
    })

    console.log(`\n🎯 OVERALL RESULT: ${overall ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`)

    return { overall, results }
  }
}

// Usage example:
export async function validateBackend(userId: string) {
  return await BackendValidator.runFullValidation(userId)
}