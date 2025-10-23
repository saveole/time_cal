# localStorage Bearer Token Authentication Migration

## Overview

This document describes the migration from cookie-based JWT authentication to localStorage-based Bearer token authentication.

## What Changed

### Client-side Changes
- **Token Storage**: JWT tokens are now stored in `localStorage` under the key `auth_token` instead of HTTP-only cookies
- **API Requests**: All authenticated API requests now use `Authorization: Bearer <token>` headers instead of relying on cookies
- **AuthContext**: Updated to use localStorage for token management and Bearer tokens for API calls
- **OAuth Flow**: The OAuth callback now returns the token via URL parameter to the client for localStorage storage

### Server-side Changes
- **Token Extraction**: Updated to prioritize Bearer tokens from Authorization header with cookie fallback for backward compatibility
- **API Endpoints**: Modified `/api/auth/me` and `/api/auth/logout` to work with Bearer tokens
- **Security**: Added enhanced token validation and security checks

## Benefits

1. **Reduced Request Overhead**: No automatic cookie sending with every request
2. **Better Client Control**: Tokens are explicitly managed by the client application
3. **Improved Security**: Enhanced token validation and format checking
4. **Flexibility**: Better support for different client architectures

## Migration Guide

### For Developers

#### Making Authenticated API Requests

**Before (cookies):**
```typescript
fetch('/api/auth/me', {
  credentials: 'include'
})
```

**After (Bearer token):**
```typescript
import { apiClient } from '@/lib/api-client'

// Automatic token handling
const response = await apiClient.get('/api/auth/me')

// Manual token handling
import { createAuthHeader } from '@/lib/token-storage'
const response = await fetch('/api/auth/me', {
  headers: createAuthHeader()
})
```

#### Token Management

```typescript
import { tokenStorage } from '@/lib/token-storage'

// Check if user is authenticated
if (tokenStorage.hasToken() && !tokenStorage.isTokenExpired()) {
  // User is authenticated
}

// Clear token on logout
tokenStorage.clearToken()

// Get token for API requests
const token = tokenStorage.getToken()
```

### For Users

- **Login Flow**: Unchanged - users still log in via GitHub OAuth
- **Session Persistence**: Tokens now persist across browser sessions via localStorage
- **Logout**: Improved logout reliability with explicit token clearing

## Security Considerations

### XSS Protection
- Since localStorage is accessible via JavaScript, ensure proper Content Security Policy (CSP) headers are implemented
- The system includes automatic token format validation and expiration checking

### Token Validation
- Client-side token expiration checking prevents use of expired tokens
- Server-side validation remains the authoritative source
- Enhanced token format validation prevents malformed token usage

### Migration Safety
- Backward compatibility maintained during transition period
- Cookie-based authentication still works as fallback
- Gradual migration path allows testing before full rollout

## Files Modified

### New Files
- `src/lib/token-storage.ts` - Token storage utilities
- `src/lib/api-client.ts` - Authenticated API client

### Modified Files
- `src/contexts/auth-context.tsx` - Updated to use localStorage
- `src/lib/auth.ts` - Updated token extraction logic
- `src/app/api/auth/me/route.ts` - Updated to support Bearer tokens
- `src/app/api/auth/logout/route.ts` - Updated logout logic
- `src/app/api/auth/callback/route.ts` - Modified to return token to client
- `src/app/auth/callback/page.tsx` - Updated to handle token storage

## Testing

### Manual Testing Steps
1. **Login Flow**: Test complete GitHub OAuth authentication
2. **Token Persistence**: Verify token persists across page refreshes
3. **API Requests**: Confirm authenticated requests work with Bearer tokens
4. **Logout**: Test sign-out functionality and token clearing
5. **Backward Compatibility**: Ensure existing cookie-based sessions still work during transition

### Build Verification
```bash
npm run build
npm run type-check
```

## Rollback Plan

If issues arise during deployment:
1. **Immediate**: The system maintains backward compatibility with cookies
2. **Temporary**: Disable localStorage usage in AuthContext
3. **Full**: Revert to cookie-only authentication by restoring previous versions

## Future Considerations

### Post-Migration Cleanup
After successful migration (estimated 2-4 weeks):
1. Remove cookie fallback logic from `extractUserFromRequest()`
2. Remove cookie clearing from logout endpoints
3. Update documentation to remove cookie references

### Potential Enhancements
1. **Token Refresh**: Implement automatic token refresh before expiration
2. **Multiple Tabs**: Sync authentication state across browser tabs
3. **Security Headers**: Implement additional security headers and CSP

## Support

For questions or issues during migration:
1. Check browser console for detailed error messages
2. Verify localStorage availability in browser privacy settings
3. Ensure no browser extensions are blocking localStorage
4. Review network requests for proper Authorization headers

## Status

- ✅ Implementation complete
- ✅ Build verification successful
- ✅ Backward compatibility maintained
- ✅ Security enhancements added
- ✅ Documentation created
- 🔄 Ready for production deployment with monitoring