package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Activity struct {
	ID             uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	DailyPlanID    uuid.UUID `gorm:"type:uuid;not null;index" json:"daily_plan_id"`
	Description    string    `gorm:"not null" json:"description"`
	EstimatedTime  int       `gorm:"type:integer;not null" json:"estimated_time"` // in minutes
	ActualTime     *int      `gorm:"type:integer" json:"actual_time"`            // in minutes
	Status         string    `gorm:"type:varchar(20);default:'pending'" json:"status"` // pending, in_progress, completed
	Category       string    `gorm:"not null" json:"category"`
	Priority       string    `gorm:"type:varchar(10);default:'medium'" json:"priority"` // low, medium, high
	Order          int       `gorm:"not null" json:"order"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	DailyPlan DailyPlan `gorm:"foreignKey:DailyPlanID;references:ID" json:"daily_plan,omitempty"`
}

// TableName specifies the table name for the Activity model
func (Activity) TableName() string {
	return "activities"
}

// BeforeCreate hook to generate UUID if not set
func (a *Activity) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}