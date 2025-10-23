'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, verifyJWT } from '@/lib/auth'

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
    console.log('🚀 [Auth] Initializing JWT-based AuthContext')

    // Get initial session from JWT token
    const getInitialSession = async () => {
      console.log('🔍 [Auth] Checking for existing JWT session...')

      try {
        // Get JWT token from cookies
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        })

        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            console.log('✅ [Auth] JWT session validated:', {
              userId: data.user.id,
              githubUsername: data.user.githubUsername,
              email: data.user.email
            })
            setUser(data.user)
          } else {
            console.log('🚫 [Auth] No valid JWT session found')
            setUser(null)
          }
        } else {
          console.log('🚫 [Auth] JWT validation failed:', response.status)
          setUser(null)
        }
      } catch (error) {
        console.error('💥 [Auth] Unexpected error during JWT session check:', error)
        setUser(null)
      }

      console.log('⏳ [Auth] JWT session check completed, setting loading to false')
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
      // Call logout API to clear cookies
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })

      setUser(null)
      console.log('✅ [Auth] User signed out successfully')
    } catch (error) {
      console.error('❌ [Auth] Sign out error:', error)
      // Still clear user state even if API call fails
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