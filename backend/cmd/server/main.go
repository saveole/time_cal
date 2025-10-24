package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"

	"time-cal-backend/internal/config"
	"time-cal-backend/internal/handlers"
	"time-cal-backend/internal/middleware"
	"time-cal-backend/pkg/database"
)

// TODO: Add Swagger annotations in Phase 4
func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize database
	db, err := database.InitializeWithDriver(cfg.DatabaseDSN(), cfg.Database.Driver)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	log.Println("Database initialized and ready for use")

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(db, cfg)
	timeHandler := handlers.NewTimeHandler(db)
	dailyPlanHandler := handlers.NewDailyPlanHandler(db)
	statisticsHandler := handlers.NewStatisticsHandler(db)

	// Set Gin mode
	gin.SetMode(cfg.Server.GinMode)

	// Create Gin router
	router := gin.New()

	// Add middleware
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	router.Use(middleware.CORS(cfg.CORS.AllowedOrigins))
	router.Use(middleware.RequestID())

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"timestamp": time.Now().UTC(),
			"version":   "1.0.0",
		})
	})

	// API documentation
	router.GET("/docs", func(c *gin.Context) {
		docs := gin.H{
			"title":       "Time Calculator API",
			"description": "API for Time Calculator application with time tracking and daily planning features",
			"version":     "1.0.0",
			"baseURL":     "/api/v1",
			"endpoints": map[string]interface{}{
				"Authentication": map[string]interface{}{
					"POST /auth/register": map[string]string{
						"description": "Register a new user",
						"request":     `{"email": "user@example.com", "password": "password123", "name": "John Doe"}`,
						"response":    `{"user": {...}, "tokens": {...}}`,
					},
					"POST /auth/login": map[string]string{
						"description": "Login user",
						"request":     `{"email": "user@example.com", "password": "password123"}`,
						"response":    `{"user": {...}, "tokens": {...}}`,
					},
					"POST /auth/refresh": map[string]string{
						"description": "Refresh JWT token",
						"request":     `{"refreshToken": "..."}`,
						"response":    `{"accessToken": "...", "refreshToken": "..."}`,
					},
					"GET /auth/me": map[string]string{
						"description": "Get current user info",
						"headers":     `{"Authorization": "Bearer <token>"}`,
						"response":    `{"id": "...", "email": "...", "name": "..."}`,
					},
				},
				"Time Entries": map[string]interface{}{
					"GET /time-entries": map[string]string{
						"description": "Get user's time entries",
						"headers":     `{"Authorization": "Bearer <token>"}`,
						"response":    `{"data": [{...}]}`,
					},
					"POST /time-entries": map[string]string{
						"description": "Create a new time entry",
						"headers":     `{"Authorization": "Bearer <token>"}`,
						"request":     `{"description": "Task description", "startTime": "2024-01-01T10:00:00Z", "category": "Work"}`,
						"response":    `{"id": "...", "description": "...", "startTime": "..."}`,
					},
					"PUT /time-entries/:id": map[string]string{
						"description": "Update a time entry",
						"headers":     `{"Authorization": "Bearer <token>"}`,
						"request":     `{"description": "Updated description", "endTime": "2024-01-01T11:00:00Z"}`,
						"response":    `{"id": "...", "description": "...", "endTime": "..."}`,
					},
					"DELETE /time-entries/:id": map[string]string{
						"description": "Delete a time entry",
						"headers":     `{"Authorization": "Bearer <token>"}`,
						"response":    `{"message": "Time entry deleted successfully"}`,
					},
				},
				"Daily Plans": map[string]interface{}{
					"GET /daily-plans": map[string]string{
						"description": "Get user's daily plans",
						"headers":     `{"Authorization": "Bearer <token>"}`,
						"response":    `{"data": [{...}]}`,
					},
					"GET /daily-plans/today": map[string]string{
						"description": "Get today's plan",
						"headers":     `{"Authorization": "Bearer <token>"}`,
						"response":    `{"id": "...", "date": "...", "activities": [...]}`,
					},
					"POST /daily-plans": map[string]string{
						"description": "Create a new daily plan",
						"headers":     `{"Authorization": "Bearer <token>"}`,
						"request":     `{"date": "2024-01-01", "activities": [...]}`,
						"response":    `{"id": "...", "date": "...", "activities": [...]}`,
					},
				},
				"Statistics": map[string]interface{}{
					"GET /statistics/overview": map[string]string{
						"description": "Get statistics overview",
						"headers":     `{"Authorization": "Bearer <token>"}`,
						"response":    `{"totalTrackedTime": 360, "totalTimeToday": 120}`,
					},
					"GET /statistics/categories": map[string]string{
						"description": "Get category statistics",
						"headers":     `{"Authorization": "Bearer <token>"}`,
						"response":    `{"data": [{"category": "Work", "totalTime": 240, "percentage": 66.7}]}`,
					},
				},
			},
		}
		c.JSON(http.StatusOK, docs)
	})

	// API v1 routes
	v1 := router.Group("/api/v1")
	{
		// Authentication routes
		auth := v1.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.RefreshToken)
			auth.POST("/logout", middleware.RequireAuth(db, cfg), authHandler.Logout)
			auth.GET("/me", middleware.RequireAuth(db, cfg), authHandler.GetMe)
		}

		// Protected routes
		protected := v1.Group("/")
		protected.Use(middleware.RequireAuth(db, cfg))
		{
			// Time tracking routes
			time := protected.Group("/time-entries")
			{
				time.GET("", timeHandler.GetTimeEntries)
				time.POST("", timeHandler.CreateTimeEntry)
				time.GET("/stats", timeHandler.GetTimeStats)
				time.GET("/:id", timeHandler.GetTimeEntry)
				time.PUT("/:id", timeHandler.UpdateTimeEntry)
				time.DELETE("/:id", timeHandler.DeleteTimeEntry)
			}

			// Daily planning routes
			plans := protected.Group("/daily-plans")
			{
				plans.GET("", dailyPlanHandler.GetDailyPlans)
				plans.POST("", dailyPlanHandler.CreateDailyPlan)
				plans.GET("/today", dailyPlanHandler.GetTodayPlan)
				plans.GET("/stats", dailyPlanHandler.GetDailyPlanStats)
				plans.GET("/:id", dailyPlanHandler.GetDailyPlan)
				plans.PUT("/:id", dailyPlanHandler.UpdateDailyPlan)
				plans.DELETE("/:id", dailyPlanHandler.DeleteDailyPlan)
			}

			// Activity routes (nested under daily plans)
			activities := protected.Group("/daily-plans/:id/activities")
			{
				activities.PUT("/:activity_id", dailyPlanHandler.UpdateActivity)
			}

			// Statistics routes
			stats := protected.Group("/statistics")
			{
				stats.GET("/overview", statisticsHandler.GetStatisticsOverview)
				stats.GET("/productivity", statisticsHandler.GetProductivityStats)
				stats.GET("/categories", statisticsHandler.GetCategoryStats)
				stats.GET("/timeseries", statisticsHandler.GetTimeSeriesData)
				stats.GET("/insights", statisticsHandler.GetInsights)
			}
		}
	}

	// TODO: Add Swagger documentation in Phase 4
	// if cfg.Swagger.Enabled {
	// 	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	// }

	// Create HTTP server
	server := &http.Server{
		Addr:    ":" + cfg.Server.Port,
		Handler: router,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Server starting on port %s", cfg.Server.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// Give outstanding requests 30 seconds to complete
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}

// Temporary handlers - these will be implemented in subsequent phases

// Time entry handlers are now implemented in handlers/time_handler.go

// Daily plan handlers are now implemented in handlers/daily_plan_handler.go

// Statistics handlers are now implemented in handlers/statistics_handler.go
