'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { Github } from 'lucide-react'

function LoginPageContent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signInWithGitHub } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    console.log('🏠 [Login] Login page component mounted')
    console.log('🔍 [Login] Current URL:', window.location.href)

    // Check for error in URL parameters
    const urlError = searchParams.get('error')
    const message = searchParams.get('message')
    const redirectTo = searchParams.get('redirectTo')

    console.log('📋 [Login] URL parameters found:', {
      error: urlError,
      message,
      redirectTo
    })

    if (urlError) {
      const decodedError = decodeURIComponent(urlError)
      console.warn('⚠️ [Login] Error parameter found in URL:', decodedError)
      setError(decodedError)
    } else if (message) {
      const decodedMessage = decodeURIComponent(message)
      console.log('📨 [Login] Message parameter found in URL:', decodedMessage)
      setError(decodedMessage)
    } else {
      console.log('✅ [Login] No error or message parameters found')
    }

    console.log('📊 [Login] Auth context state:', {
      loading: loading,
      hasAuthContext: !!signInWithGitHub
    })
  }, [searchParams, loading, signInWithGitHub])

  const handleGitHubSignIn = async () => {
    console.log('🚀 [Login] User clicked GitHub login button')
    setLoading(true)
    setError(null)

    try {
      console.log('📞 [Login] Calling signInWithGitHub function')
      const { error } = await signInWithGitHub()

      if (error) {
        console.error('❌ [Login] GitHub sign in failed:', {
          error: error.message,
          code: error.status,
          details: error
        })
        setError(error.message || 'GitHub 登录失败，请重试')
        setLoading(false)
      } else {
        console.log('✅ [Login] GitHub sign in initiated successfully, waiting for redirect...')
        console.log('🔄 [Login] OAuth flow in progress - user should be redirected to GitHub')
        // Note: GitHub OAuth will redirect, so we don't need to handle navigation here
      }
    } catch (unexpectedError) {
      console.error('💥 [Login] Unexpected error during GitHub sign in:', {
        error: unexpectedError,
        message: unexpectedError instanceof Error ? unexpectedError.message : 'Unknown error',
        stack: unexpectedError instanceof Error ? unexpectedError.stack : undefined
      })
      setError('登录过程中发生意外错误，请重试')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>登录</CardTitle>
          <CardDescription>
            使用 GitHub 账户登录您的时间管理系统
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button
              onClick={handleGitHubSignIn}
              className="w-full"
              disabled={loading}
              variant="outline"
            >
              <Github className="mr-2 h-4 w-4" />
              {loading ? 'GitHub 登录中...' : '使用 GitHub 登录'}
            </Button>

            {error && (
              <div className="text-sm text-destructive text-center">
                {error}
              </div>
            )}
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            您将重定向到 GitHub 进行身份验证
          </div>

          </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">Loading...</div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}