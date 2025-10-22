## ADDED Requirements
### Requirement: Time Usage Dashboard
The system SHALL provide a comprehensive dashboard showing time usage statistics.

#### Scenario: View daily time breakdown
- **WHEN** user opens the statistics overview
- **THEN** the system SHALL display a pie chart showing work vs free time distribution
- **AND** the system SHALL show total hours recorded for the current day

#### Scenario: Weekly time trends
- **WHEN** user navigates to weekly view
- **THEN** the system SHALL display a line chart showing daily work hours over the week
- **AND** the system SHALL show weekly totals for work and free time

#### Scenario: Monthly productivity analysis
- **WHEN** user views monthly statistics
- **THEN** the system SHALL calculate and display average daily work hours
- **AND** the system SHALL show most productive days of the week

### Requirement: Activity Insights
The system SHALL provide insights into activity patterns and productivity.

#### Scenario: Identify time usage patterns
- **WHEN** sufficient data is collected (14+ days)
- **THEN** the system SHALL identify peak productivity hours
- **AND** the system SHALL suggest optimal work schedules

#### Scenario: Activity frequency analysis
- **WHEN** user reviews their activity history
- **THEN** the system SHALL show most frequent work activities
- **AND** the system SHALL show most common free time activities

### Requirement: Goal Tracking and Progress
The system SHALL track user goals and show progress toward time management objectives.

#### Scenario: Set weekly work hour goals
- **WHEN** user wants to improve productivity
- **THEN** the system SHALL allow setting weekly work hour targets
- **AND** the system SHALL show progress bars toward these goals

#### Scenario: Achievement notifications
- **WHEN** user reaches daily or weekly goals
- **THEN** the system SHALL display achievement notifications
- **AND** the system SHALL track consecutive goal achievement streaks

### Requirement: Export and Reporting
The system SHALL allow users to export their time data for external analysis.

#### Scenario: Export time logs
- **WHEN** user wants to analyze data externally
- **THEN** the system SHALL allow exporting time logs in CSV format
- **AND** the system SHALL include all activity details and timestamps

#### Scenario: Generate summary reports
- **WHEN** user needs summary reports
- **THEN** the system SHALL generate weekly and monthly summary reports
- **AND** the system SHALL include key metrics and trends