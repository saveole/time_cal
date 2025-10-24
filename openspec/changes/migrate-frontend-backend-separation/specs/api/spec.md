## ADDED Requirements

### Requirement: RESTful API Contract
The system SHALL define a comprehensive RESTful API contract between frontend and backend.

#### Scenario: API endpoint consistency
- **WHEN** implementing API endpoints
- **THEN** All endpoints follow REST conventions
- **AND** HTTP status codes are used appropriately
- **AND** Response formats are consistent

#### Scenario: API versioning
- **WHEN** API changes are required
- **THEN** Versioning strategy is implemented
- **AND** Backward compatibility is maintained
- **AND** Deprecation notices are provided

### Requirement: OpenAPI Specification
The API SHALL be fully documented with OpenAPI 3.0 specification.

#### Scenario: Schema definitions
- **WHEN** defining data models
- **THEN** Schemas are documented in OpenAPI
- **AND** Field types and validations are specified
- **AND** Example values are provided

#### Scenario: Endpoint documentation
- **WHEN** documenting endpoints
- **THEN** Request/response examples are included
- **AND** Error responses are documented
- **AND** Authentication requirements are specified

### Requirement: Error Response Format
The API SHALL implement standardized error response format.

#### Scenario: Validation errors
- **WHEN** request validation fails
- **THEN** Error response includes field-level validation messages
- **AND** HTTP 400 status is returned
- **AND** Error codes are machine-readable

#### Scenario: Server errors
- **WHEN** unexpected errors occur
- **THEN** Error response includes error ID for tracking
- **AND** HTTP 500 status is returned
- **AND** Sensitive information is not leaked

### Requirement: Authentication API
The system SHALL provide dedicated authentication endpoints.

#### Scenario: User login
- **WHEN** POST /api/auth/login is called
- **THEN** Valid credentials return JWT tokens
- **AND** Token expiration time is included
- **AND** User profile data is returned

#### Scenario: Token refresh
- **WHEN** POST /api/auth/refresh is called
- **THEN** Valid refresh tokens return new access tokens
- **AND** Refresh token rotation is implemented
- **AND** Invalid tokens are rejected

### Requirement: CORS Configuration
The API SHALL properly configure CORS for frontend-backend communication.

#### Scenario: Preflight requests
- **WHEN** frontend sends OPTIONS requests
- **THEN** CORS headers allow required methods
- **AND** Allowed origins are configured
- **AND** Credential headers are supported

#### Scenario: Production CORS
- **WHEN** deployed to production
- **THEN** CORS is restricted to frontend domain
- **AND** Development origins are excluded
- **AND** Security headers are enforced

## REMOVED Requirements

### Requirement: Supabase Client Integration
**Reason**: Supabase is being replaced with custom Go backend
**Migration**: All Supabase client calls will be replaced with REST API calls to Go backend

### Requirement: Server-side Rendering Support
**Reason**: Moving to SPA architecture with Vite eliminates SSR requirements
**Migration**: Client-side rendering will handle all UI generation