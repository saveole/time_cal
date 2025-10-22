## MODIFIED Requirements
### Requirement: Activity Time Logging
The system SHALL allow users to record their daily work and free time activities with cloud storage and real-time synchronization.

#### Scenario: Log work activity
- **WHEN** user starts a work task
- **THEN** the system SHALL provide a React form with shadcn/ui components to enter activity description
- **AND** the system SHALL allow selection of activity category (work/project) using modern select components
- **AND** the system SHALL record the start time automatically and save to Supabase

#### Scenario: Complete work activity
- **WHEN** user finishes a work task
- **THEN** the system SHALL record the end time in Supabase
- **AND** the system SHALL calculate the duration of the activity using TypeScript utility functions
- **AND** the system SHALL update the activity list with React state management

#### Scenario: Log free time activity
- **WHEN** user engages in leisure activities
- **THEN** the system SHALL provide a responsive form optimized for mobile devices
- **AND** the system SHALL allow selection of activity category (leisure/personal) with autocomplete
- **AND** the system SHALL record start and end times with timezone handling

### Requirement: Daily Time Allocation
The system SHALL help users plan and track their daily time allocation with persistent cloud storage.

#### Scenario: Set daily work goals
- **WHEN** user plans their day
- **THEN** the system SHALL allow setting target work hours for the day using modern input components
- **AND** the system SHALL show progress toward the daily goal with animated progress bars
- **AND** the system SHALL store goals in Supabase user preferences

#### Scenario: Track work vs free time balance
- **WHEN** user views their daily summary
- **THEN** the system SHALL display total work hours completed fetched from Supabase
- **AND** the system SHALL display total free time hours with real-time updates
- **AND** the system SHALL show the work-life balance ratio using modern data visualization

### Requirement: Activity Categorization
The system SHALL provide categorization for different types of activities with enhanced UI and persistence.

#### Scenario: Create custom activity categories
- **WHEN** user wants to organize activities better
- **THEN** the system SHALL allow creating custom activity categories using a modal dialog
- **AND** the system SHALL support assigning colors to categories using a color picker
- **AND** the system SHALL store categories in Supabase with user-specific settings

#### Scenario: Filter activities by category
- **WHEN** user reviews their time logs
- **THEN** the system SHALL allow filtering activities by category using multi-select components
- **AND** the system SHALL show time spent per category with interactive charts
- **AND** the system SHALL maintain filter state in URL for sharing

## ADDED Requirements
### Requirement: Real-time Activity Tracking
The system SHALL provide real-time activity tracking with live updates across devices.

#### Scenario: Live activity timer
- **WHEN** user starts an activity
- **THEN** the system SHALL display a live timer showing elapsed time
- **AND** the system SHALL update the timer every second using React hooks
- **AND** the system SHALL sync the running activity status to Supabase

#### Scenario: Cross-device activity sync
- **WHEN** user starts an activity on one device
- **THEN** the system SHALL sync the activity status to all other devices
- **AND** the system SHALL allow stopping the activity from any logged-in device

### Requirement: Enhanced Activity Management
The system SHALL provide advanced features for managing and organizing activities.

#### Scenario: Activity templates
- **WHEN** user frequently logs similar activities
- **THEN** the system SHALL allow creating activity templates with pre-filled categories
- **AND** the system SHALL provide quick-start buttons for common activities
- **AND** the system SHALL store templates in user preferences in Supabase

#### Scenario: Activity search and filtering
- **WHEN** user wants to find past activities
- **THEN** the system SHALL provide search functionality with fuzzy matching
- **AND** the system SHALL allow filtering by date range, category, and keywords
- **AND** the system SHALL provide instant search results using debounced input