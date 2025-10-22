'use client'

import { useState } from 'react'
import { ActivityForm } from '@/components/forms/activity-form'
import { ActivityList } from '@/components/activities/activity-list'
import { useAuth } from '@/contexts/auth-context'
import { activitiesService } from '@/lib/database/activities'
import type { ActivityInsert } from '@/types/database'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function ActivitiesPage() {
  const [showForm, setShowForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const { user } = useAuth()

  const handleActivitySubmit = async (activityData: ActivityInsert) => {
    if (!user) {
      toast.error('请先登录')
      return
    }

    try {
      await activitiesService.createActivity(activityData)
      toast.success('活动已保存')

      // Refresh the activity list
      setRefreshKey(prev => prev + 1)

      // Hide form if it was shown for a new activity
      if (showForm) {
        setShowForm(false)
      }
    } catch (error) {
      console.error('Error saving activity:', error)
      toast.error('保存失败，请重试')
    }
  }

  const handleStartActivity = () => {
    // Create a new activity with current time as start time
    const now = new Date()
    const activityData: ActivityInsert = {
      user_id: user?.id || '',
      name: '',
      category_id: 'work',
      description: null,
      start_time: now.toISOString(),
      end_time: null,
      is_active: true
    }

    // Show form with pre-filled start time
    setShowForm(true)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">活动记录</h1>
        <p className="text-muted-foreground">
          记录您的日常活动，追踪时间分配和生产力
        </p>
      </div>

      <div className="mb-6">
        <Button onClick={handleStartActivity} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          快速开始活动
        </Button>
      </div>

      {showForm && (
        <div className="mb-8">
          <ActivityForm
            onSubmit={handleActivitySubmit}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activity Form - Always visible when not in quick start mode */}
        {!showForm && (
          <div>
            <ActivityForm onSubmit={handleActivitySubmit} />
          </div>
        )}

        {/* Activity List */}
        <div>
          <ActivityList key={refreshKey} />
        </div>
      </div>

      {/* Activity Analytics */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">活动分析</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">今日活动</h3>
            <p className="text-2xl font-bold text-primary">8</p>
            <p className="text-sm text-muted-foreground">个活动</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">总时长</h3>
            <p className="text-2xl font-bold text-blue-600">6h 30m</p>
            <p className="text-sm text-muted-foreground">工作时间</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">效率评分</h3>
            <p className="text-2xl font-bold text-green-600">良好</p>
            <p className="text-sm text-muted-foreground">今日表现</p>
          </div>
        </div>
      </div>
    </div>
  )
}