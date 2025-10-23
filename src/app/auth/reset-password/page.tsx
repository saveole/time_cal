'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ResetPasswordPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to login after 3 seconds
    const timer = setTimeout(() => {
      router.push('/auth/login')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>密码重置已停用</CardTitle>
          <CardDescription>
            现在使用 GitHub OAuth 登录，不再需要密码重置功能
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            您将自动跳转到登录页面...
          </p>
          <Button asChild>
            <Link href="/auth/login">
              立即跳转到登录页面
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}