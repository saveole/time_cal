package services

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"time-cal-backend/internal/config"
	"time-cal-backend/internal/models"
)

func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	// Migrate all tables
	err = db.AutoMigrate(&models.User{}, &models.TimeEntry{}, &models.DailyPlan{}, &models.Activity{})
	require.NoError(t, err)

	return db
}

func setupTestConfig() *config.Config {
	return &config.Config{
		JWT: config.JWTConfig{
			Secret:             "test-secret-key-for-testing-only",
			ExpireHours:        1,
			RefreshExpireHours: 24,
		},
		CORS: config.CORSConfig{
			AllowedOrigins: []string{"*"},
		},
	}
}

func TestNewAuthService(t *testing.T) {
	// Test with in-memory SQLite database
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	// Just test the database connection works
	sqlDB, err := db.DB()
	require.NoError(t, err)
	err = sqlDB.Ping()
	require.NoError(t, err)

	cfg := setupTestConfig()
	authService := NewAuthService(db, cfg)

	assert.NotNil(t, authService)
	assert.Equal(t, db, authService.db)
	assert.Equal(t, cfg, authService.cfg)
}

func TestTokenClaimsValidation(t *testing.T) {
	cfg := setupTestConfig()

	// Create a sample token
	userID := uuid.New()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, TokenClaims{
		UserID: userID.String(),
		Email:  "test@example.com",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	})

	// Sign the token
	tokenString, err := token.SignedString([]byte(cfg.JWT.Secret))
	assert.NoError(t, err)
	assert.NotEmpty(t, tokenString)

	// Parse and validate the token
	parsedToken, err := jwt.ParseWithClaims(tokenString, &TokenClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(cfg.JWT.Secret), nil
	})

	assert.NoError(t, err)
	assert.NotNil(t, parsedToken)

	claims, ok := parsedToken.Claims.(*TokenClaims)
	assert.True(t, ok)
	assert.Equal(t, userID.String(), claims.UserID)
	assert.Equal(t, "test@example.com", claims.Email)
}

func TestInvalidTokenValidation(t *testing.T) {
	cfg := setupTestConfig()

	// Test with invalid token
	invalidToken := "invalid.jwt.token"
	_, err := jwt.ParseWithClaims(invalidToken, &TokenClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(cfg.JWT.Secret), nil
	})

	assert.Error(t, err)

	// Test with token signed with wrong secret
	userID := uuid.New()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, TokenClaims{
		UserID: userID.String(),
		Email:  "test@example.com",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	})

	wrongSecretToken, err := token.SignedString([]byte("wrong-secret"))
	assert.NoError(t, err)

	_, err = jwt.ParseWithClaims(wrongSecretToken, &TokenClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(cfg.JWT.Secret), nil
	})

	assert.Error(t, err)
}

func TestExpiredTokenValidation(t *testing.T) {
	cfg := setupTestConfig()

	// Create an expired token
	userID := uuid.New()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, TokenClaims{
		UserID: userID.String(),
		Email:  "test@example.com",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-time.Hour)), // Expired 1 hour ago
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
		},
	})

	tokenString, err := token.SignedString([]byte(cfg.JWT.Secret))
	assert.NoError(t, err)

	// Try to parse expired token
	_, err = jwt.ParseWithClaims(tokenString, &TokenClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(cfg.JWT.Secret), nil
	})

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "token is expired")
}