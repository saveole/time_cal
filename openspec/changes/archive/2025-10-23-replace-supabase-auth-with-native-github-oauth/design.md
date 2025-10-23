# Design: Native GitHub OAuth2 Authentication

## Current Architecture
```
Client App → Supabase Auth → GitHub OAuth → Session Management → Database
```

## Target Architecture
```
Client App → Next.js OAuth Handler → GitHub OAuth → JWT Session → Database
```

## Key Design Decisions

### 1. OAuth Flow Implementation
- Use Next.js App Router API routes for OAuth handling
- Implement standard GitHub OAuth2 Authorization Code flow
- Store access tokens securely (httpOnly cookies)
- Refresh tokens handled automatically

### 2. Session Management
- Replace Supabase sessions with JWT tokens
- Use httpOnly cookies for session storage
- Implement middleware for session validation
- Simple session refresh mechanism

### 3. Database Strategy
- Keep existing database for user data and activities
- Remove Supabase auth-related tables
- Create simple users table linked to GitHub ID
- Maintain data migration path

### 4. Security Considerations
- CSRF protection using state parameters
- Secure cookie handling (httpOnly, secure, sameSite)
- PKCE (Proof Key for Code Exchange) implementation
- Proper token validation and refresh

## Implementation Components

### 1. GitHub OAuth Setup
- GitHub App configuration
- Environment variables for client ID/secret
- OAuth callback URL configuration

### 2. API Routes
- `/api/auth/github` - Initiate OAuth flow
- `/api/auth/callback` - Handle OAuth callback
- `/api/auth/refresh` - Refresh tokens
- `/api/auth/logout` - Clear session

### 3. Client-side Changes
- Simplified auth context
- Remove Supabase auth dependencies
- Update login/logout functionality
- Maintain protected route logic

### 4. Database Schema Updates
- New users table with GitHub user data
- Migration script for existing users
- Remove Supabase auth schema dependencies

## Migration Strategy
1. Implement new OAuth flow alongside existing
2. Migrate user data to new schema
3. Switch authentication logic
4. Remove Supabase auth dependencies
5. Clean up unused code and dependencies

## Benefits
- Reduced complexity and dependencies
- Faster authentication flow
- Better control over session management
- Lower maintenance overhead
- Simplified debugging and monitoring