## Why
Integrate GitHub OAuth authentication to provide users with a secure, passwordless login option and simplify the authentication flow while removing the traditional email registration system.

## What Changes
- Add GitHub OAuth login functionality
- Remove email/password registration system
- Update authentication context to support GitHub sign-in
- Remove user registration pages and related components
- Update login page to offer GitHub authentication
- **BREAKING**: Users can no longer register with email/password

## Impact
- Affected specs: user-auth (new capability)
- Affected code:
  - Authentication context (`src/contexts/auth-context.tsx`)
  - Login page (`src/app/auth/login/page.tsx`)
  - Header component (`src/components/layout/header.tsx`)
  - Registration page (removal: `src/app/auth/register/page.tsx`)
  - Supabase configuration for OAuth provider