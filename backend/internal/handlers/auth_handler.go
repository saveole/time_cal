package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"time-cal-backend/internal/config"
	"time-cal-backend/internal/services"
)

type AuthHandler struct {
	authService *services.AuthService
}

func NewAuthHandler(db *gorm.DB, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		authService: services.NewAuthService(db, cfg),
	}
}

// Register handles user registration
// @Summary Register a new user
// @Description Create a new user account
// @Tags auth
// @Accept json
// @Produce json
// @Param request body services.RegisterRequest true "Registration request"
// @Success 201 {object} services.AuthResponse
// @Failure 400 {object} map[string]string
// @Failure 409 {object} map[string]string
// @Router /api/v1/auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
	var req services.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := h.authService.Register(req)
	if err != nil {
		if err.Error() == "user with this email already exists" {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, response)
}

// Login handles user authentication
// @Summary Login user
// @Description Authenticate a user and return tokens
// @Tags auth
// @Accept json
// @Produce json
// @Param request body services.LoginRequest true "Login request"
// @Success 200 {object} services.AuthResponse
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /api/v1/auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req services.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response, err := h.authService.Login(req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, response)
}

// RefreshToken handles token refresh
// @Summary Refresh access token
// @Description Generate new access and refresh tokens using a valid refresh token
// @Tags auth
// @Accept json
// @Produce json
// @Param request body map[string]string true "Refresh token" {"refresh_token": "string"}
// @Success 200 {object} services.TokenPair
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /api/v1/auth/refresh [post]
func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tokens, err := h.authService.RefreshToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tokens)
}

// Logout handles user logout (client-side token invalidation)
// @Summary Logout user
// @Description Logout the current user (tokens should be invalidated client-side)
// @Tags auth
// @Security BearerAuth
// @Produce json
// @Success 200 {object} map[string]string
// @Router /api/v1/auth/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
	// In a stateless JWT implementation, logout is typically handled client-side
	// by simply discarding the tokens. However, we can provide a response
	// to confirm the logout action was processed.

	c.JSON(http.StatusOK, gin.H{
		"message": "Successfully logged out",
		"note":    "Please discard your tokens on the client side",
	})
}

// GetMe handles getting the current user's profile
// @Summary Get current user profile
// @Description Get the profile of the currently authenticated user
// @Tags auth
// @Security BearerAuth
// @Produce json
// @Success 200 {object} models.User
// @Failure 401 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /api/v1/auth/me [get]
func (h *AuthHandler) GetMe(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	user, err := h.authService.GetUserByID(userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}