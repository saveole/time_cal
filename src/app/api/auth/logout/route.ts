import { NextRequest, NextResponse } from 'next/server'
import { extractUserFromRequest } from '@/lib/auth'

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

export async function POST(request: NextRequest) {
  try {
    console.log('🚪 [API] /api/auth/logout called')

    // Verify user is authenticated (optional - allows us to log who is logging out)
    const user = extractUserFromRequest(request)
    if (user) {
      console.log('👤 [API] Logging out user:', user.githubUsername)
    } else {
      console.log('🚫 [API] Logout request without valid authentication')
    }

    // Return success - client-side will handle localStorage cleanup
    return NextResponse.json({
      success: true,
      message: 'Logout successful. Please clear localStorage token on client side.'
    })
  } catch (error) {
    console.error('💥 [API] 登出错误:', error)
    return NextResponse.json(
      { error: '登出失败' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // 处理基于重定向的 GET 请求登出
  try {
    console.log('🔄 [API] GET logout request - redirecting')

    // For backward compatibility, still clear cookies if they exist
    const response = NextResponse.redirect(`${BASE_URL}/auth/login`)

    response.cookies.delete('auth_token')
    response.cookies.delete('oauth_session')
    response.cookies.delete('oauth_state')

    return response
  } catch (error) {
    console.error('💥 [API] 登出重定向错误:', error)
    return NextResponse.redirect(`${BASE_URL}/auth/login?error=logout_failed`)
  }
}