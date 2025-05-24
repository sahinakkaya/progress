package handlers

import (
	"encoding/json"
	"net/http"
	"routine-tracker/database"
	"routine-tracker/trackers"
	"routine-tracker/trackers/habit"
	"routine-tracker/trackers/target"
	"strings"
	"time"
)

// GetAllTrackers gets all trackers
// @Summary Get all trackers (combined)
// @Description Retrieve all habit and target trackers
// @Tags General
// @Produce json
// @Success 200 {object} trackers.TrackersResponse
// @Router /trackers [get]
func GetAllTrackers(w http.ResponseWriter, r *http.Request) {
	habits, err := database.GetAllHabitTrackers()
	if err != nil {
		http.Error(w, "Failed to get habit trackers: "+err.Error(), http.StatusInternalServerError)
		return
	}

	targets, err := database.GetAllTargetTrackers()

	if err != nil {
		http.Error(w, "Failed to get target trackers: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Calculate current values for all target trackers
	for i := range targets {
		currentValue, err := database.CalculateCurrentValue(&targets[i])
		if err != nil {
			// Log error but continue with start value
			currentValue = targets[i].StartValue
		}
		targets[i].CurrentValue = &currentValue
	}

	response := trackers.TrackersResponse{
		HabitTrackers:  habits,
		TargetTrackers: targets,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetDashboard gets dashboard with trackers due for a specific date
// @Summary Get dashboard
// @Description Get trackers that are due for a specific date (defaults to today)
// @Tags General
// @Produce json
// @Param date query string false "Date in YYYY-MM-DD format (defaults to today)" example(2024-01-15)
// @Success 200 {object} trackers.DashboardResponse
// @Failure 400 {string} string "Bad Request"
// @Failure 500 {string} string "Internal Server Error"
// @Router /dashboard [get]
func GetDashboard(w http.ResponseWriter, r *http.Request) {
	// Parse date parameter or default to today
	var targetDate time.Time
	var err error

	dateParam := r.URL.Query().Get("date")
	if dateParam != "" {
		targetDate, err = time.Parse("2006-01-02", dateParam)
		if err != nil {
			http.Error(w, "Invalid date format. Please use YYYY-MM-DD format", http.StatusBadRequest)
			return
		}
	} else {
		targetDate = time.Now()
	}

	targetWeekday := strings.ToLower(targetDate.Weekday().String())

	habitTrackers, err := database.GetAllHabitTrackers()
	if err != nil {
		http.Error(w, "Failed to get habit trackers: "+err.Error(), http.StatusInternalServerError)
		return
	}

	targetTrackers, err := database.GetAllTargetTrackers()
	if err != nil {
		http.Error(w, "Failed to get target trackers: "+err.Error(), http.StatusInternalServerError)
		return
	}

	var dashboardHabits []habit.HabitTracker
	var dashboardTargets []target.TargetTracker

	// Check habit trackers
	for _, habit := range habitTrackers {
		if trackers.IsTrackerDueToday(habit.Due, habit.StartDate, targetDate, targetWeekday) {
			dashboardHabits = append(dashboardHabits, habit)
		}
	}

	// Check target trackers
	for _, target := range targetTrackers {
		if trackers.IsTrackerDueToday(target.Due, target.StartDate, targetDate, targetWeekday) {
			// Calculate current value for the target tracker
			currentValue, err := database.CalculateCurrentValue(&target)
			if err != nil {
				// Log error but continue with start value
				currentValue = target.StartValue
			}
			target.CurrentValue = &currentValue
			dashboardTargets = append(dashboardTargets, target)
		}
	}

	response := trackers.DashboardResponse{
		Date:           targetDate.Format("2006-01-02"),
		HabitTrackers:  dashboardHabits,
		TargetTrackers: dashboardTargets,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
