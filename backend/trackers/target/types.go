package target

import (
	"routine-tracker/models"
	"time"
)

// TargetTracker represents a target tracking configuration
type TargetTracker struct {
	ID                int             `json:"id" example:"1"`
	TrackerName       string          `json:"trackerName" example:"Save Money"`
	StartValue        float64         `json:"startValue" example:"0"` // Adjusted value when useActualBounds is true
	OriginalStartValue float64        `json:"originalStartValue" example:"0"` // Always the original user-set value
	GoalValue         float64         `json:"goalValue" example:"5000"`
	CurrentValue      *float64        `json:"currentValue,omitempty" example:"1234.56"` // Calculated field, not stored in DB
	StartDate         time.Time       `json:"startDate" example:"2024-01-01T00:00:00Z"`
	GoalDate          time.Time       `json:"goalDate" example:"2024-12-31T00:00:00Z"`
	AddToTotal        bool            `json:"addToTotal" example:"false"` // default false
	UseActualBounds   bool            `json:"useActualBounds" example:"false"` // default false
	TrendWeightType   *string         `json:"trendWeightType,omitempty" example:"none"` // Weighting algorithm for trend line
	Due               models.Due      `json:"due"`
	Reminders         models.Reminder `json:"reminders"`
	CreatedAt         time.Time       `json:"createdAt" example:"2024-01-01T10:00:00Z"`
}

type CreateTargetRequest struct {
	TrackerName     string          `json:"trackerName" example:"Save Money"`
	StartValue      float64         `json:"startValue" example:"0"`
	GoalValue       float64         `json:"goalValue" example:"5000"`
	StartDate       string          `json:"startDate" example:"2024-01-01"` // "2024-01-01" format
	GoalDate        string          `json:"goalDate" example:"2024-12-31"`  // "2024-12-31" format
	AddToTotal      bool            `json:"addToTotal" example:"false"`
	TrendWeightType *string         `json:"trendWeightType,omitempty" example:"none"`
	Due             models.Due      `json:"due"`
	Reminders       models.Reminder `json:"reminders,omitempty"`
}

type UpdateTargetRequest struct {
	TrackerName     *string          `json:"trackerName,omitempty"`
	StartValue      *float64         `json:"startValue,omitempty"`
	GoalValue       *float64         `json:"goalValue,omitempty"`
	StartDate       *string          `json:"startDate,omitempty"`
	GoalDate        *string          `json:"goalDate,omitempty"`
	AddToTotal      *bool            `json:"addToTotal,omitempty"`
	UseActualBounds *bool            `json:"useActualBounds,omitempty"`
	TrendWeightType *string          `json:"trendWeightType,omitempty"`
	Due             *models.Due      `json:"due,omitempty"`
	Reminders       *models.Reminder `json:"reminders,omitempty"`
}
