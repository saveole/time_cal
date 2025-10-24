# Design: Complete Supabase Backend Integration

## Architecture Overview

### Current Database Schema
The system uses PostgreSQL with the following main tables:
- `profiles` - User profiles with auth integration
- `activities` - Time tracking entries
- `sleep_records` - Sleep tracking data
- `activity_categories` - User-defined activity categories
- `goals` - Time tracking goals
- `user_preferences` - User settings and preferences

### Authentication Architecture
```
Frontend → GitHub OAuth → JWT Tokens → API Routes → Supabase (RLS)
```
- Authentication handled via GitHub OAuth
- JWT tokens stored in localStorage for session management
- Row Level Security (RLS) policies enforce data isolation
- API routes validate tokens before database operations

## Design Decisions

### 1. Database Access Pattern
**Decision**: Use service layer pattern with centralized Supabase client

**Rationale**:
- Consistent error handling and logging
- Centralized connection management
- Easy to add caching and retry logic
- Type safety with TypeScript interfaces

### 2. Real-time Synchronization
**Decision**: Implement Supabase real-time subscriptions

**Rationale**:
- Automatic data synchronization across devices
- Reduced need for manual refresh
- Better user experience for collaborative features
- Built-in conflict resolution

### 3. Security Model
**Decision**: Maintain RLS policies with JWT-based authentication

**Rationale**:
- Data isolation at database level
- No reliance on application-level security
- Auditable access patterns
- Scalable security model

## Implementation Strategy

### Phase 1: Schema Updates
- Add GitHub OAuth fields to profiles table
- Create migration for missing indexes
- Update RLS policies for new fields

### Phase 2: Service Implementation
- Implement GoalsService
- Implement UserPreferencesService
- Implement ProfileService
- Add real-time subscription management

### Phase 3: Integration & Testing
- Integrate services with existing frontend
- Add error handling and retry mechanisms
- Implement real-time UI updates
- Performance testing and optimization

## Technical Considerations

### Error Handling
- Service-level error boundaries
- Retry mechanisms for network failures
- User-friendly error messages
- Logging for debugging

### Performance
- Indexed queries for common operations
- Pagination for large datasets
- Connection pooling via Supabase
- Local caching for offline support

### Security
- Input validation at service level
- SQL injection prevention via parameterized queries
- Rate limiting considerations
- Secure token handling

## Future Extensibility

### Database Schema
The current schema supports future additions:
- Custom fields in activities
- Goal sharing/collaboration
- Advanced analytics and reporting
- Third-party integrations

### Service Layer
Modular design allows for:
- New service implementations
- Plugin architecture for custom features
- API versioning
- Multi-tenant support