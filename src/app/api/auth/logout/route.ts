import { NextRequest, NextResponse } from 'next/server'

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true })

    // 清除认证令牌 cookie
    response.cookies.delete('auth_token')

    // 清除任何剩余的 OAuth cookies
    response.cookies.delete('oauth_session')

    response.cookies.delete('oauth_state')

    return response
  } catch (error) {
    console.error('登出错误:', error)
    return NextResponse.json(
      { error: '登出失败' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // 处理基于重定向的 GET 请求登出
  try {
    const response = NextResponse.redirect(`${BASE_URL}/auth/login`)

    // 清除认证令牌 cookie
    response.cookies.delete('auth_token')

    // 清除任何剩余的 OAuth cookies
    response.cookies.delete('oauth_session')

    response.cookies.delete('oauth_state')

    return response
  } catch (error) {
    console.error('登出重定向错误:', error)
    return NextResponse.redirect(`${BASE_URL}/auth/login?error=logout_failed`)
  }
}