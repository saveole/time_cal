# Replace Supabase Auth with Native GitHub OAuth2

## Why
The current authentication system uses Supabase Auth which adds unnecessary complexity and overhead. We want to simplify the authentication stack by implementing a direct GitHub OAuth2 flow that:

- Removes dependency on Supabase Auth services
- Reduces complexity in the authentication flow
- Maintains the same user experience with GitHub login
- Simplifies the codebase and reduces maintenance overhead
- Eliminates external authentication service dependencies

## What Changes
- **BREAKING**: Remove all Supabase Auth dependencies and code
- Implement native GitHub OAuth2 flow using Next.js auth patterns
- Replace Supabase session management with JWT-based session handling
- Update authentication context to use simple GitHub OAuth
- Remove email/password authentication completely
- Update database schema to remove Supabase auth tables
- Maintain existing user data and activity tracking
- Update environment configuration for GitHub OAuth

## Impact
- **Affected specs**: user-auth (major modification)
- **Dependencies**: Remove @supabase/supabase-js and @supabase/auth-helpers-nextjs
- **Code changes**:
  - Authentication context (`src/contexts/auth-context.tsx`) - complete rewrite
  - Supabase client (`src/lib/supabase.ts`) - remove auth components
  - Login page (`src/app/auth/login/page.tsx`) - update for new OAuth flow
  - Auth callback (`src/app/auth/callback/page.tsx`) - rewrite for GitHub OAuth
  - Protected routes and middleware - update for new session handling
  - Database connection - keep for data, remove auth parts
  - Environment configuration - update for GitHub OAuth

## Migration Notes
- Existing user accounts linked to GitHub will be preserved via GitHub ID
- User data in the database will be maintained
- Session management will transition from Supabase to JWT
- Authentication state management will be simplified