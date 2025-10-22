'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { sleepService } from '@/lib/database/sleep'
import type { SleepRecordInsert } from '@/types/database'

interface SleepFormProps {
  onSubmit: (sleep: SleepRecordInsert) => void
  initialValues?: Partial<SleepRecordInsert>
}

export function SleepForm({ onSubmit, initialValues }: SleepFormProps) {
  const [date, setDate] = useState(() => {
    const today = new Date().toISOString().split('T')[0]
    return initialValues?.date || today
  })
  const [wakeTime, setWakeTime] = useState(initialValues?.wake_time || '06:00')
  const [sleepTime, setSleepTime] = useState(initialValues?.sleep_time || '22:00')
  const [wakeTimeMinutes, setWakeTimeMinutes] = useState(6 * 60) // 6:00 AM in minutes
  const [sleepTimeMinutes, setSleepTimeMinutes] = useState(22 * 60) // 10:00 PM in minutes
  const [duration, setDuration] = useState(0)
  const [loading, setLoading] = useState(false)

  // Quick time options
  const quickWakeTimes = ['05:00', '06:00', '06:30', '07:00', '07:30', '08:00']
  const quickSleepTimes = ['21:00', '22:00', '22:30', '23:00', '23:30', '00:00']

  // Convert time string to minutes since midnight
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Convert minutes since midnight to time string
  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60) % 24
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  // Calculate sleep duration
  const calculateDuration = (sleep: string, wake: string): number => {
    const sleepMinutes = timeToMinutes(sleep)
    const wakeMinutes = timeToMinutes(wake)

    // Handle overnight sleep
    let duration = wakeMinutes - sleepMinutes
    if (duration < 0) {
      duration += 24 * 60 // Add 24 hours
    }

    return duration
  }

  // Update duration when times change
  useEffect(() => {
    const newDuration = calculateDuration(sleepTime, wakeTime)
    setDuration(newDuration)
  }, [sleepTime, wakeTime])

  // Handle wake time slider change
  const handleWakeSliderChange = (value: number[]) => {
    const minutes = value[0]
    setWakeTimeMinutes(minutes)
    const time = minutesToTime(minutes)
    setWakeTime(time)
  }

  // Handle sleep time slider change
  const handleSleepSliderChange = (value: number[]) => {
    const minutes = value[0]
    setSleepTimeMinutes(minutes)
    const time = minutesToTime(minutes)
    setSleepTime(time)
  }

  // Handle quick time selection
  const handleQuickWakeTime = (time: string) => {
    setWakeTime(time)
    setWakeTimeMinutes(timeToMinutes(time))
  }

  const handleQuickSleepTime = (time: string) => {
    setSleepTime(time)
    setSleepTimeMinutes(timeToMinutes(time))
  }

  // Format duration for display
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}小时${mins > 0 ? mins + '分钟' : ''}`
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const sleepRecord: SleepRecordInsert = {
        user_id: '', // This will be set by auth context
        date,
        wake_time: wakeTime,
        sleep_time: sleepTime,
        quality_rating: null, // Can be added later
        notes: null // Can be added later
      }

      await onSubmit(sleepRecord)

      // Reset form if not editing
      if (!initialValues) {
        const today = new Date().toISOString().split('T')[0]
        setDate(today)
        setWakeTime('06:00')
        setSleepTime('22:00')
        setWakeTimeMinutes(6 * 60)
        setSleepTimeMinutes(22 * 60)
      }
    } catch (error) {
      console.error('Error saving sleep record:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>记录睡眠时间</CardTitle>
        <CardDescription>
          记录您的起床和睡觉时间，计算睡眠时长
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="date">日期</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Wake Time */}
          <div className="space-y-4">
            <Label>起床时间</Label>
            <div className="space-y-2">
              <Input
                type="time"
                value={wakeTime}
                onChange={(e) => {
                  setWakeTime(e.target.value)
                  setWakeTimeMinutes(timeToMinutes(e.target.value))
                }}
                required
              />
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">滑动选择时间</Label>
                <Slider
                  value={[wakeTimeMinutes]}
                  onValueChange={handleWakeSliderChange}
                  max={1439} // 23:59 in minutes
                  step={15}
                  className="w-full"
                />
                <div className="text-center text-sm text-muted-foreground">
                  {wakeTime}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickWakeTimes.map((time) => (
                  <Button
                    key={time}
                    type="button"
                    variant={wakeTime === time ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleQuickWakeTime(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Sleep Time */}
          <div className="space-y-4">
            <Label>睡觉时间</Label>
            <div className="space-y-2">
              <Input
                type="time"
                value={sleepTime}
                onChange={(e) => {
                  setSleepTime(e.target.value)
                  setSleepTimeMinutes(timeToMinutes(e.target.value))
                }}
                required
              />
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">滑动选择时间</Label>
                <Slider
                  value={[sleepTimeMinutes]}
                  onValueChange={handleSleepSliderChange}
                  max={1439} // 23:59 in minutes
                  step={15}
                  className="w-full"
                />
                <div className="text-center text-sm text-muted-foreground">
                  {sleepTime}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickSleepTimes.map((time) => (
                  <Button
                    key={time}
                    type="button"
                    variant={sleepTime === time ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleQuickSleepTime(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Duration Display */}
          <div className="p-4 bg-muted rounded-lg">
            <Label className="text-base font-medium">睡眠时长</Label>
            <div className="text-2xl font-bold text-primary mt-1">
              {formatDuration(duration)}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? '保存中...' : '保存记录'}
            </Button>
            {!initialValues && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0]
                  setDate(today)
                  setWakeTime('06:00')
                  setSleepTime('22:00')
                  setWakeTimeMinutes(6 * 60)
                  setSleepTimeMinutes(22 * 60)
                }}
              >
                重置
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}