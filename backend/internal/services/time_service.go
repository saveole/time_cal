package services

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"time-cal-backend/internal/models"
)

type TimeService struct {
	db *gorm.DB
}

type TimeEntryRequest struct {
	Description string            `json:"description" binding:"required"`
	StartTime   time.Time         `json:"start_time" binding:"required"`
	EndTime     *time.Time        `json:"end_time"`
	Category    string            `json:"category" binding:"required"`
	Tags        []string          `json:"tags"`
}

type TimeEntryResponse struct {
	ID          uuid.UUID   `json:"id"`
	Description string      `json:"description"`
	StartTime   time.Time   `json:"start_time"`
	EndTime     *time.Time  `json:"end_time"`
	Duration    *int        `json:"duration"`
	Category    string      `json:"category"`
	Tags        []models.Tag `json:"tags"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
}

type TimeEntryListResponse struct {
	Entries []TimeEntryResponse `json:"entries"`
	Total   int64               `json:"total"`
	Page    int                 `json:"page"`
	Limit   int                 `json:"limit"`
}

type TimeQueryParams struct {
	Page     int    `form:"page,default=1"`
	Limit    int    `form:"limit,default=20"`
	Category string `form:"category"`
	DateFrom string `form:"date_from"`
	DateTo   string `form:"date_to"`
	Search   string `form:"search"`
}

func NewTimeService(db *gorm.DB) *TimeService {
	return &TimeService{db: db}
}

// CreateTimeEntry creates a new time entry for a user
func (s *TimeService) CreateTimeEntry(userID string, req TimeEntryRequest) (*TimeEntryResponse, error) {
	// Validate time range
	if req.EndTime != nil && req.EndTime.Before(req.StartTime) {
		return nil, fmt.Errorf("end time cannot be before start time")
	}

	// Parse user ID
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	// Create time entry
	entry := models.TimeEntry{
		UserID:      userUUID,
		Description: req.Description,
		StartTime:   req.StartTime,
		EndTime:     req.EndTime,
		Category:    req.Category,
	}

	// Handle tags
	if len(req.Tags) > 0 {
		tags, err := s.getOrCreateTags(req.Tags)
		if err != nil {
			return nil, fmt.Errorf("failed to process tags: %w", err)
		}
		entry.Tags = tags
	}

	// Save to database
	if err := s.db.Create(&entry).Error; err != nil {
		return nil, fmt.Errorf("failed to create time entry: %w", err)
	}

	// Load tags with full details
	if err := s.db.Preload("Tags").First(&entry, entry.ID).Error; err != nil {
		return nil, fmt.Errorf("failed to load time entry with tags: %w", err)
	}

	return s.toTimeEntryResponse(&entry), nil
}

// GetTimeEntries retrieves time entries for a user with filtering and pagination
func (s *TimeService) GetTimeEntries(userID string, params TimeQueryParams) (*TimeEntryListResponse, error) {
	// Parse user ID
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	// Build query
	query := s.db.Model(&models.TimeEntry{}).Where("user_id = ?", userUUID).Preload("Tags")

	// Apply filters
	if params.Category != "" {
		query = query.Where("category = ?", params.Category)
	}

	if params.DateFrom != "" {
		if dateFrom, err := time.Parse("2006-01-02", params.DateFrom); err == nil {
			query = query.Where("start_time >= ?", dateFrom)
		}
	}

	if params.DateTo != "" {
		if dateTo, err := time.Parse("2006-01-02", params.DateTo); err == nil {
			query = query.Where("start_time <= ?", dateTo.Add(24*time.Hour-time.Second))
		}
	}

	if params.Search != "" {
		query = query.Where("description ILIKE ?", "%"+params.Search+"%")
	}

	// Count total entries
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count time entries: %w", err)
	}

	// Apply pagination
	offset := (params.Page - 1) * params.Limit
	if err := query.Offset(offset).Limit(params.Limit).Order("start_time DESC").Find(&[]models.TimeEntry{}).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch time entries: %w", err)
	}

	// Get the actual entries
	var entries []models.TimeEntry
	if err := query.Offset(offset).Limit(params.Limit).Order("start_time DESC").Find(&entries).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch time entries: %w", err)
	}

	// Convert to response format
	var entryResponses []TimeEntryResponse
	for _, entry := range entries {
		entryResponses = append(entryResponses, *s.toTimeEntryResponse(&entry))
	}

	return &TimeEntryListResponse{
		Entries: entryResponses,
		Total:   total,
		Page:    params.Page,
		Limit:   params.Limit,
	}, nil
}

// GetTimeEntry retrieves a specific time entry by ID
func (s *TimeService) GetTimeEntry(userID, entryID string) (*TimeEntryResponse, error) {
	// Parse IDs
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	entryUUID, err := uuid.Parse(entryID)
	if err != nil {
		return nil, fmt.Errorf("invalid entry ID: %w", err)
	}

	// Find time entry
	var entry models.TimeEntry
	if err := s.db.Where("id = ? AND user_id = ?", entryUUID, userUUID).Preload("Tags").First(&entry).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("time entry not found")
		}
		return nil, fmt.Errorf("failed to fetch time entry: %w", err)
	}

	return s.toTimeEntryResponse(&entry), nil
}

// UpdateTimeEntry updates an existing time entry
func (s *TimeService) UpdateTimeEntry(userID, entryID string, req TimeEntryRequest) (*TimeEntryResponse, error) {
	// Parse IDs
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	entryUUID, err := uuid.Parse(entryID)
	if err != nil {
		return nil, fmt.Errorf("invalid entry ID: %w", err)
	}

	// Validate time range
	if req.EndTime != nil && req.EndTime.Before(req.StartTime) {
		return nil, fmt.Errorf("end time cannot be before start time")
	}

	// Find existing entry
	var entry models.TimeEntry
	if err := s.db.Where("id = ? AND user_id = ?", entryUUID, userUUID).First(&entry).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("time entry not found")
		}
		return nil, fmt.Errorf("failed to fetch time entry: %w", err)
	}

	// Update fields
	entry.Description = req.Description
	entry.StartTime = req.StartTime
	entry.EndTime = req.EndTime
	entry.Category = req.Category

	// Handle tags
	if len(req.Tags) > 0 {
		tags, err := s.getOrCreateTags(req.Tags)
		if err != nil {
			return nil, fmt.Errorf("failed to process tags: %w", err)
		}
		entry.Tags = tags
	} else {
		entry.Tags = []models.Tag{}
	}

	// Save changes
	if err := s.db.Save(&entry).Error; err != nil {
		return nil, fmt.Errorf("failed to update time entry: %w", err)
	}

	// Load updated entry with tags
	if err := s.db.Preload("Tags").First(&entry, entry.ID).Error; err != nil {
		return nil, fmt.Errorf("failed to load updated time entry: %w", err)
	}

	return s.toTimeEntryResponse(&entry), nil
}

// DeleteTimeEntry deletes a time entry
func (s *TimeService) DeleteTimeEntry(userID, entryID string) error {
	// Parse IDs
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %w", err)
	}

	entryUUID, err := uuid.Parse(entryID)
	if err != nil {
		return fmt.Errorf("invalid entry ID: %w", err)
	}

	// Delete entry
	result := s.db.Where("id = ? AND user_id = ?", entryUUID, userUUID).Delete(&models.TimeEntry{})
	if result.Error != nil {
		return fmt.Errorf("failed to delete time entry: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("time entry not found")
	}

	return nil
}

// Helper methods

func (s *TimeService) getOrCreateTags(tagNames []string) ([]models.Tag, error) {
	var tags []models.Tag

	for _, tagName := range tagNames {
		var tag models.Tag
		if err := s.db.Where("name = ?", tagName).First(&tag).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				// Create new tag
				tag = models.Tag{
					Name:  tagName,
					Color: generateColorForTag(tagName),
				}
				if err := s.db.Create(&tag).Error; err != nil {
					return nil, fmt.Errorf("failed to create tag %s: %w", tagName, err)
				}
			} else {
				return nil, fmt.Errorf("failed to find tag %s: %w", tagName, err)
			}
		}
		tags = append(tags, tag)
	}

	return tags, nil
}

func (s *TimeService) toTimeEntryResponse(entry *models.TimeEntry) *TimeEntryResponse {
	return &TimeEntryResponse{
		ID:          entry.ID,
		Description: entry.Description,
		StartTime:   entry.StartTime,
		EndTime:     entry.EndTime,
		Duration:    entry.Duration,
		Category:    entry.Category,
		Tags:        entry.Tags,
		CreatedAt:   entry.CreatedAt,
		UpdatedAt:   entry.UpdatedAt,
	}
}

func generateColorForTag(tagName string) string {
	// Simple color generation based on tag name hash
	colors := []string{
		"#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444",
		"#14b8a6", "#f97316", "#84cc16", "#06b6d4", "#ec4899",
	}

	hash := 0
	for _, char := range tagName {
		hash = hash*31 + int(char)
	}

	return colors[hash%len(colors)]
}