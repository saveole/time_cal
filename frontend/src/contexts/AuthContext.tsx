import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '../lib/api';
import { User, AuthTokens, LoginRequest, RegisterRequest } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Token management
  const saveTokens = (newTokens: AuthTokens) => {
    setTokens(newTokens);
    localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
  };

  const clearTokens = () => {
    setTokens(null);
    setUser(null);
    localStorage.removeItem('auth_tokens');
  };

  const getStoredTokens = (): AuthTokens | null => {
    const tokensStr = localStorage.getItem('auth_tokens');
    return tokensStr ? JSON.parse(tokensStr) : null;
  };

  // Check if token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedTokens = getStoredTokens();

        if (storedTokens && !isTokenExpired(storedTokens.accessToken)) {
          setTokens(storedTokens);

          // Fetch current user
          const userResponse = await apiClient.getCurrentUser();
          setUser(userResponse.data);
        } else if (storedTokens?.refreshToken) {
          // Try to refresh the token
          await refreshToken();
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!tokens) return;

    const refreshTokenInterval = setInterval(async () => {
      try {
        await refreshToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
        logout();
      }
    }, 50 * 60 * 1000); // Refresh every 50 minutes

    return () => clearInterval(refreshTokenInterval);
  }, [tokens]);

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.login(credentials.email, credentials.password);
      const { user: userData, tokens: newTokens } = response.data;

      setUser(userData);
      saveTokens(newTokens);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      setError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.register(userData.email, userData.password, userData.name);
      const { user: newUser, tokens: newTokens } = response.data;

      setUser(newUser);
      saveTokens(newTokens);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      setError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (tokens) {
        await apiClient.logout();
      }
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      clearTokens();
    }
  };

  const refreshToken = async () => {
    try {
      const currentTokens = getStoredTokens();
      if (!currentTokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.refreshToken(currentTokens.refreshToken);
      const newTokens = response.data;
      saveTokens(newTokens);

      // Fetch updated user data
      const userResponse = await apiClient.getCurrentUser();
      setUser(userResponse.data);
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearTokens();
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user && !!tokens,
    login,
    register,
    logout,
    refreshToken,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Protected route component
interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}