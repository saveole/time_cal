## ADDED Requirements

### Requirement: Vite-based Development Environment
The frontend SHALL use Vite as the build tool and development server with hot module replacement.

#### Scenario: Development server startup
- **WHEN** running `npm run dev`
- **THEN** Vite development server starts with HMR enabled
- **AND** TypeScript compilation errors are displayed in browser

#### Scenario: Production build
- **WHEN** running `npm run build`
- **THEN** Vite creates optimized production build
- **AND** Assets are properly hashed and minified

### Requirement: TanStack Query Integration
The frontend SHALL use TanStack Query for server state management and caching.

#### Scenario: API data fetching
- **WHEN** components need data from API
- **THEN** TanStack Query handles caching, refetching, and error states
- **AND** Loading states are automatically managed

#### Scenario: Background refetching
- **WHEN** data is stale
- **THEN** TanStack Query automatically refetches in background
- **AND** UI updates with fresh data

### Requirement: TanStack Router Integration
The frontend SHALL use TanStack Router for client-side routing with TypeScript support.

#### Scenario: Route navigation
- **WHEN** user navigates between pages
- **THEN** TanStack Router handles route changes without page reload
- **AND** Route parameters are type-safe

#### Scenario: Route protection
- **WHEN** accessing protected routes
- **THEN** Router checks authentication status
- **AND** Redirects to login if not authenticated

### Requirement: shadcn/ui Component Library
The frontend SHALL integrate shadcn/ui component library with TailwindCSS styling.

#### Scenario: Component usage
- **WHEN** building UI components
- **THEN** shadcn/ui components are available and themeable
- **AND** Components follow accessibility best practices

#### Scenario: Theme customization
- **WHEN** customizing application theme
- **THEN** TailwindCSS and shadcn/ui configuration allows consistent theming

### Requirement: API Client Configuration
The frontend SHALL include a configured API client for communication with Go backend.

#### Scenario: API request
- **WHEN** making API calls
- **THEN** Client includes authentication headers
- **AND** Handles base URL configuration for different environments

#### Scenario: Error handling
- **WHEN** API returns error responses
- **THEN** Client standardizes error handling
- **AND** User-friendly error messages are displayed

## MODIFIED Requirements

### Requirement: Token Storage Management
Token storage SHALL be updated to work with custom JWT authentication system.

#### Scenario: Token persistence
- **WHEN** user logs in successfully
- **THEN** JWT tokens are stored securely in localStorage
- **AND** Tokens are automatically attached to API requests

#### Scenario: Token refresh
- **WHEN** JWT token expires
- **THEN** Client attempts automatic token refresh
- **AND** User is logged out if refresh fails

### Requirement: Authentication State Management
Authentication state management SHALL be adapted for custom API integration.

#### Scenario: Login flow
- **WHEN** user submits login form
- **THEN** Credentials are sent to Go backend API
- **AND** Authentication state is updated on success

#### Scenario: Logout flow
- **WHEN** user logs out
- **THEN** Local tokens are cleared
- **AND** Authentication state is reset
- **AND** User is redirected to login page