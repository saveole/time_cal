package services

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"time-cal-backend/internal/models"
)

type DailyPlanService struct {
	db *gorm.DB
}

type DailyPlanRequest struct {
	Date         string      `json:"date" binding:"required"`
	Activities   []Activity  `json:"activities"`
	Status       string      `json:"status"`
}

type Activity struct {
	ID            uuid.UUID `json:"id"`
	Description   string    `json:"description" binding:"required"`
	EstimatedTime int       `json:"estimated_time" binding:"required,min=1"` // in minutes
	ActualTime    *int      `json:"actual_time"`                           // in minutes
	Status        string    `json:"status"`                               // pending, in_progress, completed
	Category      string    `json:"category" binding:"required"`
	Priority      string    `json:"priority"`                             // low, medium, high
	Order         int       `json:"order" binding:"required,min=0"`
}

type DailyPlanResponse struct {
	ID                uuid.UUID      `json:"id"`
	Date              string         `json:"date"`
	Activities        []Activity     `json:"activities"`
	TotalEstimatedTime int            `json:"total_estimated_time"`
	TotalActualTime   int            `json:"total_actual_time"`
	Status            string         `json:"status"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
}

type ActivityResponse struct {
	ID            uuid.UUID `json:"id"`
	Description   string    `json:"description"`
	EstimatedTime int       `json:"estimated_time"`
	ActualTime    *int      `json:"actual_time"`
	Status        string    `json:"status"`
	Category      string    `json:"category"`
	Priority      string    `json:"priority"`
	Order         int       `json:"order"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type DailyPlanQueryParams struct {
	Page     int    `form:"page,default=1"`
	Limit    int    `form:"limit,default=20"`
	DateFrom string `form:"date_from"`
	DateTo   string `form:"date_to"`
	Status   string `form:"status"`
}

type UpdateActivityRequest struct {
	Description   string `json:"description"`
	EstimatedTime int    `json:"estimated_time" binding:"required,min=1"`
	ActualTime    *int   `json:"actual_time"`
	Status        string `json:"status"`
	Category      string `json:"category"`
	Priority      string `json:"priority"`
	Order         int    `json:"order"`
}

func NewDailyPlanService(db *gorm.DB) *DailyPlanService {
	return &DailyPlanService{db: db}
}

// CreateDailyPlan creates a new daily plan for a user
func (s *DailyPlanService) CreateDailyPlan(userID string, req DailyPlanRequest) (*DailyPlanResponse, error) {
	// Parse user ID
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	// Parse date
	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		return nil, fmt.Errorf("invalid date format, expected YYYY-MM-DD: %w", err)
	}

	// Check if plan already exists for this date
	var existingPlan models.DailyPlan
	if err := s.db.Where("user_id = ? AND date = ?", userUUID, date).First(&existingPlan).Error; err == nil {
		return nil, fmt.Errorf("daily plan already exists for this date")
	}

	// Calculate total estimated time
	totalEstimatedTime := 0
	for _, activity := range req.Activities {
		totalEstimatedTime += activity.EstimatedTime
	}

	// Create daily plan
	plan := models.DailyPlan{
		UserID:            userUUID,
		Date:              date,
		TotalEstimatedTime: totalEstimatedTime,
		Status:            req.Status,
	}

	// Start transaction
	tx := s.db.Begin()

	// Create plan
	if err := tx.Create(&plan).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create daily plan: %w", err)
	}

	// Create activities
	if len(req.Activities) > 0 {
		activities := make([]models.Activity, len(req.Activities))
		for i, activityReq := range req.Activities {
			activities[i] = models.Activity{
				DailyPlanID:   plan.ID,
				Description:   activityReq.Description,
				EstimatedTime: activityReq.EstimatedTime,
				ActualTime:    activityReq.ActualTime,
				Status:        activityReq.Status,
				Category:      activityReq.Category,
				Priority:      activityReq.Priority,
				Order:         activityReq.Order,
			}
		}

		if err := tx.Create(&activities).Error; err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("failed to create activities: %w", err)
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Load plan with activities
	return s.GetDailyPlan(userID, plan.ID.String())
}

// GetDailyPlans retrieves daily plans for a user with filtering and pagination
func (s *DailyPlanService) GetDailyPlans(userID string, params DailyPlanQueryParams) ([]DailyPlanResponse, int64, error) {
	// Parse user ID
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, 0, fmt.Errorf("invalid user ID: %w", err)
	}

	// Build query
	query := s.db.Model(&models.DailyPlan{}).Where("user_id = ?", userUUID).Preload("Activities")

	// Apply filters
	if params.DateFrom != "" {
		if dateFrom, err := time.Parse("2006-01-02", params.DateFrom); err == nil {
			query = query.Where("date >= ?", dateFrom)
		}
	}

	if params.DateTo != "" {
		if dateTo, err := time.Parse("2006-01-02", params.DateTo); err == nil {
			query = query.Where("date <= ?", dateTo)
		}
	}

	if params.Status != "" {
		query = query.Where("status = ?", params.Status)
	}

	// Count total plans
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count daily plans: %w", err)
	}

	// Apply pagination
	offset := (params.Page - 1) * params.Limit
	if params.Limit < 1 || params.Limit > 100 {
		params.Limit = 20
	}

	// Get plans with activities
	var plans []models.DailyPlan
	if err := query.Offset(offset).Limit(params.Limit).Order("date DESC").Find(&plans).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to fetch daily plans: %w", err)
	}

	// Convert to response format
	var planResponses []DailyPlanResponse
	for _, plan := range plans {
		planResponses = append(planResponses, *s.toDailyPlanResponse(&plan))
	}

	return planResponses, total, nil
}

// GetDailyPlan retrieves a specific daily plan by ID
func (s *DailyPlanService) GetDailyPlan(userID, planID string) (*DailyPlanResponse, error) {
	// Parse IDs
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	planUUID, err := uuid.Parse(planID)
	if err != nil {
		return nil, fmt.Errorf("invalid plan ID: %w", err)
	}

	// Find daily plan with activities
	var plan models.DailyPlan
	if err := s.db.Where("id = ? AND user_id = ?", planUUID, userUUID).
		Preload("Activities", func(db *gorm.DB) *gorm.DB {
			return db.Order("order ASC")
		}).First(&plan).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("daily plan not found")
		}
		return nil, fmt.Errorf("failed to fetch daily plan: %w", err)
	}

	return s.toDailyPlanResponse(&plan), nil
}

// UpdateDailyPlan updates an existing daily plan
func (s *DailyPlanService) UpdateDailyPlan(userID, planID string, req DailyPlanRequest) (*DailyPlanResponse, error) {
	// Parse IDs
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	planUUID, err := uuid.Parse(planID)
	if err != nil {
		return nil, fmt.Errorf("invalid plan ID: %w", err)
	}

	// Parse date
	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		return nil, fmt.Errorf("invalid date format, expected YYYY-MM-DD: %w", err)
	}

	// Calculate total estimated time
	totalEstimatedTime := 0
	for _, activity := range req.Activities {
		totalEstimatedTime += activity.EstimatedTime
	}

	// Start transaction
	tx := s.db.Begin()

	// Update daily plan
	updateData := map[string]interface{}{
		"date":                 date,
		"total_estimated_time": totalEstimatedTime,
		"status":               req.Status,
	}

	if err := tx.Model(&models.DailyPlan{}).Where("id = ? AND user_id = ?", planUUID, userUUID).Updates(updateData).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to update daily plan: %w", err)
	}

	// Delete existing activities
	if err := tx.Where("daily_plan_id = ?", planUUID).Delete(&models.Activity{}).Error; err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to delete existing activities: %w", err)
	}

	// Create new activities
	if len(req.Activities) > 0 {
		activities := make([]models.Activity, len(req.Activities))
		for i, activityReq := range req.Activities {
			activities[i] = models.Activity{
				DailyPlanID:   planUUID,
				Description:   activityReq.Description,
				EstimatedTime: activityReq.EstimatedTime,
				ActualTime:    activityReq.ActualTime,
				Status:        activityReq.Status,
				Category:      activityReq.Category,
				Priority:      activityReq.Priority,
				Order:         activityReq.Order,
			}
		}

		if err := tx.Create(&activities).Error; err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("failed to create activities: %w", err)
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Load updated plan
	return s.GetDailyPlan(userID, planID)
}

// DeleteDailyPlan deletes a daily plan
func (s *DailyPlanService) DeleteDailyPlan(userID, planID string) error {
	// Parse IDs
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return fmt.Errorf("invalid user ID: %w", err)
	}

	planUUID, err := uuid.Parse(planID)
	if err != nil {
		return fmt.Errorf("invalid plan ID: %w", err)
	}

	// Start transaction
	tx := s.db.Begin()

	// Delete activities first
	if err := tx.Where("daily_plan_id = ?", planUUID).Delete(&models.Activity{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete activities: %w", err)
	}

	// Delete daily plan
	result := tx.Where("id = ? AND user_id = ?", planUUID, userUUID).Delete(&models.DailyPlan{})
	if result.Error != nil {
		tx.Rollback()
		return fmt.Errorf("failed to delete daily plan: %w", result.Error)
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("daily plan not found")
	}

	return nil
}

// UpdateActivity updates a single activity within a daily plan
func (s *DailyPlanService) UpdateActivity(userID, planID, activityID string, req UpdateActivityRequest) (*ActivityResponse, error) {
	// Parse IDs
	_, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	planUUID, err := uuid.Parse(planID)
	if err != nil {
		return nil, fmt.Errorf("invalid plan ID: %w", err)
	}

	activityUUID, err := uuid.Parse(activityID)
	if err != nil {
		return nil, fmt.Errorf("invalid activity ID: %w", err)
	}

	// Update activity
	updateData := map[string]interface{}{
		"description":    req.Description,
		"estimated_time": req.EstimatedTime,
		"actual_time":    req.ActualTime,
		"status":         req.Status,
		"category":       req.Category,
		"priority":       req.Priority,
		"order":          req.Order,
	}

	result := s.db.Model(&models.Activity{}).
		Where("id = ? AND daily_plan_id = ?", activityUUID, planUUID).
		Updates(updateData)

	if result.Error != nil {
		return nil, fmt.Errorf("failed to update activity: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return nil, fmt.Errorf("activity not found")
	}

	// Get updated activity
	var activity models.Activity
	if err := s.db.First(&activity, activityUUID).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch updated activity: %w", err)
	}

	return s.toActivityResponse(&activity), nil
}

// GetDailyPlanByDate retrieves a daily plan by date for a user
func (s *DailyPlanService) GetDailyPlanByDate(userID, date string) (*DailyPlanResponse, error) {
	// Parse user ID
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	// Parse date
	parsedDate, err := time.Parse("2006-01-02", date)
	if err != nil {
		return nil, fmt.Errorf("invalid date format, expected YYYY-MM-DD: %w", err)
	}

	// Find daily plan with activities
	var plan models.DailyPlan
	if err := s.db.Where("user_id = ? AND date = ?", userUUID, parsedDate).
		Preload("Activities", func(db *gorm.DB) *gorm.DB {
			return db.Order("order ASC")
		}).First(&plan).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("daily plan not found")
		}
		return nil, fmt.Errorf("failed to fetch daily plan: %w", err)
	}

	return s.toDailyPlanResponse(&plan), nil
}

// Helper methods

func (s *DailyPlanService) toDailyPlanResponse(plan *models.DailyPlan) *DailyPlanResponse {
	activities := make([]Activity, len(plan.Activities))
	for i, activity := range plan.Activities {
		activities[i] = Activity{
			ID:            activity.ID,
			Description:   activity.Description,
			EstimatedTime: activity.EstimatedTime,
			ActualTime:    activity.ActualTime,
			Status:        activity.Status,
			Category:      activity.Category,
			Priority:      activity.Priority,
			Order:         activity.Order,
		}
	}

	return &DailyPlanResponse{
		ID:                plan.ID,
		Date:              plan.Date.Format("2006-01-02"),
		Activities:        activities,
		TotalEstimatedTime: plan.TotalEstimatedTime,
		TotalActualTime:   plan.TotalActualTime,
		Status:            plan.Status,
		CreatedAt:         plan.CreatedAt,
		UpdatedAt:         plan.UpdatedAt,
	}
}

func (s *DailyPlanService) toActivityResponse(activity *models.Activity) *ActivityResponse {
	return &ActivityResponse{
		ID:            activity.ID,
		Description:   activity.Description,
		EstimatedTime: activity.EstimatedTime,
		ActualTime:    activity.ActualTime,
		Status:        activity.Status,
		Category:      activity.Category,
		Priority:      activity.Priority,
		Order:         activity.Order,
		CreatedAt:     activity.CreatedAt,
		UpdatedAt:     activity.UpdatedAt,
	}
}