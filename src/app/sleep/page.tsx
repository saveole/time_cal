'use client'

import { useState } from 'react'
import { SleepForm } from '@/components/forms/sleep-form'
import { SleepHistory } from '@/components/sleep/sleep-history'
import { useAuth } from '@/contexts/auth-context'
import { sleepService } from '@/lib/database/sleep'
import type { SleepRecordInsert } from '@/types/database'
import { toast } from 'react-hot-toast'

export default function SleepPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const { user } = useAuth()

  const handleSleepSubmit = async (sleepData: SleepRecordInsert) => {
    if (!user) {
      toast.error('请先登录')
      return
    }

    try {
      const recordWithUser = {
        ...sleepData,
        user_id: user.id
      }

      await sleepService.upsertSleepRecord(recordWithUser)
      toast.success('睡眠记录已保存')

      // Refresh the sleep history
      setRefreshKey(prev => prev + 1)
    } catch (error) {
      console.error('Error saving sleep record:', error)
      toast.error('保存失败，请重试')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">睡眠记录</h1>
        <p className="text-muted-foreground">
          记录您的睡眠时间，追踪睡眠模式和改善睡眠质量
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sleep Form */}
        <div>
          <SleepForm onSubmit={handleSleepSubmit} />
        </div>

        {/* Sleep History */}
        <div>
          <SleepHistory key={refreshKey} />
        </div>
      </div>

      {/* Additional Sleep Analytics */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">睡眠分析</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">本周平均</h3>
            <p className="text-2xl font-bold text-primary">7h 30m</p>
            <p className="text-sm text-muted-foreground">睡眠时长</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">睡眠规律</h3>
            <p className="text-2xl font-bold text-green-600">良好</p>
            <p className="text-sm text-muted-foreground">时间一致性</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">睡眠质量</h3>
            <p className="text-2xl font-bold text-yellow-600">中等</p>
            <p className="text-sm text-muted-foreground">整体评价</p>
          </div>
        </div>
      </div>
    </div>
  )
}