import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyJWT, extractUserFromRequest, User } from '@/lib/auth'

export async function middleware(req: NextRequest) {
  // 在开发环境中启用中间件调试模式
  const isDevelopment = process.env.NODE_ENV === 'development'

  // 定义受保护的路由和认证路由
  const protectedRoutes = ['/dashboard', '/sleep', '/activities', '/statistics', '/migration']
  const authRoutes = ['/auth/login']
  const publicRoutes = ['/', '/auth/reset-password', '/auth/callback']

  const { pathname } = req.nextUrl

  if (isDevelopment) {
    console.log('🛡️ [Middleware] Processing request:', {
      method: req.method,
      pathname,
      userAgent: req.headers.get('user-agent'),
      timestamp: new Date().toISOString()
    })
  }

  // 从 JWT 令牌中提取用户
  const user = extractUserFromRequest(req)
  const isValidSession = !!user

  if (isDevelopment) {
    console.log('🔐 [Middleware] JWT Session status:', {
      hasSession: isValidSession,
      userId: user?.id,
      githubUsername: user?.githubUsername,
      pathname
    })
  }

  // 如果用户未登录且访问受保护的路由，重定向到登录页
  if (!isValidSession && protectedRoutes.some(route => pathname.startsWith(route))) {
    if (isDevelopment) {
      console.log('🚫 [Middleware] Unauthenticated user accessing protected route:', {
        pathname,
        redirectTo: '/auth/login',
        hasUser: !!user
      })
    }

    const redirectUrl = new URL('/auth/login', req.url)
    redirectUrl.searchParams.set('redirectTo', pathname)

    if (isDevelopment) {
      console.log('🔙 [Middleware] Redirecting to login with redirectTo parameter')
    }
    return NextResponse.redirect(redirectUrl)
  }

  // 如果用户已登录且访问认证路由，重定向到仪表板
  if (isValidSession && authRoutes.some(route => pathname.startsWith(route))) {
    if (isDevelopment) {
      console.log('✅ [Middleware] Authenticated user accessing auth route:', {
        pathname,
        userId: user.id,
        redirectTo: '/dashboard'
      })
    }

    if (isDevelopment) {
      console.log('🔙 [Middleware] Redirecting authenticated user to dashboard')
    }
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // 对认证回调和 API 路由进行特殊处理
  if (pathname === '/auth/callback' || pathname.startsWith('/api/auth/')) {
    if (isDevelopment) {
      console.log('🔄 [Middleware] Auth request - allowing to proceed:', { pathname })
    }
    return NextResponse.next()
  }

  if (isDevelopment) {
    console.log('✅ [Middleware] Request allowed to proceed:', {
      pathname,
      hasSession: isValidSession
    })
  }

  // 添加安全头部
  const response = NextResponse.next()

  // 安全头部
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  )

  return response
}

export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了以下开头的路径：
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (网站图标文件)
     * 可以随意修改此模式以包含更多路径。
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}