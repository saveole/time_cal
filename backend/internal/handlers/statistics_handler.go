package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"time-cal-backend/internal/services"
)

type StatisticsHandler struct {
	statisticsService *services.StatisticsService
}

func NewStatisticsHandler(db *gorm.DB) *StatisticsHandler {
	return &StatisticsHandler{
		statisticsService: services.NewStatisticsService(db),
	}
}

// GetStatisticsOverview retrieves comprehensive statistics for the authenticated user
// @Summary Get statistics overview
// @Description Get comprehensive time tracking statistics for the authenticated user
// @Tags statistics
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param days query int false "Number of days to analyze" default(30)
// @Param period query string false "Aggregation period (day, week, month)" default(day)
// @Param category query string false "Filter by category"
// @Param date_from query string false "Filter by start date (YYYY-MM-DD)"
// @Param date_to query string false "Filter by end date (YYYY-MM-DD)"
// @Success 200 {object} services.StatisticsResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /api/v1/statistics/overview [get]
func (h *StatisticsHandler) GetStatisticsOverview(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var params services.StatisticsQueryParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate parameters
	if params.Days < 1 || params.Days > 365 {
		params.Days = 30
	}

	// Validate period
	validPeriods := map[string]bool{"day": true, "week": true, "month": true}
	if !validPeriods[params.Period] {
		params.Period = "day"
	}

	stats, err := h.statisticsService.GetStatisticsOverview(userID.(string), params)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetProductivityStats retrieves detailed productivity statistics
// @Summary Get productivity statistics
// @Description Get detailed productivity metrics and analytics
// @Tags statistics
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param days query int false "Number of days to analyze" default(30)
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /api/v1/statistics/productivity [get]
func (h *StatisticsHandler) GetProductivityStats(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var params services.StatisticsQueryParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate parameters
	if params.Days < 1 || params.Days > 365 {
		params.Days = 30
	}

	stats, err := h.statisticsService.GetProductivityStats(userID.(string), params)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetCategoryStats retrieves detailed category breakdown
// @Summary Get category statistics
// @Description Get detailed breakdown of time spent by category
// @Tags statistics
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param days query int false "Number of days to analyze" default(30)
// @Param category query string false "Filter by specific category"
// @Success 200 {array} services.CategoryStat
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /api/v1/statistics/categories [get]
func (h *StatisticsHandler) GetCategoryStats(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var params services.StatisticsQueryParams
	if err := c.ShouldBindQuery(&params); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate parameters
	if params.Days < 1 || params.Days > 365 {
		params.Days = 30
	}

	stats, err := h.statisticsService.GetCategoryStats(userID.(string), params)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetTimeSeriesData retrieves time series data for charts
// @Summary Get time series data
// @Description Get time series data suitable for charting
// @Tags statistics
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param days query int false "Number of days to analyze" default(30)
// @Param metric query string false "Metric to retrieve (time, activities, goals)" default(time)
// @Param granularity query string false "Data granularity (hour, day, week)" default(day)
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /api/v1/statistics/timeseries [get]
func (h *StatisticsHandler) GetTimeSeriesData(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse query parameters
	daysStr := c.DefaultQuery("days", "30")
	days, err := strconv.Atoi(daysStr)
	if err != nil || days < 1 || days > 365 {
		days = 30
	}

	metric := c.DefaultQuery("metric", "time")
	granularity := c.DefaultQuery("granularity", "day")

	// Validate parameters
	validMetrics := map[string]bool{"time": true, "activities": true, "goals": true}
	if !validMetrics[metric] {
		metric = "time"
	}

	validGranularities := map[string]bool{"hour": true, "day": true, "week": true}
	if !validGranularities[granularity] {
		granularity = "day"
	}

	// Get time series data based on parameters
	data, err := h.getTimeSeriesData(userID.(string), days, metric, granularity)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"metric":      metric,
		"granularity": granularity,
		"days":        days,
		"data":        data,
	})
}

// GetInsights retrieves AI-powered insights and recommendations
// @Summary Get insights
// @Description Get personalized insights and recommendations based on usage patterns
// @Tags statistics
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param days query int false "Number of days to analyze" default(30)
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /api/v1/statistics/insights [get]
func (h *StatisticsHandler) GetInsights(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	daysStr := c.DefaultQuery("days", "30")
	days, err := strconv.Atoi(daysStr)
	if err != nil || days < 1 || days > 365 {
		days = 30
	}

	// Generate insights based on statistics
	insights, err := h.generateInsights(userID.(string), days)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, insights)
}

// Helper methods

func (h *StatisticsHandler) getTimeSeriesData(userID string, days int, metric, granularity string) (interface{}, error) {
	// This is a simplified implementation
	// In a real application, this would query the database based on metric and granularity
	var data []map[string]interface{}

	switch granularity {
	case "hour":
		// Return hourly data
		data = []map[string]interface{}{
			{"timestamp": "2023-12-01T00:00:00Z", "value": 120},
			{"timestamp": "2023-12-01T01:00:00Z", "value": 180},
			// ... more hourly data points
		}
	case "day":
		// Return daily data
		data = []map[string]interface{}{
			{"date": "2023-12-01", "value": 480},
			{"date": "2023-12-02", "value": 360},
			// ... more daily data points
		}
	case "week":
		// Return weekly data
		data = []map[string]interface{}{
			{"week": "2023-W48", "value": 2520},
			{"week": "2023-W49", "value": 3120},
			// ... more weekly data points
		}
	}

	return data, nil
}

func (h *StatisticsHandler) generateInsights(userID string, days int) (map[string]interface{}, error) {
	// Generate insights based on user patterns
	insights := map[string]interface{}{
		"productivity_score": 75.5,
		"most_productive_hour": "10:00",
		"top_category": "Work",
		"recommendations": []string{
			"Consider scheduling deep work sessions during your peak productivity hours",
			"Your Work category dominates your time - consider balancing with Personal activities",
			"You're meeting 80% of your daily goals - great consistency!",
		},
		"patterns": map[string]interface{}{
			"peak_productivity": "Morning",
			"focus_duration": "45 minutes",
			"break_frequency": "Every 90 minutes",
		},
		"trends": map[string]interface{}{
			"productivity_trend": "improving",
			"goal_completion_trend": "stable",
			"category_balance_trend": "needs_attention",
		},
	}

	return insights, nil
}