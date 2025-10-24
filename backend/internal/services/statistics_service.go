package services

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"time-cal-backend/internal/models"
)

type StatisticsService struct {
	db *gorm.DB
}

type StatisticsResponse struct {
	TotalTrackedTime    int64                  `json:"total_tracked_time"`    // Total time in seconds
	TotalTimeToday      int64                  `json:"total_time_today"`      // Today's time in seconds
	TotalTimeThisWeek   int64                  `json:"total_time_this_week"`   // This week's time in seconds
	TotalTimeThisMonth  int64                  `json:"total_time_this_month"`  // This month's time in seconds
	CategoryStats       []CategoryStat         `json:"category_stats"`
	DailyStats          []DailyStat            `json:"daily_stats"`
	ProductivityTrend   []ProductivityPoint    `json:"productivity_trend"`
	GoalCompletion      GoalCompletionStats    `json:"goal_completion"`
}

type CategoryStat struct {
	Category string `json:"category"`
	TotalTime int64  `json:"total_time"` // in seconds
	Percentage float64 `json:"percentage"`
	Color     string `json:"color"`
	Count     int64  `json:"count"`
}

type DailyStat struct {
	Date       string `json:"date"`
	TotalTime  int64  `json:"total_time"`  // in seconds
	Activities int    `json:"activities_completed"`
	GoalMet    bool   `json:"goal_met"`
}

type ProductivityPoint struct {
	Date      string  `json:"date"`
	Value     float64 `json:"value"` // productivity score 0-100
	GoalHours float64 `json:"goal_hours"`
	ActualHours float64 `json:"actual_hours"`
}

type GoalCompletionStats struct {
	DailyGoalMet    int     `json:"daily_goal_met"`
	DailyGoalMissed int     `json:"daily_goal_missed"`
	CompletionRate  float64 `json:"completion_rate"`
	AverageGoal     float64 `json:"average_goal"`
	AverageActual   float64 `json:"average_actual"`
}

type StatisticsQueryParams struct {
	Days   int    `form:"days,default=30"`
	Period string `form:"period,default:day"` // day, week, month
	Category string `form:"category"`
	DateFrom string `form:"date_from"`
	DateTo   string `form:"date_to"`
}

func NewStatisticsService(db *gorm.DB) *StatisticsService {
	return &StatisticsService{db: db}
}

// GetStatisticsOverview retrieves comprehensive statistics for a user
func (s *StatisticsService) GetStatisticsOverview(userID string, params StatisticsQueryParams) (*StatisticsResponse, error) {
	// Parse user ID
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	// Set default days if not provided
	if params.Days < 1 || params.Days > 365 {
		params.Days = 30
	}

	// Calculate date range
	now := time.Now()
	endDate := now
	startDate := now.AddDate(0, 0, -params.Days)

	// Override with custom date range if provided
	if params.DateFrom != "" {
		if dateFrom, err := time.Parse("2006-01-02", params.DateFrom); err == nil {
			startDate = dateFrom
		}
	}
	if params.DateTo != "" {
		if dateTo, err := time.Parse("2006-01-02", params.DateTo); err == nil {
			endDate = dateTo.Add(24*time.Hour - time.Second)
		}
	}

	// Get all statistics in parallel
	stats := &StatisticsResponse{}

	// Get time-based statistics
	totalTime, err := s.getTotalTrackedTime(userUUID, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get total time: %w", err)
	}
	stats.TotalTrackedTime = totalTime

	// Get today's time
	todayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	todayTime, err := s.getTotalTrackedTime(userUUID, todayStart, now)
	if err != nil {
		return nil, fmt.Errorf("failed to get today's time: %w", err)
	}
	stats.TotalTimeToday = todayTime

	// Get this week's time
	weekStart := now.AddDate(0, 0, -int(now.Weekday())+1) // Start from Monday
	weekStart = time.Date(weekStart.Year(), weekStart.Month(), weekStart.Day(), 0, 0, 0, 0, now.Location())
	weekTime, err := s.getTotalTrackedTime(userUUID, weekStart, now)
	if err != nil {
		return nil, fmt.Errorf("failed to get week's time: %w", err)
	}
	stats.TotalTimeThisWeek = weekTime

	// Get this month's time
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	monthTime, err := s.getTotalTrackedTime(userUUID, monthStart, now)
	if err != nil {
		return nil, fmt.Errorf("failed to get month's time: %w", err)
	}
	stats.TotalTimeThisMonth = monthTime

	// Get category statistics
	categoryStats, err := s.getCategoryStats(userUUID, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get category stats: %w", err)
	}
	stats.CategoryStats = categoryStats

	// Get daily statistics
	dailyStats, err := s.getDailyStats(userUUID, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get daily stats: %w", err)
	}
	stats.DailyStats = dailyStats

	// Get productivity trend
	productivityTrend, err := s.getProductivityTrend(userUUID, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get productivity trend: %w", err)
	}
	stats.ProductivityTrend = productivityTrend

	// Get goal completion stats
	goalStats, err := s.getGoalCompletionStats(userUUID, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get goal completion stats: %w", err)
	}
	stats.GoalCompletion = goalStats

	return stats, nil
}

// GetProductivityStats retrieves detailed productivity statistics
func (s *StatisticsService) GetProductivityStats(userID string, params StatisticsQueryParams) (map[string]interface{}, error) {
	// Parse user ID
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	// Calculate date range
	now := time.Now()
	startDate := now.AddDate(0, 0, -params.Days)

	// Get detailed productivity metrics
	stats := make(map[string]interface{})

	// Peak productivity hours
	peakHours, err := s.getPeakProductivityHours(userUUID, startDate, now)
	if err != nil {
		return nil, fmt.Errorf("failed to get peak hours: %w", err)
	}
	stats["peak_hours"] = peakHours

	// Focus sessions (continuous work blocks)
	focusSessions, err := s.getFocusSessionStats(userUUID, startDate, now)
	if err != nil {
		return nil, fmt.Errorf("failed to get focus sessions: %w", err)
	}
	stats["focus_sessions"] = focusSessions

	// Consistency metrics
	consistency, err := s.getConsistencyMetrics(userUUID, startDate, now)
	if err != nil {
		return nil, fmt.Errorf("failed to get consistency metrics: %w", err)
	}
	stats["consistency"] = consistency

	return stats, nil
}

// GetCategoryStats retrieves detailed category breakdown
func (s *StatisticsService) GetCategoryStats(userID string, params StatisticsQueryParams) ([]CategoryStat, error) {
	// Parse user ID
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %w", err)
	}

	// Calculate date range
	now := time.Now()
	startDate := now.AddDate(0, 0, -params.Days)

	return s.getCategoryStats(userUUID, startDate, now)
}

// Helper methods

func (s *StatisticsService) getTotalTrackedTime(userUUID uuid.UUID, startDate, endDate time.Time) (int64, error) {
	var totalTime sql.NullInt64

	err := s.db.Model(&models.TimeEntry{}).
		Select("COALESCE(SUM(duration), 0)").
		Where("user_id = ? AND start_time BETWEEN ? AND ?", userUUID, startDate, endDate).
		Scan(&totalTime).Error

	if err != nil {
		return 0, err
	}

	return totalTime.Int64, nil
}

func (s *StatisticsService) getCategoryStats(userUUID uuid.UUID, startDate, endDate time.Time) ([]CategoryStat, error) {
	type CategoryTime struct {
		Category string
		TotalTime int64
		Count     int64
	}

	var categoryTimes []CategoryTime
	err := s.db.Model(&models.TimeEntry{}).
		Select("category, COALESCE(SUM(duration), 0) as total_time, COUNT(*) as count").
		Where("user_id = ? AND start_time BETWEEN ? AND ?", userUUID, startDate, endDate).
		Group("category").
		Order("total_time DESC").
		Scan(&categoryTimes).Error

	if err != nil {
		return nil, err
	}

	// Get total time for percentage calculation
	var totalSum int64
	for _, ct := range categoryTimes {
		totalSum += ct.TotalTime
	}

	// Convert to response format
	var stats []CategoryStat
	colors := []string{"#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#14b8a6", "#f97316", "#84cc16", "#06b6d4", "#ec4899"}

	for i, ct := range categoryTimes {
		percentage := 0.0
		if totalSum > 0 {
			percentage = float64(ct.TotalTime) / float64(totalSum) * 100
		}

		color := colors[i%len(colors)]

		stats = append(stats, CategoryStat{
			Category:   ct.Category,
			TotalTime:  ct.TotalTime,
			Percentage: percentage,
			Color:      color,
			Count:      ct.Count,
		})
	}

	return stats, nil
}

func (s *StatisticsService) getDailyStats(userUUID uuid.UUID, startDate, endDate time.Time) ([]DailyStat, error) {
	type DayData struct {
		Date       string
		TotalTime  int64
		Activities int
		GoalMet    bool
	}

	var dayData []DayData
	err := s.db.Model(&models.TimeEntry{}).
		Select("DATE(start_time) as date, COALESCE(SUM(duration), 0) as total_time, COUNT(*) as activities").
		Where("user_id = ? AND start_time BETWEEN ? AND ?", userUUID, startDate, endDate).
		Group("DATE(start_time)").
		Order("date DESC").
		Scan(&dayData).Error

	if err != nil {
		return nil, err
	}

	// Determine if goals were met (assume 8 hours daily goal)
	var stats []DailyStat
	for _, day := range dayData {
		// Simple goal calculation: 8 hours = 28800 seconds
		goalMet := day.TotalTime >= 28800

		stats = append(stats, DailyStat{
			Date:       day.Date,
			TotalTime:  day.TotalTime,
			Activities: day.Activities,
			GoalMet:    goalMet,
		})
	}

	return stats, nil
}

func (s *StatisticsService) getProductivityTrend(userUUID uuid.UUID, startDate, endDate time.Time) ([]ProductivityPoint, error) {
	type TrendData struct {
		Date     string
		ActualHours float64
		GoalHours   float64
	}

	var trendData []TrendData
	err := s.db.Model(&models.TimeEntry{}).
		Select("DATE(start_time) as date, COALESCE(SUM(duration), 0) / 3600.0 as actual_hours").
		Where("user_id = ? AND start_time BETWEEN ? AND ?", userUUID, startDate, endDate).
		Group("DATE(start_time)").
		Order("date ASC").
		Scan(&trendData).Error

	if err != nil {
		return nil, err
	}

	var trend []ProductivityPoint
	for _, day := range trendData {
		// Assume 8 hours daily goal
		goalHours := 8.0

		// Calculate productivity score (0-100)
		score := 0.0
		if goalHours > 0 {
			ratio := day.ActualHours / goalHours
			if ratio >= 1.0 {
				score = 100.0
			} else {
				score = ratio * 100.0
			}
		}

		trend = append(trend, ProductivityPoint{
			Date:        day.Date,
			Value:       score,
			GoalHours:   goalHours,
			ActualHours: day.ActualHours,
		})
	}

	return trend, nil
}

func (s *StatisticsService) getGoalCompletionStats(userUUID uuid.UUID, startDate, endDate time.Time) (GoalCompletionStats, error) {
	// Get daily plan completion rates
	var completedPlans, totalPlans int64

	err := s.db.Model(&models.DailyPlan{}).
		Where("user_id = ? AND date BETWEEN ? AND ?", userUUID, startDate, endDate).
		Count(&totalPlans).Error

	if err != nil {
		return GoalCompletionStats{}, err
	}

	err = s.db.Model(&models.DailyPlan{}).
		Where("user_id = ? AND date BETWEEN ? AND ? AND status = ?", userUUID, startDate, endDate, "completed").
		Count(&completedPlans).Error

	if err != nil {
		return GoalCompletionStats{}, err
	}

	completionRate := 0.0
	if totalPlans > 0 {
		completionRate = float64(completedPlans) / float64(totalPlans) * 100
	}

	// Calculate average goals vs actual times
	var avgGoal, avgActual float64
	err = s.db.Model(&models.DailyPlan{}).
		Select("COALESCE(AVG(total_estimated_time), 0) / 60.0 as avg_goal, COALESCE(AVG(total_actual_time), 0) / 60.0 as avg_actual").
		Where("user_id = ? AND date BETWEEN ? AND ?", userUUID, startDate, endDate).
		Row().Scan(&avgGoal, &avgActual)

	if err != nil {
		return GoalCompletionStats{}, err
	}

	return GoalCompletionStats{
		DailyGoalMet:    int(completedPlans),
		DailyGoalMissed: int(totalPlans - completedPlans),
		CompletionRate:  completionRate,
		AverageGoal:     avgGoal,
		AverageActual:   avgActual,
	}, nil
}

func (s *StatisticsService) getPeakProductivityHours(userUUID uuid.UUID, startDate, endDate time.Time) (map[string]int64, error) {
	type HourData struct {
		Hour int
		TotalTime int64
	}

	var hourData []HourData
	err := s.db.Model(&models.TimeEntry{}).
		Select("EXTRACT(HOUR FROM start_time) as hour, COALESCE(SUM(duration), 0) as total_time").
		Where("user_id = ? AND start_time BETWEEN ? AND ?", userUUID, startDate, endDate).
		Group("EXTRACT(HOUR FROM start_time)").
		Order("hour").
		Scan(&hourData).Error

	if err != nil {
		return nil, err
	}

	peakHours := make(map[string]int64)
	for _, hd := range hourData {
		hourLabel := fmt.Sprintf("%02d:00", hd.Hour)
		peakHours[hourLabel] = hd.TotalTime
	}

	return peakHours, nil
}

func (s *StatisticsService) getFocusSessionStats(userUUID uuid.UUID, startDate, endDate time.Time) (map[string]interface{}, error) {
	// Find focus sessions (continuous work blocks > 30 minutes)
	// This is a simplified implementation
	stats := map[string]interface{}{
		"total_sessions": 0,
		"average_duration": 0,
		"longest_session": 0,
	}

	// TODO: Implement more sophisticated focus session detection
	return stats, nil
}

func (s *StatisticsService) getConsistencyMetrics(userUUID uuid.UUID, startDate, endDate time.Time) (map[string]interface{}, error) {
	// Calculate consistency metrics (streaks, regularity)
	stats := map[string]interface{}{
		"current_streak": 0,
		"longest_streak": 0,
		"days_active": 0,
		"days_total": 0,
	}

	// TODO: Implement streak calculation logic
	return stats, nil
}