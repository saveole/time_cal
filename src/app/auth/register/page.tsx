'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'react-hot-toast'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signUp } = useAuth()
  const router = useRouter()

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      setError('请填写所有必填字段')
      return false
    }

    if (password.length < 6) {
      setError('密码至少需要6个字符')
      return false
    }

    if (password !== confirmPassword) {
      setError('密码确认不匹配')
      return false
    }

    if (!email.includes('@')) {
      setError('请输入有效的邮箱地址')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const { error } = await signUp(email, password)

      if (error) {
        setError(error.message || '注册失败，请重试')
      } else {
        toast.success('注册成功！请检查邮箱并点击确认链接')
        router.push('/auth/login?message=请检查邮箱并确认注册')
      }
    } catch (error) {
      setError('注册过程中发生错误，请重试')
      console.error('Registration error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>注册账户</CardTitle>
          <CardDescription>
            创建您的时间管理账户
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">姓名（可选）</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="输入您的姓名"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="输入您的邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="创建密码（至少6个字符）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-sm text-destructive">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '注册中...' : '注册账户'}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            已有账户？{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              登录
            </Link>
          </div>
          <div className="mt-4 text-center text-xs text-muted-foreground">
            注册即表示您同意我们的服务条款和隐私政策
          </div>
        </CardContent>
      </Card>
    </div>
  )
}