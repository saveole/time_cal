'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { authLogger } from '@/lib/auth-logger'
import { Download, Trash2, Eye, EyeOff } from 'lucide-react'

interface LogEntry {
  timestamp: string
  level: string
  category: string
  message: string
  data?: any
}

export function AuthLogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    if (!autoRefresh) return

    const refreshLogs = () => {
      setLogs(authLogger.getLogHistory())
    }

    // 初始加载
    refreshLogs()

    // 每秒刷新一次
    const interval = setInterval(refreshLogs, 1000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  const handleExportLogs = () => {
    const logData = authLogger.exportLogs()
    const blob = new Blob([logData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `auth-logs-${new Date().toISOString().slice(0, 19)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleClearLogs = () => {
    authLogger.clearLogHistory()
    setLogs([])
  }

  const getLevelColor = (level: string) => {
    const colors = {
      info: 'bg-blue-100 text-blue-800',
      warn: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      debug: 'bg-gray-100 text-gray-800'
    }
    return colors[level] || 'bg-gray-100 text-gray-800'
  }

  const getCategoryIcon = (category: string) => {
    const icons = {
      Auth: '🔐',
      OAuth: '🔗',
      Callback: '🔄',
      Session: '📱',
      Middleware: '🛡️',
      UI: '🖱️'
    }
    return icons[category] || '📝'
  }

  const formatData = (data: any) => {
    if (!data) return null
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return String(data)
    }
  }

  const analysis = authLogger.analyzeAuthFailures()

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-background/80 backdrop-blur-sm"
        >
          <Eye className="h-4 w-4 mr-2" />
          认证日志 ({logs.length})
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-hidden">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              📊 认证日志查看器
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'text-green-600' : 'text-gray-400'}
              >
                {autoRefresh ? '🔄' : '⏸️'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 快速统计 */}
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">
              总计: {logs.length}
            </Badge>
            <Badge variant="destructive" className="bg-red-100 text-red-800">
              错误: {analysis.totalErrors}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportLogs}
              className="h-6 px-2 text-xs"
            >
              <Download className="h-3 w-3 mr-1" />
              导出
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearLogs}
              className="h-6 px-2 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              清空
            </Button>
          </div>

          {/* 错误分析 */}
          {analysis.totalErrors > 0 && (
            <div className="text-xs space-y-1">
              <div className="font-medium text-red-600">错误分析:</div>
              {Object.entries(analysis.errorsByType).map(([type, count]) => (
                <div key={type} className="flex justify-between">
                  <span>{type}:</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                暂无日志记录
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {logs.slice().reverse().map((log, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-2 text-xs space-y-1 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span>{getCategoryIcon(log.category)}</span>
                        <Badge className={getLevelColor(log.level)}>
                          {log.level}
                        </Badge>
                        <span className="font-medium">{log.category}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-foreground">{log.message}</div>
                    {log.data && Object.keys(log.data).length > 0 && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          查看详情 ({Object.keys(log.data).length} 项)
                        </summary>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                          {formatData(log.data)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// 开发环境调试工具
export function DebugAuthLogger() {
  const [isEnabled, setIsEnabled] = useState(
    process.env.NODE_ENV === 'development'
  )

  if (!isEnabled) return null

  return <AuthLogViewer />
}