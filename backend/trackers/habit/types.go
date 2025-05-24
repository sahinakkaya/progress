package habit

import (
	"routine-tracker/models"
	"time"
)

// HabitTracker represents a habit tracking configuration
type HabitTracker struct {
	ID          int               `json:"id" example:"1"`
	TrackerName string            `json:"trackerName" example:"Drink Water"`
	Goal        float64           `json:"goal" example:"8"`              // how many times
	TimePeriod  models.TimePeriod `json:"timePeriod" example:"per_day"` // per day, week, month, year
	StartDate   time.Time         `json:"startDate" example:"2024-01-01T00:00:00Z"`
	Due         models.Due        `json:"due"`
	Reminders   models.Reminder   `json:"reminders"`
	BadHabit    bool              `json:"badHabit" example:"false"`
	GoalStreak  *int              `json:"goalStreak" example:"30"` // null or int
	CreatedAt   time.Time         `json:"createdAt" example:"2024-01-01T10:00:00Z"`
}

// API Request/Response structures
type CreateHabitRequest struct {
	TrackerName string            `json:"trackerName" example:"Drink Water"`
	Goal        float64           `json:"goal" example:"8"`
	TimePeriod  models.TimePeriod `json:"timePeriod" example:"per_day"`
	StartDate   string            `json:"startDate" example:"2024-01-01"` // "2024-01-01" format
	Due         models.Due        `json:"due"`
	Reminders   models.Reminder   `json:"reminders,omitempty"`
	BadHabit    bool              `json:"badHabit" example:"false"`
	GoalStreak  *int              `json:"goalStreak" example:"30"`
}

type UpdateHabitRequest struct {
	TrackerName *string            `json:"trackerName,omitempty"`
	Goal        *float64           `json:"goal,omitempty"`
	TimePeriod  *models.TimePeriod `json:"timePeriod,omitempty"`
	StartDate   *string            `json:"startDate,omitempty"`
	Due         *models.Due        `json:"due,omitempty"`
	Reminders   *models.Reminder   `json:"reminders,omitempty"`
	BadHabit    *bool              `json:"badHabit,omitempty"`
	GoalStreak  *int               `json:"goalStreak,omitempty"`
}
