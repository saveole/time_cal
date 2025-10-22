'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DataMigrator } from '@/lib/migration/data-migrator'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'react-hot-toast'
import { Database, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'

interface MigrationWizardProps {
  onComplete?: () => void
}

export function MigrationWizard({ onComplete }: MigrationWizardProps) {
  const { user } = useAuth()
  const [migrationData, setMigrationData] = useState<any>(null)
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      const summary = DataMigrator.getMigrationSummary()
      setMigrationData(summary)
    }
  }, [user])

  const handleMigration = async () => {
    if (!user) return

    setIsMigrating(true)
    setError(null)

    try {
      const result = await DataMigrator.migrateAll(user.id)
      setMigrationResult(result)

      if (result.success) {
        toast.success(`数据迁移成功！迁移了 ${result.migratedSleep} 条睡眠记录和 ${result.migratedActivities} 条活动记录`)

        // Optionally clear local storage after successful migration
        DataMigrator.clearLocalStorage()

        if (onComplete) {
          onComplete()
        }
      } else {
        setError('迁移过程中出现错误，请查看详细信息')
        toast.error('数据迁移失败')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      setError(`迁移失败: ${errorMessage}`)
      toast.error('数据迁移失败')
    } finally {
      setIsMigrating(false)
    }
  }

  const handleSkip = () => {
    if (onComplete) {
      onComplete()
    }
  }

  if (!user) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          请先登录才能进行数据迁移
        </AlertDescription>
      </Alert>
    )
  }

  if (!migrationData) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">检查本地数据中...</p>
      </div>
    )
  }

  if (!migrationData.hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            数据迁移
          </CardTitle>
          <CardDescription>
            检查本地存储中的历史数据
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              未找到需要迁移的历史数据
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              如果您之前使用过本应用，数据可能已经存储在云端
            </p>
            <Button onClick={handleSkip}>
              开始使用应用
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          数据迁移向导
        </CardTitle>
        <CardDescription>
          将您的历史数据从本地存储迁移到云端
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Migration Summary */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-3">发现的历史数据</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">睡眠记录</p>
              <p className="text-xl font-bold">{migrationData.sleepCount} 条</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">活动记录</p>
              <p className="text-xl font-bold">{migrationData.activityCount} 条</p>
            </div>
          </div>
          {migrationData.lastSync && (
            <p className="text-sm text-muted-foreground mt-2">
              最后同步: {new Date(migrationData.lastSync).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Migration Process */}
        {isMigrating && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm">正在迁移数据...</span>
            </div>
            <Progress value={undefined} className="w-full" />
          </div>
        )}

        {/* Migration Result */}
        {migrationResult && (
          <div className={`p-4 rounded-lg ${migrationResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-start gap-3">
              {migrationResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className={`font-medium mb-2 ${migrationResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {migrationResult.success ? '迁移成功！' : '迁移失败'}
                </h4>
                {migrationResult.success ? (
                  <div className="text-sm text-green-700">
                    <p>成功迁移了 {migrationResult.migratedSleep} 条睡眠记录</p>
                    <p>成功迁移了 {migrationResult.migratedActivities} 条活动记录</p>
                  </div>
                ) : (
                  <div className="text-sm text-red-700">
                    {migrationResult.errors.map((error: string, index: number) => (
                      <p key={index}>• {error}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!migrationResult && !isMigrating && (
            <>
              <Button
                onClick={handleMigration}
                disabled={isMigrating}
                className="flex-1"
              >
                <Database className="h-4 w-4 mr-2" />
                开始迁移
              </Button>
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={isMigrating}
              >
                跳过
              </Button>
            </>
          )}

          {migrationResult && (
            <Button
              onClick={handleSkip}
              className="w-full"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              继续使用应用
            </Button>
          )}
        </div>

        {/* Information */}
        <div className="text-xs text-muted-foreground border-t pt-4">
          <p><strong>注意：</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>迁移过程会将您的本地数据上传到云端</li>
            <li>迁移成功后，本地数据将被自动清理</li>
            <li>云端数据可以在多个设备间同步</li>
            <li>迁移过程是安全的，不会丢失任何数据</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}