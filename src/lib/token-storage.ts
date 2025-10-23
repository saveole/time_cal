// Token storage utilities for localStorage-based authentication

const TOKEN_KEY = 'auth_token'

export interface TokenStorage {
  getToken(): string | null
  setToken(token: string): void
  clearToken(): void
  hasToken(): boolean
  isTokenExpired(): boolean
  isValidTokenFormat(token: string): boolean
}

/**
 * localStorage-based token storage implementation
 */
export const tokenStorage: TokenStorage = {
  /**
   * Get the stored JWT token from localStorage
   */
  getToken(): string | null {
    if (typeof window === 'undefined') {
      return null
    }

    try {
      const token = localStorage.getItem(TOKEN_KEY)

      // Additional security: validate token format before returning
      if (token && !this.isValidTokenFormat(token)) {
        console.warn('⚠️ [Security] Invalid token format detected, clearing token')
        this.clearToken()
        return null
      }

      return token
    } catch (error) {
      console.warn('Failed to get token from localStorage:', error)
      return null
    }
  },

  /**
   * Store JWT token in localStorage
   */
  setToken(token: string): void {
    if (typeof window === 'undefined') {
      return
    }

    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch (error) {
      console.error('Failed to set token in localStorage:', error)
    }
  },

  /**
   * Remove JWT token from localStorage
   */
  clearToken(): void {
    if (typeof window === 'undefined') {
      return
    }

    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch (error) {
      console.error('Failed to clear token from localStorage:', error)
    }
  },

  /**
   * Check if a token is currently stored
   */
  hasToken(): boolean {
    return !!this.getToken()
  },

  /**
   * Check if the stored token is expired
   */
  isTokenExpired(): boolean {
    const token = this.getToken()
    if (!token) {
      return true
    }

    try {
      // Parse JWT payload to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Math.floor(Date.now() / 1000)
      return payload.exp < currentTime
    } catch (error) {
      console.warn('Failed to parse token for expiration check:', error)
      return true // Assume expired if we can't parse it
    }
  },

  /**
   * Validate token format for security
   */
  isValidTokenFormat(token: string): boolean {
    return isValidJWTFormat(token)
  }
}

/**
 * Create Authorization header with Bearer token
 */
export function createAuthHeader(): { Authorization: string } | Record<string, never> {
  const token = tokenStorage.getToken()
  if (!token) {
    return {}
  }

  return {
    Authorization: `Bearer ${token}`
  }
}

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    const testKey = '__localStorage_test__'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Validate JWT token format for security
 */
function isValidJWTFormat(token: string): boolean {
  // JWT should have 3 parts separated by dots
  const parts = token.split('.')
  if (parts.length !== 3) {
    return false
  }

  try {
    // Check if header and payload are valid base64
    const header = JSON.parse(atob(parts[0]))
    const payload = JSON.parse(atob(parts[1]))

    // Basic structure validation
    return header.alg && header.typ === 'JWT' &&
           payload.userId && payload.githubId && payload.exp
  } catch (error) {
    return false
  }
}

/**
 * Enhanced security token validation
 */
export function validateTokenSecurity(token: string): { isValid: boolean; reason?: string } {
  if (!token) {
    return { isValid: false, reason: 'Token is empty' }
  }

  if (!isValidJWTFormat(token)) {
    return { isValid: false, reason: 'Invalid JWT format' }
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Math.floor(Date.now() / 1000)

    if (payload.exp < currentTime) {
      return { isValid: false, reason: 'Token has expired' }
    }

    // Check if token expires too far in the future (potential tampering)
    const maxExpiration = 24 * 60 * 60 // 24 hours
    if (payload.exp - currentTime > maxExpiration) {
      return { isValid: false, reason: 'Token expiration too far in future' }
    }

    return { isValid: true }
  } catch (error) {
    return { isValid: false, reason: 'Failed to parse token' }
  }
}