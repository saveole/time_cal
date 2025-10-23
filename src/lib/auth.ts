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
  let token: string | null = null

  // First, try to extract token from Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
    console.log('🔑 [Auth] Extracted Bearer token from Authorization header')
  }

  // Fallback to cookie-based authentication for backward compatibility
  if (!token) {
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=')
        acc[name] = value
        return acc
      }, {} as Record<string, string>)

      token = cookies['auth_token']
      if (token) {
        console.log('🍪 [Auth] Extracted token from cookie (fallback method)')
      }
    }
  }

  if (!token) {
    console.log('🚫 [Auth] No authentication token found')
    return null
  }

  const payload = verifyJWT(token)
  if (!payload) {
    console.log('❌ [Auth] Token verification failed')
    return null
  }

  console.log('✅ [Auth] Token verified successfully for user:', payload.githubUsername)

  return {
    id: payload.userId,
    githubId: payload.githubId,
    githubUsername: payload.githubUsername,
    email: payload.email,
    name: payload.name,
    avatarUrl: payload.avatarUrl,
  }
}