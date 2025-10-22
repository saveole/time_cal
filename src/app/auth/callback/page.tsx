'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

export default function SimpleAuthCallbackTest() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`🧪 [SimpleTest] ${message}`)
  }

  useEffect(() => {
    addLog('Simple test callback page loaded')
    addLog(`URL: ${window.location.href}`)
    addLog(`Loading: ${loading}`)
    addLog(`Has user: ${!!user}`)

    if (!loading) {
      addLog('Auth state determined')

      if (user) {
        addLog(`User found: ${user.email}`)
        addLog('Redirecting to dashboard in 1 second...')

        setTimeout(() => {
          addLog('Executing redirect to /dashboard')
          router.push('/dashboard')
        }, 1000)
      } else {
        addLog('No user found - authentication failed')
        setTimeout(() => {
          router.push('/auth/login?error=No user session')
        }, 2000)
      }
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full">
        <div className="bg-card rounded-lg p-6 shadow-lg">
          <h1 className="text-xl font-bold mb-4">认证回调测试页面</h1>

          <div className="space-y-2 mb-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
              <span className="text-sm">Loading: {loading ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${user ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm">User: {user ? user.email : 'Not found'}</span>
            </div>
          </div>

          <div className="bg-muted rounded p-3 max-h-40 overflow-y-auto">
            <h3 className="text-sm font-medium mb-2">调试日志:</h3>
            <div className="text-xs space-y-1 font-mono">
              {logs.map((log, index) => (
                <div key={index} className="text-muted-foreground">
                  {log}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              手动跳转到 Dashboard
            </button>
            <button
              onClick={() => router.push('/auth/login')}
              className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
            >
              返回登录页面
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}