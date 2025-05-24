package models

import (
	"time"
)

// TrackerType represents the type of tracker
type TrackerType string

const (
	HABIT  TrackerType = "habit"
	TARGET TrackerType = "target"
)

// TimePeriod represents the time period for habit goals
type TimePeriod string

const (
	PER_DAY   TimePeriod = "perDay"
	PER_WEEK  TimePeriod = "perWeek"
	PER_MONTH TimePeriod = "perMonth"
	PER_YEAR  TimePeriod = "perYear"
)

// DueType represents how the due scheduling works
type DueType string

const (
	SPECIFIC_DAYS DueType = "specificDays" // e.g., ["sunday", "monday", "wednesday"]
	INTERVAL      DueType = "interval"      // e.g., every 3 days/weeks/months/years
)

// Due represents when a tracker should appear on dashboard
type Due struct {
	Type          DueType  `json:"type" example:"specificDays"`
	SpecificDays  []string `json:"specificDays,omitempty" example:"sunday,monday,wednesday"` // ["sunday", "monday", etc.]
	IntervalType  string   `json:"intervalType,omitempty" example:"day"`                     // "day", "week", "month", "year"
	IntervalValue int      `json:"intervalValue,omitempty" example:"3"`                      // every X days/weeks/etc
}

// Reminder represents a notification time
type Reminder struct {
	Times   []string `json:"times"`
	Enabled bool     `json:"enabled"`
}

// Entry represents a single tracking entry
type Entry struct {
	ID        int         `json:"id" example:"1"`
	TrackerID int         `json:"trackerId" example:"1"`
	Type      TrackerType `json:"type" example:"habit"` // "habit" or "target"
	Value     float64     `json:"value"`                // For target trackers
	Done      *bool       `json:"done,omitempty"`       // For habit trackers (true/false)
	Date      time.Time   `json:"date" example:"2024-01-01T00:00:00Z"`
	Note      string      `json:"note,omitempty" example:"Felt great today"`
	CreatedAt time.Time   `json:"createdAt" example:"2024-01-01T10:00:00Z"`
}


type AddEntryRequest struct {
	Value float64 `json:"value,omitempty"`        // For target trackers
	Done  *bool   `json:"done,omitempty"`         // For habit trackers
	Date  string  `json:"date,omitempty" example:"2024-01-01T15:30:00Z"` // optional, defaults to now. Supports both date (YYYY-MM-DD) and datetime (RFC3339) formats
	Note  string  `json:"note,omitempty" example:"Felt great today"`
}
