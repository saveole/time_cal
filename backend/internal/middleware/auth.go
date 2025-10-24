package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"time-cal-backend/internal/config"
	"time-cal-backend/internal/services"
)

// RequireAuth middleware to validate JWT tokens
func RequireAuth(db *gorm.DB, cfg *config.Config) gin.HandlerFunc {
	authService := services.NewAuthService(db, cfg)

	return func(c *gin.Context) {
		// Get Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		// Check Bearer token format
		parts := strings.SplitN(authHeader, " ", 2)
		if !(len(parts) == 2 && parts[0] == "Bearer") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header format must be Bearer {token}"})
			c.Abort()
			return
		}

		// Get token
		tokenString := parts[1]

		// Parse and validate token
		claims, err := authService.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Set user information in context
		c.Set("userID", claims.UserID)
		c.Set("userEmail", claims.Email)

		c.Next()
	}
}