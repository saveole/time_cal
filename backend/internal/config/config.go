package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
	CORS     CORSConfig
	Swagger  SwaggerConfig
}

type ServerConfig struct {
	Port   string
	GinMode string
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
	Driver   string // "postgres" or "sqlite"
}

type JWTConfig struct {
	Secret              string
	ExpireHours         int
	RefreshExpireHours  int
}

type CORSConfig struct {
	AllowedOrigins []string
}

type SwaggerConfig struct {
	Enabled bool
}

func Load() (*Config, error) {
	// Load .env file if it exists
	_ = godotenv.Load("configs/.env")

	config := &Config{
		Server: ServerConfig{
			Port:   getEnv("PORT", "8080"),
			GinMode: getEnv("GIN_MODE", "debug"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "timecal_user"),
			Password: getEnv("DB_PASSWORD", ""),
			DBName:   getEnv("DB_NAME", "timecal_db"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
			Driver:   getEnv("DB_DRIVER", "sqlite"),
		},
		JWT: JWTConfig{
			Secret:             getEnv("JWT_SECRET", "default-secret-change-this"),
			ExpireHours:        getEnvInt("JWT_EXPIRE_HOURS", 24),
			RefreshExpireHours: getEnvInt("JWT_REFRESH_EXPIRE_HOURS", 168),
		},
		CORS: CORSConfig{
			AllowedOrigins: getEnvSlice("CORS_ALLOWED_ORIGINS", []string{"http://localhost:3000", "http://localhost:5173"}),
		},
		Swagger: SwaggerConfig{
			Enabled: getEnvBool("SWAGGER_ENABLED", true),
		},
	}

	// Validate required fields
	if config.Database.Driver == "postgres" && config.Database.Password == "" {
		return nil, fmt.Errorf("database password is required for PostgreSQL")
	}
	if config.JWT.Secret == "default-secret-change-this" {
		return nil, fmt.Errorf("JWT secret must be set to a secure value")
	}

	return config, nil
}

func (c *Config) DatabaseDSN() string {
	if c.Database.Driver == "sqlite" {
		return c.Database.DBName + ".db"
	}
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.Database.Host,
		c.Database.Port,
		c.Database.User,
		c.Database.Password,
		c.Database.DBName,
		c.Database.SSLMode,
	)
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if valueStr, exists := os.LookupEnv(key); exists {
		if value, err := strconv.Atoi(valueStr); err == nil {
			return value
		}
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	if valueStr, exists := os.LookupEnv(key); exists {
		if value, err := strconv.ParseBool(valueStr); err == nil {
			return value
		}
	}
	return defaultValue
}

func getEnvSlice(key string, defaultValue []string) []string {
	if valueStr, exists := os.LookupEnv(key); exists {
		return []string{valueStr}
	}
	return defaultValue
}