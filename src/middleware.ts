import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Enable debug mode for middleware in development
  const isDevelopment = process.env.NODE_ENV === 'development'

  // Define protected routes and auth routes
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

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession()

  if (sessionError) {
    console.error('❌ [Middleware] Error getting session:', {
      error: sessionError.message,
      pathname
    })
  }

  if (isDevelopment) {
    console.log('🔐 [Middleware] Session status:', {
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
      provider: session?.user?.app_metadata?.provider,
      sessionValid: !!session && !!session.user,
      pathname
    })
  }

  // Enhanced session validation
  const isValidSession = session && session.user && session.access_token

  // If user is not signed in and accessing protected route, redirect to login
  if (!isValidSession && protectedRoutes.some(route => pathname.startsWith(route))) {
    if (isDevelopment) {
      console.log('🚫 [Middleware] Unauthenticated user accessing protected route:', {
        pathname,
        redirectTo: '/auth/login',
        hasSession: !!session,
        hasUser: !!session?.user,
        hasToken: !!session?.access_token
      })
    }

    const redirectUrl = new URL('/auth/login', req.url)
    redirectUrl.searchParams.set('redirectTo', pathname)

    if (isDevelopment) {
      console.log('🔙 [Middleware] Redirecting to login with redirectTo parameter')
    }
    return NextResponse.redirect(redirectUrl)
  }

  // If user is signed in and accessing auth route, redirect to dashboard
  if (isValidSession && authRoutes.some(route => pathname.startsWith(route))) {
    if (isDevelopment) {
      console.log('✅ [Middleware] Authenticated user accessing auth route:', {
        pathname,
        userId: session.user.id,
        redirectTo: '/dashboard'
      })
    }

    if (isDevelopment) {
      console.log('🔙 [Middleware] Redirecting authenticated user to dashboard')
    }
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Special handling for auth callback
  if (pathname === '/auth/callback') {
    console.log('🔄 [Middleware] Auth callback request - allowing to proceed')
    return NextResponse.next()
  }

  console.log('✅ [Middleware] Request allowed to proceed:', {
    pathname,
    hasSession: !!session
  })

  // Add security headers
  const response = NextResponse.next()

  // Security headers
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
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}