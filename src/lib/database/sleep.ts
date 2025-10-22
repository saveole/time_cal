import { supabase } from '@/lib/supabase'
import type {
  SleepRecord,
  SleepRecordInsert,
  SleepRecordUpdate
} from '@/types/database'

export class SleepService {
  // Get all sleep records for a user
  async getSleepRecords(userId: string, limit = 30) {
    const { data, error } = await supabase
      .from('sleep_records')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching sleep records:', error)
      throw error
    }

    return data || []
  }

  // Get sleep record by date
  async getSleepRecordByDate(userId: string, date: string) {
    const { data, error } = await supabase
      .from('sleep_records')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching sleep record:', error)
      throw error
    }

    return data
  }

  // Create or update sleep record
  async upsertSleepRecord(record: SleepRecordInsert) {
    const { data, error } = await supabase
      .from('sleep_records')
      .upsert(record, {
        onConflict: 'user_id,date'
      })
      .select()
      .single()

    if (error) {
      console.error('Error upserting sleep record:', error)
      throw error
    }

    return data
  }

  // Update sleep record
  async updateSleepRecord(id: string, updates: SleepRecordUpdate) {
    const { data, error } = await supabase
      .from('sleep_records')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating sleep record:', error)
      throw error
    }

    return data
  }

  // Delete sleep record
  async deleteSleepRecord(id: string) {
    const { error } = await supabase
      .from('sleep_records')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting sleep record:', error)
      throw error
    }
  }

  // Get sleep statistics for a date range
  async getSleepStats(userId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('sleep_records')
      .select('duration_minutes, quality_rating, date')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching sleep stats:', error)
      throw error
    }

    const records = data || []

    // Calculate statistics
    const totalRecords = records.length
    const avgDuration = totalRecords > 0
      ? records.reduce((sum, record) => sum + record.duration_minutes, 0) / totalRecords
      : 0
    const avgQuality = totalRecords > 0
      ? records.reduce((sum, record) => sum + (record.quality_rating || 0), 0) / totalRecords
      : 0

    return {
      totalRecords,
      avgDuration: Math.round(avgDuration),
      avgQuality: Math.round(avgQuality * 10) / 10,
      records
    }
  }

  // Get weekly sleep pattern
  async getWeeklySleepPattern(userId: string, weeks = 4) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - (weeks * 7))
    const startDateStr = startDate.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('sleep_records')
      .select('date, duration_minutes, quality_rating')
      .eq('user_id', userId)
      .gte('date', startDateStr)
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching weekly sleep pattern:', error)
      throw error
    }

    return data || []
  }
}

export const sleepService = new SleepService()