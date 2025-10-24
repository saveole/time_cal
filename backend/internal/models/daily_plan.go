package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DailyPlan struct {
	ID                uuid.UUID  `gorm:"type:uuid;primary_key" json:"id"`
	UserID            uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	Date              time.Time  `gorm:"not null;index" json:"date"`
	TotalEstimatedTime int       `gorm:"type:integer;default:0" json:"total_estimated_time"`
	TotalActualTime   int        `gorm:"type:integer;default:0" json:"total_actual_time"`
	Status            string     `gorm:"type:varchar(20);default:'draft'" json:"status"` // draft, active, completed
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `gorm:"index" json:"-"`

	// Relationships
	User      User        `gorm:"foreignKey:UserID;references:ID" json:"user,omitempty"`
	Activities []Activity  `gorm:"foreignKey:DailyPlanID;references:ID" json:"activities"`
}

// TableName specifies the table name for the DailyPlan model
func (DailyPlan) TableName() string {
	return "daily_plans"
}

// BeforeCreate hook to generate UUID if not set
func (d *DailyPlan) BeforeCreate(tx *gorm.DB) error {
	if d.ID == uuid.Nil {
		d.ID = uuid.New()
	}
	return nil
}