'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TimeDistributionChart } from '@/components/charts/time-distribution-chart'
import { WeeklyTrendsChart } from '@/components/charts/weekly-trends-chart'
import { activitiesService } from '@/lib/database/activities'
import { sleepService } from '@/lib/database/sleep'
import { useAuth } from '@/contexts/auth-context'
import { format, subDays, startOfWeek } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Download, Calendar } from 'lucide-react'

interface TimeDistributionData {
  name: string
  value: number
  color: string
}

interface WeeklyTrendsData {
  day: string
  work: number
  personal: number
  total: number
}

export default function StatisticsPage() {
  const [timeRange, setTimeRange] = useState('week')
  const [loading, setLoading] = useState(true)
  const [timeDistribution, setTimeDistribution] = useState<TimeDistributionData[]>([])
  const [weeklyTrends, setWeeklyTrends] = useState<WeeklyTrendsData[]>([])
  const [sleepStats, setSleepStats] = useState<any>(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadStatistics()
    }
  }, [user, timeRange])

  const loadStatistics = async () => {
    if (!user) return

    try {
      setLoading(true)
      const endDate = new Date()
      let startDate: Date

      switch (timeRange) {
        case 'week':
          startDate = subDays(endDate, 7)
          break
        case 'month':
          startDate = subDays(endDate, 30)
          break
        case 'quarter':
          startDate = subDays(endDate, 90)
          break
        default:
          startDate = subDays(endDate, 7)
      }

      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]

      // Load activity statistics
      const activityStats = await activitiesService.getActivityStats(user.id, startDateStr, endDateStr)

      // Transform data for time distribution chart
      const distributionData: TimeDistributionData[] = activityStats.stats.map(stat => ({
        name: stat.name,
        value: stat.totalMinutes,
        color: stat.color
      }))

      // Generate weekly trends data
      const trendsData: WeeklyTrendsData[] = []
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })

      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(weekStart)
        currentDate.setDate(weekStart.getDate() + i)
        const dayStr = format(currentDate, 'EEEE', { locale: zhCN })

        // Mock data for now - replace with actual API calls
        trendsData.push({
          day: dayStr,
          work: Math.floor(Math.random() * 360) + 240, // 4-10 hours
          personal: Math.floor(Math.random() * 180) + 60, // 1-4 hours
          total: 0
        })
      }

      // Calculate total for each day
      trendsData.forEach(day => {
        day.total = day.work + day.personal
      })

      // Load sleep statistics
      const sleepData = await sleepService.getSleepStats(user.id, startDateStr, endDateStr)

      setTimeDistribution(distributionData)
      setWeeklyTrends(trendsData)
      setSleepStats(sleepData)
    } catch (error) {
      console.error('Error loading statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    // Mock export functionality
    const data = {
      timeRange,
      timeDistribution,
      weeklyTrends,
      sleepStats,
      exportDate: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `time-management-stats-${timeRange}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载统计数据中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">统计分析</h1>
          <p className="text-muted-foreground">
            深度分析您的时间使用模式和生产力趋势
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">本周</SelectItem>
              <SelectItem value="month">本月</SelectItem>
              <SelectItem value="quarter">本季度</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">总工作时长</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {Math.floor((timeDistribution.find(d => d.name === 'Work')?.value || 0) / 60)}h
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {timeRange === 'week' ? '本周' : timeRange === 'month' ? '本月' : '本季度'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">平均睡眠</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {sleepStats ? Math.floor(sleepStats.avgDuration / 60) : 0}h
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              平均睡眠时长
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">活动数量</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {timeDistribution.reduce((sum, d) => sum + 1, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              不同类型活动
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">效率评分</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">85%</div>
            <p className="text-xs text-muted-foreground mt-1">
              生产力指数
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>时间分布</CardTitle>
            <CardDescription>
              按活动类别显示时间分配
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TimeDistributionChart data={timeDistribution} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>本周趋势</CardTitle>
            <CardDescription>
              每日工作与个人时间对比
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WeeklyTrendsChart data={weeklyTrends} />
          </CardContent>
        </Card>
      </div>

      {/* Sleep Analysis */}
      {sleepStats && (
        <Card>
          <CardHeader>
            <CardTitle>睡眠分析</CardTitle>
            <CardDescription>
              睡眠质量和模式分析
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {Math.floor(sleepStats.avgDuration / 60)}h {sleepStats.avgDuration % 60}m
                </div>
                <p className="text-sm text-muted-foreground">平均睡眠时长</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  {sleepStats.avgQuality.toFixed(1)}/5
                </div>
                <p className="text-sm text-muted-foreground">平均睡眠质量</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  {sleepStats.totalRecords}
                </div>
                <p className="text-sm text-muted-foreground">记录天数</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Options */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>数据导出</CardTitle>
          <CardDescription>
            导出您的数据用于外部分析或备份
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              导出 JSON
            </Button>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              生成报告
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}