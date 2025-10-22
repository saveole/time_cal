'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { activitiesService } from '@/lib/database/activities'
import { useAuth } from '@/contexts/auth-context'
import type { ActivityInsert, ActivityCategory } from '@/types/database'

interface ActivityFormProps {
  onSubmit: (activity: ActivityInsert) => void
  initialValues?: Partial<ActivityInsert>
  onCancel?: () => void
}

const activityCategories = [
  { value: 'work', label: '工作' },
  { value: 'personal', label: '个人' },
  { value: 'leisure', label: '休闲' },
  { value: 'exercise', label: '运动' },
  { value: 'learning', label: '学习' },
  { value: 'other', label: '其他' }
]

export function ActivityForm({ onSubmit, initialValues, onCancel }: ActivityFormProps) {
  const [name, setName] = useState(initialValues?.name || '')
  const [category, setCategory] = useState<string>(initialValues?.category_id || '')
  const [description, setDescription] = useState(initialValues?.description || '')
  const [startTime, setStartTime] = useState(() => {
    if (initialValues?.start_time) {
      return new Date(initialValues.start_time).toISOString().slice(0, 16)
    }
    return new Date().toISOString().slice(0, 16)
  })
  const [endTime, setEndTime] = useState(() => {
    if (initialValues?.end_time) {
      return new Date(initialValues.end_time).toISOString().slice(0, 16)
    }
    return new Date().toISOString().slice(0, 16)
  })
  const [categories, setCategories] = useState<ActivityCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadCategories()
    }
  }, [user])

  const loadCategories = async () => {
    if (!user) return

    try {
      setLoadingCategories(true)
      const userCategories = await activitiesService.getActivityCategories(user.id)
      setCategories(userCategories)
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoadingCategories(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      return
    }

    if (!name || !category || !startTime) {
      return
    }

    setLoading(true)

    try {
      const activity: ActivityInsert = {
        user_id: user.id,
        name,
        category_id: category,
        description: description || null,
        start_time: new Date(startTime).toISOString(),
        end_time: endTime ? new Date(endTime).toISOString() : null,
        is_active: !endTime
      }

      await onSubmit(activity)

      // Reset form if not editing
      if (!initialValues) {
        setName('')
        setCategory('')
        setDescription('')
        const now = new Date()
        setStartTime(now.toISOString().slice(0, 16))
        setEndTime(now.toISOString().slice(0, 16))
      }
    } catch (error) {
      console.error('Error saving activity:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickStart = () => {
    const now = new Date()
    setStartTime(now.toISOString().slice(0, 16))
    setEndTime('')
  }

  const handleQuickEnd = () => {
    const now = new Date()
    setEndTime(now.toISOString().slice(0, 16))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialValues ? '编辑活动' : '记录新活动'}</CardTitle>
        <CardDescription>
          {initialValues ? '修改活动信息' : '记录您的日常活动，追踪时间分配'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Activity Name */}
          <div className="space-y-2">
            <Label htmlFor="name">活动名称</Label>
            <Input
              id="name"
              placeholder="例如：编程、读书、运动"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Activity Category */}
          <div className="space-y-2">
            <Label htmlFor="category">活动类别</Label>
            {loadingCategories ? (
              <div className="text-sm text-muted-foreground">加载分类中...</div>
            ) : (
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="选择类别" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                  {categories.length === 0 && (
                    <>
                      {activityCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Start Time */}
          <div className="space-y-2">
            <Label htmlFor="startTime">开始时间</Label>
            <Input
              id="startTime"
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleQuickStart}
              >
                当前时间
              </Button>
            </div>
          </div>

          {/* End Time */}
          <div className="space-y-2">
            <Label htmlFor="endTime">结束时间</Label>
            <Input
              id="endTime"
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleQuickEnd}
              >
                当前时间
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEndTime('')}
              >
                进行中
              </Button>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              placeholder="活动详细描述（可选）"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? '保存中...' : '保存活动'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                取消
              </Button>
            )}
            {!initialValues && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setName('')
                  setCategory('')
                  setDescription('')
                  const now = new Date()
                  setStartTime(now.toISOString().slice(0, 16))
                  setEndTime(now.toISOString().slice(0, 16))
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