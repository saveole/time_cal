import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import crypto from 'crypto'
import { createProxyFetch, configureNodeProxy } from '@/lib/proxy-config'

// GitHub OAuth 配置
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

// 为 Node.js 运行时配置代理
configureNodeProxy()

// 创建支持代理的 fetch 函数
const proxyFetch = createProxyFetch()

// PKCE 验证器存储（生产环境中建议使用 Redis 或数据库）
const pkceStore = new Map<string, { verifier: string; expires: number }>()

// 清理过期的 PKCE 验证器
setInterval(() => {
  const now = Date.now()
  pkceStore.forEach((value, key) => {
    if (value.expires < now) {
      pkceStore.delete(key)
    }
  })
}, 60000) // 每分钟清理一次

export async function GET(request: NextRequest) {
  try {
    if (!GITHUB_CLIENT_ID) {
      return NextResponse.json(
        { error: 'GitHub OAuth 未配置' },
        { status: 500 }
      )
    }

    // 生成 PKCE 验证器和挑战码
    const verifier = crypto.randomBytes(32).toString('base64url')
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url')

    // 为 CSRF 保护生成状态参数
    const state = nanoid(32)

    // 存储 PKCE 验证器和状态（10分钟过期）
    const sessionId = nanoid()
    pkceStore.set(sessionId, {
      verifier,
      expires: Date.now() + 10 * 60 * 1000 // 10分钟
    })

    // 构建 GitHub OAuth URL
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: `${BASE_URL}/api/auth/callback`,
      scope: 'user:email read:user',
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256'
    })

    const githubUrl = `https://github.com/login/oauth/authorize?scope=user:email&client_id=${GITHUB_CLIENT_ID}&stat=${state}`

    // 设置安全的 HTTP-only cookie 来存储会话 ID 和状态
    const response = NextResponse.redirect(githubUrl)

    response.cookies.set('oauth_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60, // 10 minutes
      path: '/'
    })

    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60, // 10 minutes
      path: '/'
    })

    return response
  } catch (error) {
    console.error('OAuth 启动错误:', error)
    return NextResponse.json(
      { error: '启动 OAuth 流程失败' },
      { status: 500 }
    )
  }
}