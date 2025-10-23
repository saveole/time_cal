# Token Storage Specification

## Purpose
Defines requirements for client-side token storage using localStorage.

## Requirements

### Requirement: The system SHALL store JWT tokens in browser localStorage instead of HTTP-only cookies.
The system SHALL store JWT tokens in browser localStorage instead of HTTP-only cookies.

#### Scenario: Store authentication token in localStorage
- **WHEN** the user successfully authenticates with GitHub OAuth
- **AND** the authentication callback receives a valid JWT token
- **THEN** the system SHALL store the token in localStorage using the key 'auth_token'
- **AND** the token SHALL be accessible via JavaScript for subsequent API requests

#### Scenario: Retrieve stored token for API requests
- **WHEN** the application needs to make an authenticated API request
- **AND** the user has an existing authentication session
- **THEN** the system SHALL retrieve the token from localStorage
- **AND** the token SHALL be included in the Authorization header as a Bearer token

#### Scenario: Clear token on sign out
- **WHEN** the user is authenticated and clicks sign out
- **AND** the sign out process is initiated
- **THEN** the system SHALL remove the token from localStorage
- **AND** all subsequent API requests SHALL be made without authentication

#### Scenario: Token persistence across browser sessions
- **WHEN** the user has authenticated and the browser is closed
- **AND** the user reopens the browser and visits the application
- **THEN** the system SHALL retrieve the token from localStorage
- **AND** the user SHALL remain authenticated if the token is still valid

#### Scenario: Handle missing or invalid tokens
- **WHEN** the application attempts to retrieve a token from localStorage
- **AND** no token exists or the token is malformed
- **THEN** the system SHALL treat the user as unauthenticated
- **AND** the user SHALL be redirected to the login flow

### Requirement: The AuthContext SHALL be updated to use localStorage instead of cookie-based authentication.
The AuthContext SHALL be updated to use localStorage instead of cookie-based authentication.

#### Scenario: Initialize authentication state from localStorage
- **WHEN** the application loads and the AuthContext initializes
- **AND** checking for existing authentication
- **THEN** the system SHALL look for tokens in localStorage instead of cookies
- **AND** the authentication state SHALL be set accordingly

#### Scenario: Update authentication after successful login
- **WHEN** the user completes the GitHub OAuth flow successfully
- **AND** the callback returns a valid JWT token
- **THEN** the AuthContext SHALL store the token in localStorage
- **AND** the user state SHALL be updated to reflect authentication

#### Scenario: Clear authentication state on sign out
- **WHEN** the user clicks sign out
- **AND** the sign out process completes
- **THEN** the AuthContext SHALL clear the token from localStorage
- **AND** the user state SHALL be set to null