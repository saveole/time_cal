'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { sleepService } from '@/lib/database/sleep'
import { useAuth } from '@/contexts/auth-context'
import type { SleepRecord } from '@/types/database'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function SleepHistory() {
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadSleepRecords()
    }
  }, [user])

  const loadSleepRecords = async () => {
    if (!user) return

    try {
      setLoading(true)
      const records = await sleepService.getSleepRecords(user.id, 30) // Last 30 records
      setSleepRecords(records)
    } catch (err) {
      setError('Failed to load sleep records')
      console.error('Error loading sleep records:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条睡眠记录吗？')) return

    try {
      await sleepService.deleteSleepRecord(id)
      setSleepRecords(records => records.filter(record => record.id !== id))
    } catch (err) {
      console.error('Error deleting sleep record:', err)
      // You could show a toast notification here
    }
  }

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins > 0 ? mins + 'm' : ''}`
  }

  const getSleepQualityColor = (rating: number | null): string => {
    if (!rating) return 'bg-gray-500'
    if (rating >= 4) return 'bg-green-500'
    if (rating >= 3) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getSleepQualityText = (rating: number | null): string => {
    if (!rating) return '未评级'
    if (rating >= 4) return '优秀'
    if (rating >= 3) return '良好'
    return '较差'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>本周睡眠历史</CardTitle>
          <CardDescription>查看最近的睡眠记录</CardDescription>
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
          <CardTitle>本周睡眠历史</CardTitle>
          <CardDescription>查看最近的睡眠记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive">{error}</p>
            <Button onClick={loadSleepRecords} className="mt-4">
              重试
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (sleepRecords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>本周睡眠历史</CardTitle>
          <CardDescription>查看最近的睡眠记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">暂无睡眠记录</p>
            <p className="text-sm text-muted-foreground mt-2">
              开始记录您的睡眠时间来查看历史记录
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>本周睡眠历史</CardTitle>
        <CardDescription>查看最近的睡眠记录</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sleepRecords.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">
                    {format(new Date(record.date), 'MM月dd日', { locale: zhCN })}
                  </span>
                  {record.quality_rating && (
                    <Badge
                      variant="secondary"
                      className={`${getSleepQualityColor(record.quality_rating)} text-white`}
                    >
                      {getSleepQualityText(record.quality_rating)}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span>睡觉: {record.sleep_time}</span>
                  <span className="mx-2">•</span>
                  <span>起床: {record.wake_time}</span>
                  <span className="mx-2">•</span>
                  <span className="font-medium text-primary">
                    {formatDuration(record.duration_minutes)}
                  </span>
                </div>
                {record.notes && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {record.notes}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // TODO: Implement edit functionality
                    console.log('Edit record:', record.id)
                  }}
                >
                  编辑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(record.id)}
                  className="text-destructive hover:text-destructive"
                >
                  删除
                </Button>
              </div>
            </div>
          ))}
        </div>

        {sleepRecords.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">平均睡眠</p>
                <p className="text-lg font-bold">
                  {formatDuration(
                    Math.round(
                      sleepRecords.reduce((sum, r) => sum + r.duration_minutes, 0) / sleepRecords.length
                    )
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">最早起床</p>
                <p className="text-lg font-bold">{sleepRecords[0]?.wake_time}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">最晚睡觉</p>
                <p className="text-lg font-bold">{sleepRecords[0]?.sleep_time}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">记录天数</p>
                <p className="text-lg font-bold">{sleepRecords.length}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}