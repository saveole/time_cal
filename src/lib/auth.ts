// 共享认证工具

export const JWT_SECRET = process.env.NEXTAUTH_SECRET
export const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000'

export interface JWTPayload {
  userId: string
  githubId: number
  githubUsername: string
  email?: string
  name?: string
  avatarUrl?: string
  iat: number
  exp: number
}

export interface User {
  id: string
  githubId: number
  githubUsername: string
  email?: string
  name?: string
  avatarUrl?: string
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET 未配置')
    }
    return require('jsonwebtoken').verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

export function extractUserFromRequest(request: Request): User | null {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split('=')
    acc[name] = value
    return acc
  }, {} as Record<string, string>)

  const token = cookies['auth_token']
  if (!token) return null

  const payload = verifyJWT(token)
  if (!payload) return null

  return {
    id: payload.userId,
    githubId: payload.githubId,
    githubUsername: payload.githubUsername,
    email: payload.email,
    name: payload.name,
    avatarUrl: payload.avatarUrl,
  }
}