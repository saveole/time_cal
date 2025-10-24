package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Tag struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	Name      string    `gorm:"uniqueIndex;not null" json:"name"`
	Color     string    `json:"color"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName specifies the table name for the Tag model
func (Tag) TableName() string {
	return "tags"
}

// BeforeCreate hook to generate UUID if not set
func (t *Tag) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}