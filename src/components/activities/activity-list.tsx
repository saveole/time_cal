'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { activitiesService } from '@/lib/database/activities'
import { useAuth } from '@/contexts/auth-context'
import type { Activity } from '@/types/database'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Play, Pause, Square } from 'lucide-react'

export function ActivityList() {
  const [activities, setActivities] = useState<(Activity & { activity_categories?: any })[]>([])
  const [activeActivity, setActiveActivity] = useState<(Activity & { activity_categories?: any }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadActivities()
      loadActiveActivity()
    }
  }, [user])

  const loadActivities = async () => {
    if (!user) return

    try {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]
      const activitiesData = await activitiesService.getActivities(
        user.id,
        `${today}T00:00:00Z`,
        `${today}T23:59:59Z`
      )
      setActivities(activitiesData)
    } catch (err) {
      setError('Failed to load activities')
      console.error('Error loading activities:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadActiveActivity = async () => {
    if (!user) return

    try {
      const active = await activitiesService.getActiveActivity(user.id)
      setActiveActivity(active)
    } catch (err) {
      console.error('Error loading active activity:', err)
    }
  }

  const handleStopActivity = async (activityId: string) => {
    try {
      await activitiesService.stopActivity(activityId)
      setActiveActivity(null)
      loadActivities()
    } catch (err) {
      console.error('Error stopping activity:', err)
    }
  }

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('确定要删除这个活动吗？')) return

    try {
      await activitiesService.deleteActivity(activityId)
      setActivities(activities => activities.filter(activity => activity.id !== activityId))
    } catch (err) {
      console.error('Error deleting activity:', err)
    }
  }

  const formatDuration = (minutes: number): string => {
    if (!minutes) return '进行中'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins > 0 ? mins + 'm' : ''}`
  }

  const getCategoryName = (activity: any): string => {
    if (activity.activity_categories?.name) {
      return activity.activity_categories.name
    }
    // Fallback to default categories
    const categoryMap: Record<string, string> = {
      'work': '工作',
      'personal': '个人',
      'leisure': '休闲',
      'exercise': '运动',
      'learning': '学习',
      'other': '其他'
    }
    return categoryMap[activity.category_id] || '未分类'
  }

  const getCategoryColor = (activity: any): string => {
    if (activity.activity_categories?.color) {
      return activity.activity_categories.color
    }
    // Fallback colors
    const colorMap: Record<string, string> = {
      'work': '#3b82f6',
      'personal': '#10b981',
      'leisure': '#f59e0b',
      'exercise': '#ef4444',
      'learning': '#8b5cf6',
      'other': '#6b7280'
    }
    return colorMap[activity.category_id] || '#6b7280'
  }

  const formatTime = (timeString: string): string => {
    return format(new Date(timeString), 'HH:mm', { locale: zhCN })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>今日活动</CardTitle>
          <CardDescription>查看今天的活动记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">加载中...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>今日活动</CardTitle>
          <CardDescription>查看今天的活动记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive">{error}</p>
            <Button onClick={loadActivities} className="mt-4">
              重试
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>今日活动</CardTitle>
        <CardDescription>查看今天的活动记录</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Active Activity */}
        {activeActivity && (
          <div className="mb-6 p-4 border-2 border-primary rounded-lg bg-primary/5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="animate-pulse">
                  <Square className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium text-primary">进行中</span>
              </div>
              <Button
                size="sm"
                onClick={() => handleStopActivity(activeActivity.id)}
                className="bg-primary hover:bg-primary/90"
              >
                停止
              </Button>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{activeActivity.name}</h3>
                <Badge
                  variant="secondary"
                  style={{ backgroundColor: getCategoryColor(activeActivity), color: 'white' }}
                >
                  {getCategoryName(activeActivity)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                开始时间: {formatTime(activeActivity.start_time)}
              </p>
              {activeActivity.description && (
                <p className="text-sm text-muted-foreground">{activeActivity.description}</p>
              )}
            </div>
          </div>
        )}

        {/* Activities List */}
        {activities.length === 0 && !activeActivity ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">今天还没有活动记录</p>
            <p className="text-sm text-muted-foreground mt-2">
              开始记录您的第一个活动吧！
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {[...activities].reverse().map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{activity.name}</h3>
                    <Badge
                      variant="secondary"
                      style={{ backgroundColor: getCategoryColor(activity), color: 'white' }}
                    >
                      {getCategoryName(activity)}
                    </Badge>
                    {activity.is_active && (
                      <Badge variant="outline" className="animate-pulse">
                        进行中
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span>{formatTime(activity.start_time)}</span>
                    <span className="mx-2">•</span>
                    <span>
                      {activity.end_time ? formatTime(activity.end_time) : '进行中'}
                    </span>
                    <span className="mx-2">•</span>
                    <span className="font-medium text-primary">
                      {formatDuration(activity.duration_minutes || 0)}
                    </span>
                  </div>
                  {activity.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {activity.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {activity.is_active ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStopActivity(activity.id)}
                      className="text-primary hover:text-primary"
                    >
                      停止
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // TODO: Implement edit functionality
                        console.log('Edit activity:', activity.id)
                      }}
                    >
                      编辑
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteActivity(activity.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    删除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {activities.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">总活动数</p>
                <p className="text-lg font-bold">{activities.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">总时长</p>
                <p className="text-lg font-bold">
                  {formatDuration(
                    activities.reduce((sum, activity) => sum + (activity.duration_minutes || 0), 0)
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">平均时长</p>
                <p className="text-lg font-bold">
                  {formatDuration(
                    Math.round(
                      activities.reduce((sum, activity) => sum + (activity.duration_minutes || 0), 0) /
                      activities.length
                    )
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">已完成</p>
                <p className="text-lg font-bold">
                  {activities.filter(a => !a.is_active).length}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}