'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

export function Header() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const { user, signOut, loading } = useAuth()

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            时间管理
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/dashboard" className="text-sm font-medium hover:text-primary">
              概览
            </Link>
            <Link href="/sleep" className="text-sm font-medium hover:text-primary">
              睡眠记录
            </Link>
            <Link href="/activities" className="text-sm font-medium hover:text-primary">
              活动记录
            </Link>
            <Link href="/statistics" className="text-sm font-medium hover:text-primary">
              统计分析
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="h-9 w-9"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {user.email}
                    </span>
                    <Button variant="outline" size="sm" onClick={handleSignOut}>
                      登出
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/auth/register">
                        注册
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/auth/login">
                        登录
                      </Link>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}