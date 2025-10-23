# Bearer Token Authentication Specification

## Purpose
Defines requirements for Bearer token authentication in API requests.

## Requirements

### Requirement: API endpoints SHALL accept JWT tokens via Authorization header using Bearer token scheme.
API endpoints SHALL accept JWT tokens via Authorization header using Bearer token scheme.

#### Scenario: Authenticate API request with Bearer token
- **WHEN** making an API request to a protected endpoint
- **AND** the user has a valid JWT token stored in localStorage
- **THEN** the request SHALL include an 'Authorization: Bearer <token>' header
- **AND** the server SHALL extract and validate the token from the header

#### Scenario: Server extracts token from Authorization header
- **WHEN** the server processes the request
- **AND** an API request arrives with an Authorization header
- **THEN** the system SHALL extract the token after 'Bearer ' prefix
- **AND** the extracted token SHALL be validated using existing JWT logic

#### Scenario: Handle missing Authorization header
- **WHEN** a request arrives at a protected API endpoint
- **AND** the request lacks an Authorization header
- **THEN** the server SHALL respond with 401 Unauthorized status
- **AND** the response SHALL indicate missing authentication token

#### Scenario: Handle invalid Bearer token format
- **WHEN** the server attempts to extract the token
- **AND** a request arrives with a malformed Authorization header
- **THEN** the server SHALL respond with 401 Unauthorized status
- **AND** the response SHALL indicate invalid token format

### Requirement: All protected API routes SHALL be updated to support Bearer token authentication.
All protected API routes SHALL be updated to support Bearer token authentication.

#### Scenario: /api/auth/me endpoint with Bearer token
- **WHEN** the request includes a Bearer token
- **AND** the AuthContext calls /api/auth/me to validate session
- **THEN** the endpoint SHALL extract the token from Authorization header instead of cookies
- **AND** the endpoint SHALL return user information if the token is valid

#### Scenario: /api/auth/logout endpoint with Bearer token
- **WHEN** the logout API is called with Bearer token
- **AND** the user initiates sign out
- **THEN** the endpoint SHALL validate the token from Authorization header
- **AND** the endpoint SHALL return success response for client-side token clearing

#### Scenario: Token validation in middleware
- **WHEN** checking authentication status
- **AND** the middleware processes incoming requests
- **THEN** the middleware SHALL check Authorization header for Bearer tokens
- **AND** authentication status SHALL be determined based on token validity

#### Scenario: API request utilities updated
- **WHEN** constructing request headers
- **AND** client-side code makes authenticated API calls
- **THEN** the utilities SHALL include Authorization header with Bearer token
- **AND** the request SHALL NOT include credentials: 'include' option

### Requirement: During transition, the system SHALL support both cookie and Bearer token authentication.
During transition, the system SHALL support both cookie and Bearer token authentication.

#### Scenario: Dual token support during migration
- **WHEN** the server processes authentication
- **AND** an API request arrives with both cookie and Bearer token
- **THEN** the Bearer token SHALL take precedence over cookie token
- **AND** the system SHALL validate tokens using the existing logic

#### Scenario: Fallback to cookie authentication
- **WHEN** the request contains authentication cookies
- **AND** an API request arrives without Bearer token
- **THEN** the system SHALL fall back to cookie-based authentication
- **AND** this fallback SHALL be removed after migration completes