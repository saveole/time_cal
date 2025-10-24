package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TimeEntry struct {
	ID          uuid.UUID  `gorm:"type:uuid;primary_key" json:"id"`
	UserID      uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	Description string     `gorm:"not null" json:"description"`
	StartTime   time.Time  `gorm:"not null" json:"start_time"`
	EndTime     *time.Time `json:"end_time"`
	Duration    *int       `gorm:"type:integer" json:"duration"` // Duration in seconds
	Category    string     `gorm:"not null" json:"category"`
	Tags        []Tag      `gorm:"many2many:time_entry_tags;" json:"tags"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	User User `gorm:"foreignKey:UserID;references:ID" json:"user,omitempty"`
}

// TableName specifies the table name for the TimeEntry model
func (TimeEntry) TableName() string {
	return "time_entries"
}

// BeforeCreate hook to generate UUID if not set
func (t *TimeEntry) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}

// BeforeSave hook to calculate duration if end time is set
func (t *TimeEntry) BeforeSave(tx *gorm.DB) error {
	if t.EndTime != nil && t.StartTime.Before(*t.EndTime) {
		duration := int(t.EndTime.Sub(t.StartTime).Seconds())
		t.Duration = &duration
	}
	return nil
}