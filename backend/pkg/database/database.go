package database

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func Initialize(dsn string) (*gorm.DB, error) {
	return InitializeWithDriver(dsn, "sqlite")
}

func InitializeWithDriver(dsn string, driver string) (*gorm.DB, error) {
	// Configure GORM logger
	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	}

	var db *gorm.DB
	var err error

	// Connect to database based on driver
	switch driver {
	case "postgres":
		db, err = gorm.Open(postgres.Open(dsn), gormConfig)
	case "sqlite":
		db, err = gorm.Open(sqlite.Open(dsn), gormConfig)
	default:
		return nil, fmt.Errorf("unsupported database driver: %s", driver)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Test connection
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get underlying sql.DB: %w", err)
	}

	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// Configure connection pool
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)

	// Run migrations
	if err := AutoMigrate(db); err != nil {
		return nil, fmt.Errorf("failed to run migrations: %w", err)
	}

	// Seed data
	if err := SeedData(db); err != nil {
		log.Printf("Warning: Failed to seed data: %v", err)
	}

	log.Println("Database initialization completed successfully")
	return db, nil
}