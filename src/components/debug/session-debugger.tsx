'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'

export function SessionDebugger() {
  const [user, setUser] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [directSession, setDirectSession] = useState<any>(null)
  const [logs, setLogs] = useState<string[]>([])

  // Check auth state directly without hook
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        setSession(session)
        setUser(session?.user || null)
        setLoading(false)

        if (session && session.user) {
          addLog(`Session found for user: ${session.user.email}`)
        } else {
          addLog('No valid session found')
        }
      } catch (error) {
        addLog(`Session check failed: ${error}`)
        setUser(null)
        setSession(null)
        setLoading(false)
      }
    }

    checkAuthState()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      addLog(`Auth state changed: ${event}`)
      setSession(session)
      setUser(session?.user || null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`🔍 [SessionDebug] ${message}`)
  }

  useEffect(() => {
    addLog('Session debugger mounted')
    addLog(`Loading: ${loading}`)
    addLog(`User: ${user?.email || 'null'}`)
    addLog(`Session: ${session ? 'exists' : 'null'}`)

    // Check session directly from Supabase
    const checkDirectSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          addLog(`Direct session error: ${error.message}`)
        } else {
          addLog(`Direct session found: ${session ? 'yes' : 'no'}`)
          if (session) {
            addLog(`Direct session user: ${session.user?.email || 'null'}`)
            addLog(`Direct session expires: ${new Date(session.expires_at! * 1000).toLocaleString()}`)
          }
          setDirectSession(session)
        }
      } catch (error) {
        addLog(`Direct session check failed: ${error}`)
      }
    }

    checkDirectSession()

    // Check localStorage
    if (typeof window !== 'undefined') {
      const supabaseAuth = localStorage.getItem('supabase.auth.token')
      addLog(`LocalStorage token: ${supabaseAuth ? 'exists' : 'not found'}`)
    }
  }, [])

  const handleRefreshSession = async () => {
    addLog('Manually refreshing session...')

    try {
      const { data: { session }, error } = await supabase.auth.refreshSession()

      if (error) {
        addLog(`Refresh failed: ${error.message}`)
      } else {
        addLog(`Refresh successful: ${session ? 'session refreshed' : 'no session'}`)
      }
    } catch (error) {
      addLog(`Refresh error: ${error}`)
    }
  }

  const handleSignOut = async () => {
    addLog('Manually signing out...')
    await supabase.auth.signOut()
  }

  const handleGetUser = async () => {
    addLog('Getting current user...')

    try {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        addLog(`Get user failed: ${error.message}`)
      } else {
        addLog(`Current user: ${user?.email || 'null'}`)
      }
    } catch (error) {
      addLog(`Get user error: ${error}`)
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-96 max-h-96 overflow-hidden">
      <Card className="shadow-lg border-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            🔍 会话状态调试器
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-64 overflow-y-auto p-3 space-y-2 text-xs">
            {/* AuthContext 状态 */}
            <div className="border rounded p-2">
              <div className="font-medium mb-1">AuthContext 状态:</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Loading:</span>
                  <Badge variant={loading ? "secondary" : "default"}>
                    {loading ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>User:</span>
                  <Badge variant={user ? "default" : "destructive"}>
                    {user ? user.email.slice(0, 15) + "..." : "None"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Session:</span>
                  <Badge variant={session ? "default" : "destructive"}>
                    {session ? "Valid" : "None"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* 直接会话检查 */}
            <div className="border rounded p-2">
              <div className="font-medium mb-1">直接会话检查:</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Session:</span>
                  <Badge variant={directSession ? "default" : "destructive"}>
                    {directSession ? "Found" : "None"}
                  </Badge>
                </div>
                {directSession?.user && (
                  <div className="text-muted-foreground">
                    User: {directSession.user.email}
                  </div>
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="border rounded p-2 space-y-2">
              <div className="font-medium mb-1">调试操作:</div>
              <div className="grid grid-cols-2 gap-1">
                <Button size="sm" variant="outline" onClick={handleGetUser}>
                  Get User
                </Button>
                <Button size="sm" variant="outline" onClick={handleRefreshSession}>
                  Refresh
                </Button>
                <Button size="sm" variant="destructive" onClick={handleSignOut} className="col-span-2">
                  Sign Out
                </Button>
              </div>
            </div>

            {/* 日志 */}
            <div className="border rounded p-2">
              <div className="font-medium mb-1">调试日志:</div>
              <div className="max-h-32 overflow-y-auto font-mono text-xs space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-muted-foreground">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}