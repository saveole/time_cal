package models

import (
	"github.com/google/uuid"
)

// All models that need to be migrated
var Models = []interface{}{
	&User{},
	&Tag{},
	&TimeEntry{},
	&DailyPlan{},
	&Activity{},
}

// Helper function to generate UUID
func GenerateUUID() uuid.UUID {
	return uuid.New()
}

// Common database operations
type BaseModel interface {
	GetID() uuid.UUID
	TableName() string
}

func (u User) GetID() uuid.UUID     { return u.ID }
func (t Tag) GetID() uuid.UUID       { return t.ID }
func (t TimeEntry) GetID() uuid.UUID { return t.ID }
func (d DailyPlan) GetID() uuid.UUID { return d.ID }
func (a Activity) GetID() uuid.UUID  { return a.ID }