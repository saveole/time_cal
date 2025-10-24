## Why
The current Next.js monolithic architecture couples frontend and backend concerns, limiting scalability and technology flexibility. Separating frontend and backend will enable independent development, deployment, and scaling while allowing us to leverage Go's performance for the backend and React's ecosystem for the frontend.

## What Changes
- **BREAKING**: Replace Next.js with Vite+React frontend application
- **BREAKING**: Replace Supabase backend with custom Go REST API
- **BREAKING**: Add comprehensive API layer with OpenAPI specification
- Add modern frontend tooling: TanStack Query, Router, and Form
- Add shadcn/ui component library integration
- Migrate authentication from Supabase to custom JWT-based system
- Restructure project as separate frontend and backend repositories
- Add Docker containerization for deployment
- Implement API versioning and documentation

## Impact
- Affected specs:
  - `time-tracking` (API changes)
  - `daily-planning` (API changes)
  - `statistics-overview` (API changes)
  - `bearer-auth` (authentication system changes)
  - `token-storage` (frontend token management changes)
- Affected code:
  - All frontend components (migration to Vite)
  - All API routes (migration to Go)
  - Database layer (new implementation)
  - Authentication system (custom implementation)
  - Build and deployment configuration
- Migration considerations:
  - Data migration from Supabase
  - Frontend build process changes
  - API contract changes for existing consumers