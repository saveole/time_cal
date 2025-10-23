'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

function AuthCallbackPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('正在处理认证回调...')

  useEffect(() => {
    const error = searchParams.get('error')

    if (error) {
      setStatus('error')
      setMessage(`认证失败: ${decodeURIComponent(error)}`)
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
      return
    }

    // The actual OAuth flow is handled by the API route
    // This page is just a loading state while the API processes the callback
    const timer = setTimeout(() => {
      // Check if authentication was successful by trying to access user data
      fetch('/api/auth/me', {
        credentials: 'include'
      })
      .then(response => {
        if (response.ok) {
          setStatus('success')
          setMessage('认证成功！正在跳转到控制台...')
          setTimeout(() => {
            router.push('/dashboard')
          }, 1500)
        } else {
          setStatus('error')
          setMessage('认证失败，请重试')
          setTimeout(() => {
            router.push('/auth/login')
          }, 3000)
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('网络错误，请检查连接后重试')
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
      })
    }, 2000) // Give time for OAuth callback processing

    return () => clearTimeout(timer)
  }, [router, searchParams])

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />
      case 'error':
        return <XCircle className="h-12 w-12 text-red-500" />
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            {getIcon()}
            <span>认证处理中</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground mb-4">
            {message}
          </p>

          {status === 'loading' && (
            <div className="text-sm text-muted-foreground">
              正在验证您的 GitHub 身份信息...
            </div>
          )}

          {status === 'success' && (
            <div className="text-sm text-green-600">
              欢迎回来！即将跳转到您的控制台
            </div>
          )}

          {status === 'error' && (
            <div className="text-sm text-red-600">
              即将跳转回登录页面...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">Loading...</div>
      </div>
    }>
      <AuthCallbackPageContent />
    </Suspense>
  )
}