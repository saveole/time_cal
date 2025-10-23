import { NextRequest, NextResponse } from 'next/server'
import { extractUserFromRequest } from '@/lib/auth'

// 强制动态渲染
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [API] /api/auth/me called')

    // Use the updated extractUserFromRequest that supports both Bearer tokens and cookies
    const user = extractUserFromRequest(request)

    if (!user) {
      console.log('🚫 [API] No valid authentication found in /api/auth/me')
      return NextResponse.json(
        { error: '无认证令牌或令牌无效' },
        { status: 401 }
      )
    }

    console.log('✅ [API] User authenticated in /api/auth/me:', user.githubUsername)

    return NextResponse.json({ user })
  } catch (error) {
    console.error('💥 [API] 获取用户信息错误:', error)
    return NextResponse.json(
      { error: '获取用户信息失败' },
      { status: 500 }
    )
  }
}