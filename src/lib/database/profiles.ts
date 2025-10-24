import { supabase } from '@/lib/supabase'
import type {
  Profile,
  ProfileInsert,
  ProfileUpdate,
  ProfileWithGitHub,
  GitHubProfileData
} from '@/types/database'

export class ProfileService {
  // Get user profile by ID
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Profile not found
      }
      console.error('Error fetching profile:', error)
      throw error
    }

    return data
  }

  // Get profile with GitHub information
  async getProfileWithGitHub(userId: string): Promise<ProfileWithGitHub | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Profile not found
      }
      console.error('Error fetching profile with GitHub data:', error)
      throw error
    }

    return data as ProfileWithGitHub
  }

  // Create or update profile using GitHub OAuth data
  async createOrUpdateGitHubProfile(
    userId: string,
    githubData: GitHubProfileData
  ): Promise<ProfileWithGitHub> {
    try {
      // First try to get existing profile
      const existingProfile = await this.getProfileWithGitHub(userId)

      if (existingProfile) {
        // Update existing profile with GitHub data
        return await this.updateProfile(userId, {
          github_username: githubData.github_username,
          github_id: githubData.github_id,
          auth_provider: 'github',
          email: githubData.email || existingProfile.email,
          full_name: githubData.full_name || existingProfile.full_name,
          avatar_url: githubData.avatar_url || existingProfile.avatar_url,
          timezone: githubData.timezone || existingProfile.timezone
        }) as ProfileWithGitHub
      } else {
        // Create new profile
        const newProfile: ProfileInsert = {
          id: userId,
          github_username: githubData.github_username,
          github_id: githubData.github_id,
          auth_provider: 'github',
          email: githubData.email || null,
          full_name: githubData.full_name || null,
          avatar_url: githubData.avatar_url || null,
          timezone: githubData.timezone || 'UTC'
        }

        return await this.createProfile(newProfile) as ProfileWithGitHub
      }
    } catch (error) {
      console.error('Error creating/updating GitHub profile:', error)
      throw error
    }
  }

  // Create new profile
  async createProfile(profile: ProfileInsert): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single()

    if (error) {
      console.error('Error creating profile:', error)
      throw error
    }

    return data
  }

  // Update existing profile
  async updateProfile(userId: string, updates: ProfileUpdate): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      throw error
    }

    return data
  }

  // Update user preferences (timezone, etc.)
  async updatePreferences(
    userId: string,
    preferences: {
      timezone?: string
      email?: string | null
      full_name?: string | null
      avatar_url?: string | null
    }
  ): Promise<Profile> {
    return await this.updateProfile(userId, preferences)
  }

  // Delete profile
  async deleteProfile(userId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (error) {
      console.error('Error deleting profile:', error)
      throw error
    }
  }

  // Get profile by GitHub ID
  async getProfileByGitHubId(githubId: number): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('github_id', githubId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Profile not found
      }
      console.error('Error fetching profile by GitHub ID:', error)
      throw error
    }

    return data
  }

  // Search profiles by GitHub username
  async searchProfilesByGitHubUsername(username: string): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('github_username', `%${username}%`)
      .limit(10)

    if (error) {
      console.error('Error searching profiles by GitHub username:', error)
      throw error
    }

    return data || []
  }

  // Validate profile data
  private validateProfileData(profile: Partial<Profile>): string[] {
    const errors: string[] = []

    if (profile.email && !this.isValidEmail(profile.email)) {
      errors.push('Invalid email format')
    }

    if (profile.timezone && !this.isValidTimezone(profile.timezone)) {
      errors.push('Invalid timezone format')
    }

    if (profile.github_username && profile.github_username.length > 39) {
      errors.push('GitHub username too long (max 39 characters)')
    }

    return errors
  }

  // Email validation
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Timezone validation
  isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone })
      return true
    } catch {
      return false
    }
  }

  // Sanitize profile data for display
  sanitizeProfileForDisplay(profile: Profile): Omit<Profile, 'github_id'> {
    const { github_id, ...sanitizedProfile } = profile
    return sanitizedProfile
  }

  // Get user statistics (for profile page)
  async getUserStats(userId: string): Promise<{
    totalActivities: number
    totalSleepRecords: number
    activeGoals: number
    accountAge: string
  }> {
    try {
      // Get activity count
      const { count: activityCount } = await supabase
        .from('activities')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Get sleep record count
      const { count: sleepCount } = await supabase
        .from('sleep_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Get active goals count
      const { count: goalsCount } = await supabase
        .from('goals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true)

      // Get profile creation date
      const profile = await this.getProfile(userId)
      const accountAge = profile
        ? this.calculateAccountAge(profile.created_at)
        : 'Unknown'

      return {
        totalActivities: activityCount || 0,
        totalSleepRecords: sleepCount || 0,
        activeGoals: goalsCount || 0,
        accountAge
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
      throw error
    }
  }

  // Calculate account age in human readable format
  private calculateAccountAge(createdAt: string): string {
    const created = new Date(createdAt)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays < 30) {
      return `${diffInDays} days`
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30)
      return `${months} month${months > 1 ? 's' : ''}`
    } else {
      const years = Math.floor(diffInDays / 365)
      const remainingMonths = Math.floor((diffInDays % 365) / 30)
      if (remainingMonths > 0) {
        return `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`
      }
      return `${years} year${years > 1 ? 's' : ''}`
    }
  }
}

export const profileService = new ProfileService()