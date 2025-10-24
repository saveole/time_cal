package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"time-cal-backend/internal/services"
)

type TimeHandler struct {
	timeService *services.TimeService
}

func NewTimeHandler(db *gorm.DB) *TimeHandler {
	return &TimeHandler{
		timeService: services.NewTimeService(db),
	}
}

// CreateTimeEntry creates a new time entry
// @Summary Create time entry
// @Description Create a new time entry for the authenticated user
// @Tags time-entries
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body services.TimeEntryRequest true "Time entry request"
// @Success 201 {object} services.TimeEntryResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /api/v1/time-entries [post]
func (h *TimeHandler) CreateTimeEntry(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req services.TimeEntryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	entry, err := h.timeService.CreateTimeEntry(userID.(string), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, entry)
}

// GetTimeEntries retrieves time entries for the authenticated user
// @Summary Get time entries
// @Description Get time entries for the authenticated user with filtering and pagination
// @Tags time-entries
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Param category query string false "Filter by category"
// @Param date_from query string false "Filter by start date (YYYY-MM-DD)"
// @Param date_to query string false "Filter by end date (YYYY-MM-DD)"
// @Param search query string false "Search in descriptions"
// @Success 200 {object} services.TimeEntryListResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /api/v1/time-entries [get]
func (h *TimeHandler) GetTimeEntries(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var params services.TimeQueryParams
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

	response, err := h.timeService.GetTimeEntries(userID.(string), params)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// GetTimeEntry retrieves a specific time entry
// @Summary Get time entry
// @Description Get a specific time entry by ID
// @Tags time-entries
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Time entry ID"
// @Success 200 {object} services.TimeEntryResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/v1/time-entries/{id} [get]
func (h *TimeHandler) GetTimeEntry(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	entryID := c.Param("id")
	if entryID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Time entry ID is required"})
		return
	}

	entry, err := h.timeService.GetTimeEntry(userID.(string), entryID)
	if err != nil {
		if err.Error() == "time entry not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, entry)
}

// UpdateTimeEntry updates an existing time entry
// @Summary Update time entry
// @Description Update an existing time entry
// @Tags time-entries
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Time entry ID"
// @Param request body services.TimeEntryRequest true "Time entry request"
// @Success 200 {object} services.TimeEntryResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/v1/time-entries/{id} [put]
func (h *TimeHandler) UpdateTimeEntry(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	entryID := c.Param("id")
	if entryID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Time entry ID is required"})
		return
	}

	var req services.TimeEntryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	entry, err := h.timeService.UpdateTimeEntry(userID.(string), entryID, req)
	if err != nil {
		if err.Error() == "time entry not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, entry)
}

// DeleteTimeEntry deletes a time entry
// @Summary Delete time entry
// @Description Delete a time entry by ID
// @Tags time-entries
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path string true "Time entry ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/v1/time-entries/{id} [delete]
func (h *TimeHandler) DeleteTimeEntry(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	entryID := c.Param("id")
	if entryID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Time entry ID is required"})
		return
	}

	err := h.timeService.DeleteTimeEntry(userID.(string), entryID)
	if err != nil {
		if err.Error() == "time entry not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Time entry deleted successfully"})
}

// GetTimeStats retrieves time statistics for the authenticated user
// @Summary Get time statistics
// @Description Get time tracking statistics for the authenticated user
// @Tags time-entries
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param days query int false "Number of days to analyze" default(30)
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /api/v1/time-entries/stats [get]
func (h *TimeHandler) GetTimeStats(c *gin.Context) {
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

	// Get time statistics using the statistics service
	// This is a simplified implementation - in Phase 4, we'll create a proper statistics service
	c.JSON(http.StatusOK, gin.H{
		"message": "Time statistics endpoint - now integrated with statistics API",
		"days":    days,
		"endpoint_available": "/api/v1/statistics/overview",
		"note":   "Use the statistics endpoints for comprehensive time analytics",
	})
}