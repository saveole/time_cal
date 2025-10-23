'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { tokenStorage } from '@/lib/token-storage'

function AuthCallbackPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('正在处理认证回调...')

  useEffect(() => {
    const error = searchParams.get('error')
    const token = searchParams.get('token')

    if (error) {
      setStatus('error')
      setMessage(`认证失败: ${decodeURIComponent(error)}`)
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
      return
    }

    if (token) {
      try {
        console.log('🔑 [Callback] Received token, storing in localStorage')

        // Store the token in localStorage
        tokenStorage.setToken(token)

        // Verify the token works by calling /api/auth/me
        fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        .then(response => {
          if (response.ok) {
            setStatus('success')
            setMessage('认证成功！正在跳转到控制台...')
            console.log('✅ [Callback] Token validated successfully')

            // Redirect to dashboard after a short delay
            setTimeout(() => {
              router.push('/sleep')
            }, 1500)
          } else {
            setStatus('error')
            setMessage('令牌验证失败，请重试')
            console.error('❌ [Callback] Token validation failed')
            tokenStorage.clearToken()
            setTimeout(() => {
              router.push('/auth/login')
            }, 3000)
          }
        })
        .catch((error) => {
          setStatus('error')
          setMessage('网络错误，请检查连接后重试')
          console.error('💥 [Callback] Network error during validation:', error)
          tokenStorage.clearToken()
          setTimeout(() => {
            router.push('/auth/login')
          }, 3000)
        })
      } catch (error) {
        setStatus('error')
        setMessage('令牌处理失败，请重试')
        console.error('💥 [Callback] Token processing error:', error)
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
      }
    } else {
      // No token and no error - probably a direct access or session check
      setStatus('loading')
      setMessage('正在检查现有认证状态...')

      // Check if we already have a valid token in localStorage
      const timer = setTimeout(() => {
        if (tokenStorage.hasToken() && !tokenStorage.isTokenExpired()) {
          setStatus('success')
          setMessage('已认证！正在跳转到控制台...')
          setTimeout(() => {
            router.push('/sleep')
          }, 1000)
        } else {
          setStatus('error')
          setMessage('未找到有效认证信息')
          setTimeout(() => {
            router.push('/auth/login')
          }, 2000)
        }
      }, 1000)

      return () => clearTimeout(timer)
    }
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