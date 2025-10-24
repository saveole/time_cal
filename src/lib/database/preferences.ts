import { supabase } from '@/lib/supabase'
import type {
  UserPreferences,
  UserPreferencesInsert,
  UserPreferencesUpdate,
  ValidTheme,
  ValidTimeFormat,
  ValidLanguage,
  ValidatedUserPreferences
} from '@/types/database'

export class UserPreferencesService {
  // Get user preferences
  async getPreferences(userId: string): Promise<UserPreferences | null> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Preferences not found
      }
      console.error('Error fetching user preferences:', error)
      throw error
    }

    return data
  }

  // Get user preferences with defaults
  async getPreferencesWithDefaults(userId: string): Promise<UserPreferences> {
    const preferences = await this.getPreferences(userId)

    if (preferences) {
      return preferences
    }

    // Create default preferences if none exist
    return await this.createDefaultPreferences(userId)
  }

  // Create default preferences for a user
  async createDefaultPreferences(userId: string): Promise<UserPreferences> {
    const defaultPreferences: UserPreferencesInsert = {
      user_id: userId,
      theme: 'system',
      language: 'en',
      time_format: '24h',
      date_format: 'YYYY-MM-DD',
      default_reminders: {
        activities: true,
        sleep: true,
        goals: true
      }
    }

    return await this.createPreferences(defaultPreferences)
  }

  // Create new preferences
  async createPreferences(preferences: UserPreferencesInsert): Promise<UserPreferences> {
    const { data, error } = await supabase
      .from('user_preferences')
      .insert(preferences)
      .select()
      .single()

    if (error) {
      console.error('Error creating user preferences:', error)
      throw error
    }

    return data
  }

  // Update user preferences
  async updatePreferences(userId: string, updates: UserPreferencesUpdate): Promise<UserPreferences> {
    // Validate preferences before updating
    const validatedUpdates = this.validatePreferences(updates)

    const { data, error } = await supabase
      .from('user_preferences')
      .update(validatedUpdates)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user preferences:', error)
      throw error
    }

    return data
  }

  // Update theme preference
  async updateTheme(userId: string, theme: ValidTheme): Promise<UserPreferences> {
    return await this.updatePreferences(userId, { theme })
  }

  // Update language preference
  async updateLanguage(userId: string, language: ValidLanguage): Promise<UserPreferences> {
    return await this.updatePreferences(userId, { language })
  }

  // Update time format preference
  async updateTimeFormat(userId: string, timeFormat: ValidTimeFormat): Promise<UserPreferences> {
    return await this.updatePreferences(userId, { time_format: timeFormat })
  }

  // Update date format preference
  async updateDateFormat(userId: string, dateFormat: string): Promise<UserPreferences> {
    const validDateFormats = [
      'YYYY-MM-DD',
      'MM/DD/YYYY',
      'DD/MM/YYYY',
      'DD.MM.YYYY',
      'MMMM D, YYYY',
      'D MMMM YYYY'
    ]

    if (!validDateFormats.includes(dateFormat)) {
      throw new Error(`Invalid date format: ${dateFormat}`)
    }

    return await this.updatePreferences(userId, { date_format: dateFormat })
  }

  // Update default reminders
  async updateDefaultReminders(userId: string, reminders: Record<string, any>): Promise<UserPreferences> {
    // Validate reminder structure
    const validatedReminders = this.validateReminders(reminders)

    return await this.updatePreferences(userId, { default_reminders: validatedReminders })
  }

  // Delete user preferences
  async deletePreferences(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting user preferences:', error)
      throw error
    }
  }

  // Validate all preferences
  private validatePreferences(preferences: UserPreferencesUpdate): ValidatedUserPreferences {
    const validated: ValidatedUserPreferences = {
      theme: 'system',
      language: 'en',
      time_format: '24h',
      date_format: 'YYYY-MM-DD',
      default_reminders: {}
    }

    if (preferences.theme && this.isValidTheme(preferences.theme)) {
      validated.theme = preferences.theme
    }

    if (preferences.language && this.isValidLanguage(preferences.language)) {
      validated.language = preferences.language
    }

    if (preferences.time_format && this.isValidTimeFormat(preferences.time_format)) {
      validated.time_format = preferences.time_format
    }

    if (preferences.date_format) {
      validated.date_format = preferences.date_format
    }

    if (preferences.default_reminders) {
      validated.default_reminders = this.validateReminders(preferences.default_reminders)
    }

    return validated
  }

  // Validate theme
  private isValidTheme(theme: string): theme is ValidTheme {
    return ['light', 'dark', 'system'].includes(theme)
  }

  // Validate language
  private isValidLanguage(language: string): language is ValidLanguage {
    return ['en', 'zh', 'es', 'fr', 'de', 'ja'].includes(language)
  }

  // Validate time format
  private isValidTimeFormat(format: string): format is ValidTimeFormat {
    return ['12h', '24h'].includes(format)
  }

  // Validate reminders object
  private validateReminders(reminders: Record<string, any>): Record<string, any> {
    const validated: Record<string, any> = {}

    // Validate activity reminders
    if (typeof reminders.activities === 'boolean') {
      validated.activities = reminders.activities
    } else {
      validated.activities = true
    }

    // Validate sleep reminders
    if (typeof reminders.sleep === 'boolean') {
      validated.sleep = reminders.sleep
    } else {
      validated.sleep = true
    }

    // Validate goal reminders
    if (typeof reminders.goals === 'boolean') {
      validated.goals = reminders.goals
    } else {
      validated.goals = true
    }

    // Validate reminder timing if provided
    if (reminders.timing && typeof reminders.timing === 'object') {
      validated.timing = {
        before_minutes: reminders.timing.before_minutes || 15,
        after_minutes: reminders.timing.after_minutes || 0
      }
    }

    return validated
  }

  // Get formatted time according to user preferences
  async getFormattedTime(userId: string, time: string | Date): Promise<string> {
    const preferences = await this.getPreferencesWithDefaults(userId)
    const timeObj = typeof time === 'string' ? new Date(time) : time

    if (preferences.time_format === '12h') {
      return timeObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } else {
      return timeObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }
  }

  // Get formatted date according to user preferences
  async getFormattedDate(userId: string, date: string | Date): Promise<string> {
    const preferences = await this.getPreferencesWithDefaults(userId)
    const dateObj = typeof date === 'string' ? new Date(date) : date

    switch (preferences.date_format) {
      case 'MM/DD/YYYY':
        return dateObj.toLocaleDateString('en-US')
      case 'DD/MM/YYYY':
        return dateObj.toLocaleDateString('en-GB')
      case 'DD.MM.YYYY':
        return dateObj.toLocaleDateString('de-DE')
      case 'MMMM D, YYYY':
        return dateObj.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })
      case 'D MMMM YYYY':
        return dateObj.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      case 'YYYY-MM-DD':
      default:
        return dateObj.toISOString().split('T')[0]
    }
  }

  // Get localized date according to user preferences
  async getLocalizedDate(userId: string, date: string | Date, options?: Intl.DateTimeFormatOptions): Promise<string> {
    const preferences = await this.getPreferencesWithDefaults(userId)
    const dateObj = typeof date === 'string' ? new Date(date) : date

    const defaultOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }

    return dateObj.toLocaleDateString(preferences.language, { ...defaultOptions, ...options })
  }

  // Export user preferences
  async exportPreferences(userId: string): Promise<Record<string, any>> {
    const preferences = await this.getPreferencesWithDefaults(userId)

    return {
      theme: preferences.theme,
      language: preferences.language,
      time_format: preferences.time_format,
      date_format: preferences.date_format,
      default_reminders: preferences.default_reminders,
      exported_at: new Date().toISOString()
    }
  }

  // Import user preferences
  async importPreferences(userId: string, preferencesData: Record<string, any>): Promise<UserPreferences> {
    try {
      const filteredData: UserPreferencesUpdate = {}

      if (preferencesData.theme && this.isValidTheme(preferencesData.theme)) {
        filteredData.theme = preferencesData.theme
      }

      if (preferencesData.language && this.isValidLanguage(preferencesData.language)) {
        filteredData.language = preferencesData.language
      }

      if (preferencesData.time_format && this.isValidTimeFormat(preferencesData.time_format)) {
        filteredData.time_format = preferencesData.time_format
      }

      if (preferencesData.date_format) {
        filteredData.date_format = preferencesData.date_format
      }

      if (preferencesData.default_reminders) {
        filteredData.default_reminders = this.validateReminders(preferencesData.default_reminders)
      }

      return await this.updatePreferences(userId, filteredData)
    } catch (error) {
      console.error('Error importing preferences:', error)
      throw new Error('Invalid preferences data provided')
    }
  }

  // Reset preferences to defaults
  async resetToDefaults(userId: string): Promise<UserPreferences> {
    await this.deletePreferences(userId)
    return await this.createDefaultPreferences(userId)
  }

  // Get preference summary for display
  async getPreferenceSummary(userId: string): Promise<{
    theme: string
    language: string
    timeFormat: string
    dateFormat: string
    reminderCount: number
  }> {
    const preferences = await this.getPreferencesWithDefaults(userId)

    const reminderCount = Object.keys(preferences.default_reminders || {}).filter(
      key => preferences.default_reminders[key] === true
    ).length

    return {
      theme: preferences.theme,
      language: preferences.language,
      timeFormat: preferences.time_format,
      dateFormat: preferences.date_format,
      reminderCount
    }
  }
}

export const userPreferencesService = new UserPreferencesService()