'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { authLogger } from '@/lib/auth-logger'

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signInWithGitHub: () => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  updatePassword: (newPassword: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🚀 [Auth] Initializing AuthContext')

    // Get initial session
    const getInitialSession = async () => {
      console.log('🔍 [Auth] Checking for existing session...')

      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('❌ [Auth] Error getting initial session:', {
            error: error.message,
            code: error.status
          })
        } else {
          console.log('✅ [Auth] Initial session retrieved:', {
            hasSession: !!session,
            userId: session?.user?.id,
            email: session?.user?.email,
            provider: session?.user?.app_metadata?.provider,
            sessionValid: !!session && !!session.user
          })

          // Only set user if session is valid
          if (session && session.user) {
            setSession(session)
            setUser(session.user)
            console.log('👤 [Auth] User state set from session:', {
              userId: session.user.id,
              email: session.user.email
            })
          } else {
            console.log('🚫 [Auth] No valid session found, clearing user state')
            setSession(null)
            setUser(null)
          }
        }
      } catch (error) {
        console.error('💥 [Auth] Unexpected error during session check:', error)
        setSession(null)
        setUser(null)
      }

      console.log('⏳ [Auth] Initial session check completed, setting loading to false')
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    console.log('👂 [Auth] Setting up auth state change listener')
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 [Auth] Auth state changed:', {
        event,
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        provider: session?.user?.app_metadata?.provider,
        timestamp: new Date().toISOString()
      })

      // Log specific events with more details
      switch (event) {
        case 'SIGNED_IN':
          authLogger.authFlowSuccess(
            session?.user?.app_metadata?.provider || 'unknown',
            session?.user?.id || 'unknown',
            {
              email: session?.user?.email,
              provider: session?.user?.app_metadata?.provider,
              isNewUser: !session?.user?.last_sign_in_at ||
                       (new Date(session.user.last_sign_in_at).getTime() === new Date(session.user.created_at).getTime())
            }
          )
          if (session && session.user) {
            setSession(session)
            setUser(session.user)
          }
          break

        case 'SIGNED_OUT':
          authLogger.sessionStateChanged('SIGNED_OUT', session)
          setSession(null)
          setUser(null)
          break

        case 'TOKEN_REFRESHED':
          authLogger.sessionStateChanged('TOKEN_REFRESHED', session)
          if (session && session.user) {
            setSession(session)
            setUser(session.user)
          }
          break

        case 'USER_UPDATED':
          authLogger.sessionStateChanged('USER_UPDATED', session)
          if (session && session.user) {
            setSession(session)
            setUser(session.user)
          }
          break

        default:
          authLogger.sessionStateChanged(event, session)
          if (session && session.user) {
            setSession(session)
            setUser(session.user)
          } else {
            setSession(null)
            setUser(null)
          }
      }

      setLoading(false)
    })

    return () => {
      console.log('🔇 [Auth] Cleaning up auth state listener')
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      console.error('Sign in error:', error)
      return { error }
    }
  }

  const signInWithGitHub = async () => {
    authLogger.authFlowStart('github', {
      pathname: window.location.pathname,
      timestamp: new Date().toISOString()
    })

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        authLogger.authFlowError('github', error, {
          pathname: window.location.pathname
        })
        return { error }
      }

      if (data?.url) {
        authLogger.oauthUrlGenerated(data.url, 'github')
        authLogger.userInteraction('redirect_to_github', {
          pathname: window.location.pathname
        })
      }

      return { error: null }
    } catch (error) {
      authLogger.authFlowError('github', error, {
        pathname: window.location.pathname
      })
      return { error }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      return { error }
    } catch (error) {
      console.error('Reset password error:', error)
      return { error }
    }
  }

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      return { error }
    } catch (error) {
      console.error('Update password error:', error)
      return { error }
    }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signInWithGitHub,
    signOut,
    resetPassword,
    updatePassword,
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