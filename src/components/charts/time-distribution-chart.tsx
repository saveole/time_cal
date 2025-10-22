'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface TimeDistributionData {
  name: string
  value: number
  color: string
  [key: string]: any // Allow additional properties for Recharts
}

interface TimeDistributionChartProps {
  data: TimeDistributionData[]
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280']

export function TimeDistributionChart({ data }: TimeDistributionChartProps) {
  const formatHours = (value: number) => {
    const hours = Math.floor(value / 60)
    const minutes = value % 60
    return `${hours}h ${minutes > 0 ? minutes + 'm' : ''}`
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-primary">{formatHours(payload[0].value)}</p>
          <p className="text-sm text-muted-foreground">
            {((payload[0].value / data.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%
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
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }: any) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}