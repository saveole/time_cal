package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"time-cal-backend/internal/services"
)

type DailyPlanHandler struct {
	dailyPlanService *services.DailyPlanService
}

func NewDailyPlanHandler(db *gorm.DB) *DailyPlanHandler {
	return &DailyPlanHandler{
		dailyPlanService: services.NewDailyPlanService(db),
	}
}

// CreateDailyPlan creates a new daily plan
// @Summary Create daily plan
// @Description Create a new daily plan for the authenticated user
// @Tags daily-plans
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body services.DailyPlanRequest true "Daily plan request"
// @Success 201 {object} services.DailyPlanResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 409 {object} map[string]string
// @Router /api/v1/daily-plans [post]
func (h *DailyPlanHandler) CreateDailyPlan(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req services.DailyPlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set default status if not provided
	if req.Status == "" {
		req.Status = "draft"
	}

	plan, err := h.dailyPlanService.CreateDailyPlan(userID.(string), req)
	if err != nil {
		if err.Error() == "daily plan already exists for this date" {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, plan)
}

// GetDailyPlans retrieves daily plans for the authenticated user
// @Summary Get daily plans
// @Description Get daily plans for the authenticated user with filtering and pagination
// @Tags daily-plans
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Param date_from query string false "Filter by start date (YYYY-MM-DD)"
// @Param date_to query string false "Filter by end date (YYYY-MM-DD)"
// @Param status query string false "Filter by status (draft, active, completed)"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /api/v1/daily-plans [get]
func (h *DailyPlanHandler) GetDailyPlans(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var params services.DailyPlanQueryParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate pagination parameters
	if params.Page < 1 {
		params.Page = 1
	}
	if params.Limit < 1 || params.Limit > 100 {
		params.Limit = 20
	}

	plans, total, err := h.dailyPlanService.GetDailyPlans(userID.(string), params)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"plans": plans,
		"total": total,
		"page":  params.Page,
		"limit": params.Limit,
	})
}

// GetDailyPlan retrieves a specific daily plan
// @Summary Get daily plan
// @Description Get a specific daily plan by ID
// @Tags daily-plans
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Daily plan ID"
// @Success 200 {object} services.DailyPlanResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/v1/daily-plans/{id} [get]
func (h *DailyPlanHandler) GetDailyPlan(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	planID := c.Param("id")
	if planID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Daily plan ID is required"})
		return
	}

	plan, err := h.dailyPlanService.GetDailyPlan(userID.(string), planID)
	if err != nil {
		if err.Error() == "daily plan not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, plan)
}

// UpdateDailyPlan updates an existing daily plan
// @Summary Update daily plan
// @Description Update an existing daily plan
// @Tags daily-plans
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Daily plan ID"
// @Param request body services.DailyPlanRequest true "Daily plan request"
// @Success 200 {object} services.DailyPlanResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/v1/daily-plans/{id} [put]
func (h *DailyPlanHandler) UpdateDailyPlan(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	planID := c.Param("id")
	if planID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Daily plan ID is required"})
		return
	}

	var req services.DailyPlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	plan, err := h.dailyPlanService.UpdateDailyPlan(userID.(string), planID, req)
	if err != nil {
		if err.Error() == "daily plan not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, plan)
}

// DeleteDailyPlan deletes a daily plan
// @Summary Delete daily plan
// @Description Delete a daily plan by ID
// @Tags daily-plans
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Daily plan ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/v1/daily-plans/{id} [delete]
func (h *DailyPlanHandler) DeleteDailyPlan(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	planID := c.Param("id")
	if planID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Daily plan ID is required"})
		return
	}

	err := h.dailyPlanService.DeleteDailyPlan(userID.(string), planID)
	if err != nil {
		if err.Error() == "daily plan not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Daily plan deleted successfully"})
}

// UpdateActivity updates a single activity within a daily plan
// @Summary Update activity
// @Description Update a single activity within a daily plan
// @Tags daily-plans
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param plan_id path string true "Daily plan ID"
// @Param activity_id path string true "Activity ID"
// @Param request body services.UpdateActivityRequest true "Activity update request"
// @Success 200 {object} services.ActivityResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/v1/daily-plans/{plan_id}/activities/{activity_id} [put]
func (h *DailyPlanHandler) UpdateActivity(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	planID := c.Param("plan_id")
	activityID := c.Param("activity_id")

	if planID == "" || activityID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Plan ID and Activity ID are required"})
		return
	}

	var req services.UpdateActivityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	activity, err := h.dailyPlanService.UpdateActivity(userID.(string), planID, activityID, req)
	if err != nil {
		if err.Error() == "activity not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, activity)
}

// GetTodayPlan retrieves today's daily plan or creates a template
// @Summary Get today's plan
// @Description Get today's daily plan or create a draft template if none exists
// @Tags daily-plans
// @Security BearerAuth
// @Accept json
// @Produce json
// @Success 200 {object} services.DailyPlanResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /api/v1/daily-plans/today [get]
func (h *DailyPlanHandler) GetTodayPlan(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	today := time.Now().Format("2006-01-02")

	// Try to get today's plan
	plan, err := h.dailyPlanService.GetDailyPlanByDate(userID.(string), today)
	if err != nil && err.Error() == "daily plan not found" {
		// Create a template plan for today
		template := services.DailyPlanRequest{
			Date: today,
			Activities: []services.Activity{
				{
					Description:   "Morning routine",
					EstimatedTime: 30,
					Status:        "pending",
					Category:      "Personal",
					Priority:      "medium",
					Order:         1,
				},
				{
					Description:   "Deep work session 1",
					EstimatedTime: 120,
					Status:        "pending",
					Category:      "Work",
					Priority:      "high",
					Order:         2,
				},
				{
					Description:   "Lunch break",
					EstimatedTime: 60,
					Status:        "pending",
					Category:      "Personal",
					Priority:      "medium",
					Order:         3,
				},
				{
					Description:   "Deep work session 2",
					EstimatedTime: 120,
					Status:        "pending",
					Category:      "Work",
					Priority:      "high",
					Order:         4,
				},
				{
					Description:   "Evening review",
					EstimatedTime: 30,
					Status:        "pending",
					Category:      "Personal",
					Priority:      "medium",
					Order:         5,
				},
			},
			Status: "draft",
		}

		plan, err = h.dailyPlanService.CreateDailyPlan(userID.(string), template)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	} else if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, plan)
}

// GetDailyPlanStats retrieves statistics for daily plans
// @Summary Get daily plan statistics
// @Description Get daily planning statistics for the authenticated user
// @Tags daily-plans
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param days query int false "Number of days to analyze" default(30)
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /api/v1/daily-plans/stats [get]
func (h *DailyPlanHandler) GetDailyPlanStats(c *gin.Context) {
	_, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	daysStr := c.DefaultQuery("days", "30")
	days, err := strconv.Atoi(daysStr)
	if err != nil || days < 1 || days > 365 {
		days = 30
	}

	// Get daily plan statistics using the statistics service
	// This is a simplified implementation - in Phase 4, we'll create a proper statistics service
	c.JSON(http.StatusOK, gin.H{
		"message": "Daily plan statistics endpoint - now integrated with statistics API",
		"days":    days,
		"endpoint_available": "/api/v1/statistics/overview",
		"note":   "Use the statistics endpoints for comprehensive planning analytics",
	})
}