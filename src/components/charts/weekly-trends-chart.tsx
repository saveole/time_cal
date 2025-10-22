'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface WeeklyTrendsData {
  day: string
  work: number
  personal: number
  total: number
}

interface WeeklyTrendsChartProps {
  data: WeeklyTrendsData[]
}

export function WeeklyTrendsChart({ data }: WeeklyTrendsChartProps) {
  const formatHours = (value: number) => {
    const hours = Math.floor(value / 60)
    const minutes = value % 60
    return `${hours}h ${minutes > 0 ? minutes + 'm' : ''}`
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatHours(entry.value)}
            </p>
          ))}
          <p className="text-sm text-muted-foreground mt-1 pt-1 border-t">
            总计: {formatHours(payload.reduce((sum: number, entry: any) => sum + entry.value, 0))}
          </p>
        </div>
      )
    }
    return null
  }

  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-muted-foreground">
        暂无数据
      </div>
    )
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="day" className="text-muted-foreground" />
          <YAxis
            tickFormatter={(value) => `${Math.floor(value / 60)}h`}
            className="text-muted-foreground"
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="work" stackId="a" fill="#3b82f6" name="工作" />
          <Bar dataKey="personal" stackId="a" fill="#10b981" name="个人" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}