# localStorage Bearer Token Architecture Design

## Current Architecture
The system currently uses HTTP-only cookies to store JWT tokens:
- `auth_token` cookie stores the JWT
- API endpoints extract token from cookies
- AuthContext checks `/api/auth/me` to validate session

## Proposed Architecture

### Token Storage Strategy
- **localStorage**: Store JWT token in browser's localStorage
- **Key**: `auth_token` (same as current cookie name for consistency)
- **Persistence**: Tokens persist across browser sessions
- **Security**: Consider XSS implications (mitigated by HttpOnly cookie removal)

### Authentication Flow Changes

#### 1. Token Storage (Client-side)
```typescript
// New token storage utilities
export const tokenStorage = {
  getToken: () => localStorage.getItem('auth_token'),
  setToken: (token: string) => localStorage.setItem('auth_token', token),
  clearToken: () => localStorage.removeItem('auth_token'),
  hasToken: () => !!localStorage.getItem('auth_token')
}
```

#### 2. API Request Pattern
```typescript
// Updated API request pattern
const headers = {
  'Authorization': `Bearer ${tokenStorage.getToken()}`,
  'Content-Type': 'application/json'
}
```

#### 3. Server-side Token Extraction
```typescript
// Updated extractUserFromRequest function
function extractUserFromRequest(request: Request): User | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.substring(7)
  // Validate token and return user
}
```

### Component Updates

#### AuthContext Changes
- Remove `credentials: 'include'` from fetch calls
- Add Authorization header to fetch calls
- Update token retrieval to use localStorage
- Maintain same public API for components

#### API Route Updates
- Update `/api/auth/me` to check Authorization header instead of cookies
- Update `/api/auth/logout` to clear client-side localStorage token
- Update `/api/auth/callback` to return token to client for localStorage storage

### Security Considerations

#### XSS Protection
- Since localStorage is accessible via JavaScript, implement Content Security Policy
- Consider additional token validation on server-side
- Monitor for suspicious token usage

#### Token Validation
- Maintain existing JWT validation logic
- Add token expiration checking on client-side
- Implement automatic token refresh if needed

### Migration Strategy

#### Backward Compatibility
- During transition, support both cookie and Bearer token methods
- Prioritize Bearer token if both are present
- Gradually phase out cookie support

#### Client Migration
1. Update token storage utilities
2. Modify AuthContext to use localStorage
3. Update API request helpers
4. Test authentication flow end-to-end

#### Server Migration
1. Update token extraction in API routes
2. Add Bearer token support alongside cookie support
3. Update logout endpoint
4. Remove cookie dependencies once migration is complete

### Error Handling

#### Token Not Found
- Clear localStorage and redirect to login
- Handle expired tokens gracefully
- Provide clear error messages to users

#### Network Failures
- Maintain existing error handling patterns
- Add retry logic for token validation
- Handle offline scenarios appropriately

### Testing Strategy

#### Unit Tests
- Test token storage utilities
- Test token extraction functions
- Test API route updates

#### Integration Tests
- Test complete authentication flow
- Test token persistence across page refreshes
- Test sign-out functionality
- Test API requests with Bearer tokens

#### Security Tests
- Test XSS protection measures
- Test token validation and expiration
- Test unauthorized access prevention