'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, verifyJWT } from '@/lib/auth'
import { tokenStorage, createAuthHeader, isLocalStorageAvailable } from '@/lib/token-storage'

type AuthContextType = {
  user: User | null
  loading: boolean
  signInWithGitHub: () => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🚀 [Auth] Initializing localStorage-based AuthContext')

    // Get initial session from JWT token in localStorage
    const getInitialSession = async () => {
      console.log('🔍 [Auth] Checking for existing JWT session in localStorage...')

      // Check if localStorage is available
      if (!isLocalStorageAvailable()) {
        console.warn('⚠️ [Auth] localStorage not available, user will need to sign in')
        setLoading(false)
        return
      }

      // Check if we have a token and if it's expired
      if (!tokenStorage.hasToken()) {
        console.log('🚫 [Auth] No token found in localStorage')
        setLoading(false)
        return
      }

      if (tokenStorage.isTokenExpired()) {
        console.log('⏰ [Auth] Token in localStorage is expired, clearing it')
        tokenStorage.clearToken()
        setLoading(false)
        return
      }

      try {
        // Validate token with server using Bearer token
        const headers = createAuthHeader()
        const response = await fetch('/api/auth/me', {
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            console.log('✅ [Auth] localStorage JWT session validated:', {
              userId: data.user.id,
              githubUsername: data.user.githubUsername,
              email: data.user.email
            })
            setUser(data.user)
          } else {
            console.log('🚫 [Auth] No valid JWT session found, clearing token')
            tokenStorage.clearToken()
            setUser(null)
          }
        } else {
          console.log('🚫 [Auth] JWT validation failed:', response.status)
          tokenStorage.clearToken()
          setUser(null)
        }
      } catch (error) {
        console.error('💥 [Auth] Unexpected error during JWT session check:', error)
        tokenStorage.clearToken()
        setUser(null)
      }

      console.log('⏳ [Auth] localStorage JWT session check completed, setting loading to false')
      setLoading(false)
    }

    getInitialSession()
  }, [])

  const signInWithGitHub = async () => {
    console.log('🔗 [Auth] Initiating GitHub OAuth flow')

    try {
      // Redirect to GitHub OAuth endpoint
      window.location.href = '/api/auth/github'
      return { error: null }
    } catch (error) {
      console.error('❌ [Auth] GitHub OAuth initiation error:', error)
      return { error }
    }
  }

  const signOut = async () => {
    console.log('🚪 [Auth] Signing out user')

    try {
      // Call logout API with Bearer token
      const headers = createAuthHeader()
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        }
      })

      // Clear localStorage token
      tokenStorage.clearToken()
      setUser(null)
      console.log('✅ [Auth] User signed out successfully')
    } catch (error) {
      console.error('❌ [Auth] Sign out error:', error)
      // Still clear user state and token even if API call fails
      tokenStorage.clearToken()
      setUser(null)
    }
  }

  const value = {
    user,
    loading,
    signInWithGitHub,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function useRequireAuth() {
  const auth = useAuth()

  useEffect(() => {
    if (!auth.loading && !auth.user) {
      // Redirect to login page or show login modal
      // For now, we'll just log it
      console.log('User not authenticated')
    }
  }, [auth.loading, auth.user])

  return auth
}