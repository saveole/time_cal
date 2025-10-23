import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '@/lib/auth'

// 强制动态渲染
export const dynamic = 'force-dynamic'

interface JWTPayload {
  userId: string
  githubId: number
  githubUsername: string
  email?: string
  name?: string
  avatarUrl?: string
  iat: number
  exp: number
}

function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET!) as JWTPayload
  } catch (error) {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      return NextResponse.json(
        { error: '无认证令牌' },
        { status: 401 }
      )
    }

    const payload = verifyJWT(token)

    if (!payload) {
      return NextResponse.json(
        { error: '无效或已过期的令牌' },
        { status: 401 }
      )
    }

    // 返回用户信息（排除敏感数据）
    const user = {
      id: payload.userId,
      githubId: payload.githubId,
      githubUsername: payload.githubUsername,
      email: payload.email,
      name: payload.name,
      avatarUrl: payload.avatarUrl,
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('获取用户信息错误:', error)
    return NextResponse.json(
      { error: '获取用户信息失败' },
      { status: 500 }
    )
  }
}