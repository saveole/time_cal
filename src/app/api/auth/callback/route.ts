import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { createProxyFetch, configureNodeProxy } from '@/lib/proxy-config'
import { profileService } from '@/lib/database/profiles'
import { supabase } from '@/lib/supabase'

// 强制动态渲染
export const dynamic = 'force-dynamic'

// GitHub OAuth 配置
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET
const JWT_SECRET = process.env.NEXTAUTH_SECRET
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

// 为 Node.js 运行时配置代理
configureNodeProxy()

// 创建支持代理的 fetch 函数
const proxyFetch = createProxyFetch()

interface GitHubUser {
  id: number
  login: string
  email: string | null
  name: string | null
  avatar_url: string | null
}

if (!JWT_SECRET) {
  throw new Error('NEXTAUTH_SECRET 环境变量是必需的')
}

async function getGitHubAccessToken(code: string): Promise<string> {
  console.log('Requesting GitHub access token via proxy if configured...')

  const tokenResponse = await proxyFetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Time-Cal-App/1.0',
    },
    body: new URLSearchParams({
      client_id: GITHUB_CLIENT_ID!,
      client_secret: GITHUB_CLIENT_SECRET!,
      code,
    }),
  })

  const tokenData = await tokenResponse.json()

  console.log('GitHub token response:', {
    status: tokenResponse.status,
    ok: tokenResponse.ok,
    hasAccessToken: !!tokenData.access_token,
    error: tokenData.error
  })

  if (!tokenResponse.ok) {
    throw new Error(`GitHub token error: ${tokenData.error_description || tokenData.error}`)
  }

  return tokenData.access_token
}

async function getGitHubUser(accessToken: string): Promise<GitHubUser> {
  console.log('如果配置了代理，将通过代理获取 GitHub 用户资料...')

  // 获取用户资料
  const userResponse = await proxyFetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'Time-Cal-App/1.0',
      'Accept': 'application/vnd.github.v3+json',
    },
  })

  if (!userResponse.ok) {
    console.error('获取 GitHub 用户资料失败:', {
      status: userResponse.status,
      statusText: userResponse.statusText
    })
    throw new Error(`获取 GitHub 用户资料失败: ${userResponse.status}`)
  }

  const userData = await userResponse.json()

  // 获取用户邮箱（GitHub 需要单独的 API 调用来获取主邮箱）
  console.log('获取 GitHub 用户邮箱...')
  const emailsResponse = await proxyFetch('https://api.github.com/user/emails', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': 'Time-Cal-App/1.0',
      'Accept': 'application/vnd.github.v3+json',
    },
  })

  let primaryEmail = userData.email
  if (emailsResponse.ok) {
    const emails = await emailsResponse.json()
    const primary = emails.find((email: any) => email.primary && email.verified)
    if (primary) {
      primaryEmail = primary.email
    }
  }

  console.log('GitHub 用户数据已获取:', {
    id: userData.id,
    login: userData.login,
    email: primaryEmail,
    name: userData.name,
    hasAvatar: !!userData.avatar_url
  })

  return {
    id: userData.id,
    login: userData.login,
    email: primaryEmail,
    name: userData.name,
    avatar_url: userData.avatar_url,
  }
}

async function createOrUpdateUser(githubUser: GitHubUser) {
  try {
    // Check if user exists by GitHub ID
    const existingProfile = await profileService.getProfileByGitHubId(githubUser.id)

    // Generate a UUID for the user if they don't exist
    const userId = existingProfile?.id || crypto.randomUUID()

    // Create or update profile with GitHub data
    const profile = await profileService.createOrUpdateGitHubProfile(userId, {
      github_username: githubUser.login,
      github_id: githubUser.id,
      auth_provider: 'github',
      email: githubUser.email,
      full_name: githubUser.name || githubUser.login,
      avatar_url: githubUser.avatar_url,
      timezone: 'UTC' // Default timezone, can be updated later
    })

    console.log('Profile created/updated successfully:', {
      userId: profile.id,
      githubUsername: profile.github_username,
      authProvider: profile.auth_provider
    })

    return {
      id: profile.id,
      github_id: profile.github_id,
      github_username: profile.github_username,
      email: profile.email,
      name: profile.full_name || profile.github_username,
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      last_login_at: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error creating/updating user profile:', error)
    throw new Error('Failed to create or update user profile')
  }
}

function generateJWT(user: any): string {
  const payload = {
    userId: user.id,
    githubId: user.github_id,
    githubUsername: user.github_username,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatar_url,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 小时
  }

  return jwt.sign(payload, JWT_SECRET!)
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    // 处理 OAuth 错误
    if (error) {
      console.error('GitHub OAuth 错误:', error)
      return NextResponse.redirect(
        `${BASE_URL}/auth/login?error=${encodeURIComponent(error)}`
      )
    }

    if (!code) {
      return NextResponse.redirect(
        `${BASE_URL}/auth/login?error=${encodeURIComponent('缺少授权码')}`
      )
    }

    // 验证状态参数
    const sessionId = request.cookies.get('oauth_session')?.value

    if (!sessionId) {
      return NextResponse.redirect(
        `${BASE_URL}/auth/login?error=${encodeURIComponent('无效的状态参数')}`
      )
    }

    // 用授权码交换访问令牌
    const accessToken = await getGitHubAccessToken(code)

    // 获取 GitHub 用户信息
    const githubUser = await getGitHubUser(accessToken)

    // 在数据库中创建或更新用户
    const user = await createOrUpdateUser(githubUser)

    // 生成 JWT
    const jwtToken = generateJWT(user)

    console.log('✅ [API] Generated JWT for user:', user.github_username)

    // 重定向到客户端回调页面，将 token 作为 URL 参数传递
    // 注意：这是一种临时传输方式，客户端应立即将 token 存储到 localStorage
    const callbackUrl = `${BASE_URL}/auth/callback?token=${encodeURIComponent(jwtToken)}`
    const response = NextResponse.redirect(callbackUrl)

    // 清除 OAuth cookies
    response.cookies.delete('oauth_session')
    response.cookies.delete('oauth_state')

    return response
  } catch (error) {
    console.error('OAuth 回调错误:', error)
    return NextResponse.redirect(
      `${BASE_URL}/auth/login?error=${encodeURIComponent('认证失败')}`
    )
  }
}