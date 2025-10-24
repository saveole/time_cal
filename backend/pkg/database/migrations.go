package database

import (
	"log"

	"time-cal-backend/internal/models"
	"gorm.io/gorm"
)

// AutoMigrate runs database migrations for all models
func AutoMigrate(db *gorm.DB) error {
	log.Println("Running database migrations...")

	// Check database type and enable UUID extension for PostgreSQL only
	var dbType string
	if err := db.Raw("SELECT name FROM sqlite_master WHERE type='table' AND name='sqlite_master'").Error; err == nil {
		dbType = "sqlite"
		log.Println("Using SQLite database")
	} else {
		dbType = "postgres"
		log.Println("Using PostgreSQL database")
		// Enable UUID extension for PostgreSQL
		if err := db.Exec("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"").Error; err != nil {
			log.Printf("Warning: Could not enable UUID extension: %v", err)
		}
	}

	// Migrate all models
	if err := db.AutoMigrate(models.Models...); err != nil {
		return err
	}

	log.Printf("Database migrations completed successfully for %s", dbType)
	return nil
}

// SeedData seeds the database with initial data
func SeedData(db *gorm.DB) error {
	log.Println("Seeding database with initial data...")

	// Create default tags
	tags := []models.Tag{
		{Name: "Work", Color: "#3b82f6"},
		{Name: "Personal", Color: "#10b981"},
		{Name: "Learning", Color: "#8b5cf6"},
		{Name: "Exercise", Color: "#f59e0b"},
		{Name: "Meeting", Color: "#ef4444"},
	}

	for _, tag := range tags {
		var existingTag models.Tag
		if err := db.Where("name = ?", tag.Name).First(&existingTag).Error; err == gorm.ErrRecordNotFound {
			if err := db.Create(&tag).Error; err != nil {
				log.Printf("Failed to create tag %s: %v", tag.Name, err)
			} else {
				log.Printf("Created tag: %s", tag.Name)
			}
		}
	}

	log.Println("Database seeding completed")
	return nil
}