// API client utilities for making authenticated requests

import { tokenStorage, createAuthHeader } from './token-storage'

export interface ApiRequestOptions extends RequestInit {
  requireAuth?: boolean
}

/**
 * Make an authenticated API request with Bearer token
 */
export async function apiRequest(
  url: string,
  options: ApiRequestOptions = {}
): Promise<Response> {
  const { requireAuth = true, ...fetchOptions } = options

  // Default headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  }

  // Add Authorization header if authentication is required
  if (requireAuth) {
    const authHeader = createAuthHeader()
    if (authHeader.Authorization) {
      ;(headers as Record<string, string>)['Authorization'] = authHeader.Authorization
    } else {
      // Token is missing, this will likely result in 401
      console.warn('⚠️ [API] No authentication token available for request to:', url)
    }
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      // Remove credentials option to avoid sending cookies
      credentials: undefined,
    })

    // Handle 401 Unauthorized by clearing token
    if (response.status === 401) {
      console.warn('🚫 [API] Received 401 Unauthorized, clearing token')
      tokenStorage.clearToken()
    }

    return response
  } catch (error) {
    console.error('💥 [API] Request failed:', error)
    throw error
  }
}

/**
 * Convenience methods for common HTTP operations
 */
export const apiClient = {
  get: (url: string, options?: ApiRequestOptions) =>
    apiRequest(url, { ...options, method: 'GET' }),

  post: (url: string, data?: any, options?: ApiRequestOptions) =>
    apiRequest(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: (url: string, data?: any, options?: ApiRequestOptions) =>
    apiRequest(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: (url: string, data?: any, options?: ApiRequestOptions) =>
    apiRequest(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: (url: string, options?: ApiRequestOptions) =>
    apiRequest(url, { ...options, method: 'DELETE' }),
}

/**
 * Make a request without authentication
 */
export async function publicRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  return apiRequest(url, { ...options, requireAuth: false })
}

/**
 * Check if user is authenticated based on token availability
 */
export function isAuthenticated(): boolean {
  return tokenStorage.hasToken() && !tokenStorage.isTokenExpired()
}