package trackers


import (
	"routine-tracker/models"
	"time"
  "strings"
)

// Helper function to determine if a tracker is due today
func IsTrackerDueToday(due models.Due, startDate time.Time, today time.Time, todayWeekday string) bool {
	// If start date is in the future, not due yet
	if startDate.After(today) {
		return false
	}

	switch due.Type {
	case models.SPECIFIC_DAYS:
		// Check if today's weekday is in the specific days list
		for _, day := range due.SpecificDays {
			if strings.ToLower(day) == todayWeekday {
				return true
			}
		}
		return false

	case models.INTERVAL:
		daysSinceStart := int(today.Sub(startDate).Hours() / 24)

		switch due.IntervalType {
		case "day":
			return daysSinceStart%due.IntervalValue == 0
		case "week":
			weeksSinceStart := daysSinceStart / 7
			return weeksSinceStart%due.IntervalValue == 0
		case "month":
			// Simplified month calculation
			monthsSinceStart := (today.Year()-startDate.Year())*12 + int(today.Month()-startDate.Month())
			return monthsSinceStart%due.IntervalValue == 0
		case "year":
			yearsSinceStart := today.Year() - startDate.Year()
			return yearsSinceStart%due.IntervalValue == 0
		}
	}

	return false
}
