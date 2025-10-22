import { sleepService } from '@/lib/database/sleep'
import { activitiesService } from '@/lib/database/activities'
import type { SleepRecordInsert, ActivityInsert } from '@/types/database'
import { useAuth } from '@/contexts/auth-context'

interface LocalStorageData {
  sleepRecords?: any[]
  activities?: any[]
  lastSync?: string
}

export class DataMigrator {
  // Get data from local storage
  static getLocalStorageData(): LocalStorageData {
    if (typeof window === 'undefined') {
      return {}
    }

    const data: LocalStorageData = {}

    try {
      // Get sleep records
      const sleepData = localStorage.getItem('sleepRecords')
      if (sleepData) {
        data.sleepRecords = JSON.parse(sleepData)
      }

      // Get activities
      const activitiesData = localStorage.getItem('activities')
      if (activitiesData) {
        data.activities = JSON.parse(activitiesData)
      }

      // Get last sync time
      const lastSync = localStorage.getItem('lastSync')
      if (lastSync) {
        data.lastSync = lastSync
      }
    } catch (error) {
      console.error('Error reading from local storage:', error)
    }

    return data
  }

  // Check if there's data to migrate
  static hasDataToMigrate(): boolean {
    const data = this.getLocalStorageData()
    return Boolean((data.sleepRecords && data.sleepRecords.length > 0) ||
           (data.activities && data.activities.length > 0))
  }

  // Convert local storage sleep records to Supabase format
  static convertSleepRecord(record: any): SleepRecordInsert {
    return {
      user_id: '', // Will be set by the migration function
      date: record.date || new Date().toISOString().split('T')[0],
      wake_time: record.wakeTime || '06:00',
      sleep_time: record.sleepTime || '22:00',
      quality_rating: record.quality || null,
      notes: record.notes || null
    }
  }

  // Convert local storage activities to Supabase format
  static convertActivity(record: any): ActivityInsert {
    return {
      user_id: '', // Will be set by the migration function
      category_id: this.mapCategory(record.category || 'other'),
      name: record.name || '未命名活动',
      description: record.description || null,
      start_time: record.startTime || new Date().toISOString(),
      end_time: record.endTime || null,
      is_active: !record.endTime
    }
  }

  // Map old category names to new ones
  static mapCategory(oldCategory: string): string {
    const categoryMap: Record<string, string> = {
      'work': 'work',
      'personal': 'personal',
      'leisure': 'leisure',
      'exercise': 'exercise',
      'learning': 'learning',
      'other': 'other'
    }
    return categoryMap[oldCategory.toLowerCase()] || 'other'
  }

  // Migrate sleep records to Supabase
  static async migrateSleepRecords(userId: string, records: any[]): Promise<number> {
    let migrated = 0

    for (const record of records) {
      try {
        const sleepRecord = this.convertSleepRecord(record)
        sleepRecord.user_id = userId

        await sleepService.upsertSleepRecord(sleepRecord)
        migrated++
      } catch (error) {
        console.error('Error migrating sleep record:', error, record)
      }
    }

    return migrated
  }

  // Migrate activities to Supabase
  static async migrateActivities(userId: string, records: any[]): Promise<number> {
    let migrated = 0

    for (const record of records) {
      try {
        const activity = this.convertActivity(record)
        activity.user_id = userId

        await activitiesService.createActivity(activity)
        migrated++
      } catch (error) {
        console.error('Error migrating activity:', error, record)
      }
    }

    return migrated
  }

  // Full migration process
  static async migrateAll(userId: string): Promise<{
    success: boolean
    migratedSleep: number
    migratedActivities: number
    errors: string[]
  }> {
    const result = {
      success: false,
      migratedSleep: 0,
      migratedActivities: 0,
      errors: [] as string[]
    }

    try {
      const data = this.getLocalStorageData()

      // Migrate sleep records
      if (data.sleepRecords && data.sleepRecords.length > 0) {
        try {
          result.migratedSleep = await this.migrateSleepRecords(userId, data.sleepRecords)
        } catch (error) {
          result.errors.push(`睡眠记录迁移失败: ${error}`)
        }
      }

      // Migrate activities
      if (data.activities && data.activities.length > 0) {
        try {
          result.migratedActivities = await this.migrateActivities(userId, data.activities)
        } catch (error) {
          result.errors.push(`活动记录迁移失败: ${error}`)
        }
      }

      // Mark as successful if we migrated anything without critical errors
      result.success = (result.migratedSleep > 0 || result.migratedActivities > 0) &&
                      result.errors.length === 0

    } catch (error) {
      result.errors.push(`迁移过程失败: ${error}`)
      console.error('Migration failed:', error)
    }

    return result
  }

  // Clear local storage after successful migration
  static clearLocalStorage(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem('sleepRecords')
      localStorage.removeItem('activities')
      localStorage.removeItem('lastSync')
    } catch (error) {
      console.error('Error clearing local storage:', error)
    }
  }

  // Get migration summary
  static getMigrationSummary(): {
    hasData: boolean
    sleepCount: number
    activityCount: number
    lastSync?: string
  } {
    const data = this.getLocalStorageData()

    return {
      hasData: this.hasDataToMigrate(),
      sleepCount: data.sleepRecords?.length || 0,
      activityCount: data.activities?.length || 0,
      lastSync: data.lastSync
    }
  }
}