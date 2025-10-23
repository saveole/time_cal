# Implement localStorage Bearer Token Authentication

## Why
The current authentication system uses HTTP-only cookies to store JWT tokens, which creates unnecessary request overhead and limits flexibility for certain client architectures.

## What Changes
- Modify client-side authentication to use localStorage for token storage instead of cookies
- Update API endpoints to accept Bearer token in Authorization header instead of cookie extraction
- Update AuthContext to use localStorage for token management
- Modify sign-out flow to clear localStorage tokens
- Update API request utilities to include Bearer token headers and remove cookie credentials

## Impact
- Affected specs: token-storage, bearer-auth
- Affected code: src/contexts/auth-context.tsx, src/lib/auth.ts, src/app/api/auth/* routes
- **BREAKING**: Changes authentication storage mechanism from cookies to localStorage