## Context
Current system uses Next.js monolithic architecture with Supabase BaaS. The application handles time tracking, daily planning, statistics, and authentication. Growing performance requirements and team scaling needs demand better separation of concerns and independent deployability.

### Current Architecture
- Frontend: Next.js with React, TypeScript, TailwindCSS
- Backend: Next.js API routes + Supabase
- Database: Supabase PostgreSQL
- Auth: Supabase Auth + JWT tokens
- State: React hooks + local storage

## Goals / Non-Goals
- Goals:
  - Independent frontend and backend deployment
  - Leverage Go for high-performance API
  - Modern React ecosystem with TanStack
  - Better developer experience with Vite
  - Comprehensive API documentation
  - Container-based deployment
- Non-Goals:
  - Complete UI redesign (keep current functionality)
  - Database migration (keep PostgreSQL)
  - Business logic changes (maintain existing features)

## Decisions
- **Decision**: Use Vite + React instead of Next.js
  - Rationale: Better build performance, simpler setup, better fits SPA pattern
  - Alternatives considered: CRA (deprecated), Parcel (less ecosystem)

- **Decision**: Use Go with Gin framework for backend
  - Rationale: High performance, simple deployment, strong concurrency
  - Alternatives considered: Node.js (current stack), Python Django (heavier), Rust (complexer)

- **Decision**: Use TanStack ecosystem (Query, Router, Form)
  - Rationale: Mature, well-maintained, excellent TypeScript support
  - Alternatives considered: SWR, React Query (legacy), custom solutions

- **Decision**: Custom JWT authentication instead of Supabase Auth
  - Rationale: Full control, simpler auth flow, no external dependencies
  - Alternatives considered: Supabase (limiting), Auth0 (costly), custom OAuth

## Risks / Trade-offs
- **Risk**: Complexity increase from two separate codebases
  - Mitigation: Clear API contracts, comprehensive testing, documentation

- **Risk**: Data migration challenges
  - Mitigation: Migration scripts, backup strategy, gradual rollout

- **Trade-off**: Development overhead vs long-term benefits
  - Acceptable given scalability and team size growth

- **Risk**: API contract management
  - Mitigation: OpenAPI spec, versioning, backward compatibility

## Migration Plan
1. **Phase 1**: Set up Go backend with core API endpoints
2. **Phase 2**: Migrate authentication system
3. **Phase 3**: Create Vite+React frontend shell
4. **Phase 4**: Migrate features incrementally
5. **Phase 5**: Data migration and testing
6. **Phase 6**: Deployment and monitoring setup

### Rollback Strategy
- Keep Next.js version running during migration
- Database backups before migration
- Feature flags for gradual rollout
- Monitoring and alerting for early detection

## Open Questions
- Should API and frontend be in separate repositories?
- What's the preferred database connection approach (direct connection vs pool)?
- Should we implement GraphQL or stick with REST?
- How to handle file uploads and storage?
- What's the deployment target (cloud provider, containers)?