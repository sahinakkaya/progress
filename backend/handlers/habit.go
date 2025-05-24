package handlers

import (
	"encoding/json"
	"net/http"

	"routine-tracker/models"
	"github.com/gorilla/mux"
	"routine-tracker/database"
	"routine-tracker/trackers/habit"
	"strconv"
	"time"
)

// GetHabitTrackers gets all habit trackers
// @Summary Get all habit trackers
// @Description Retrieve all created habit trackers
// @Tags Habit Trackers
// @Produce json
// @Success 200 {array} habit.HabitTracker
// @Router /habit-trackers [get]
func GetHabitTrackers(w http.ResponseWriter, r *http.Request) {
	habits, err := database.GetAllHabitTrackers()
	if err != nil {
		http.Error(w, "Failed to get habit trackers: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(habits)
}


// GetHabitTracker gets a specific habit tracker by ID
// @Summary Get habit tracker by ID
// @Description Retrieve a specific habit tracker with all its details
// @Tags Habit Trackers
// @Produce json
// @Param id path int true "Habit Tracker ID"
// @Success 200 {object} habit.HabitTracker
// @Failure 400 {string} string "Bad Request"
// @Failure 404 {string} string "Not Found"
// @Router /habit-trackers/{id} [get]
func GetHabitTracker(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	trackerID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid tracker ID", http.StatusBadRequest)
		return
	}

	tracker, err := database.GetHabitTrackerByID(trackerID)
	if err != nil {
		http.Error(w, "Habit tracker not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tracker)
}

// CreateHabitTracker creates a new habit tracker
// @Summary Create habit tracker
// @Description Create a new habit tracker with specified configuration
// @Tags Habit Trackers
// @Accept json
// @Produce json
// @Param habit body habit.CreateHabitRequest true "Habit tracker configuration"
// @Success 201 {object} habit.HabitTracker
// @Failure 400 {string} string "Bad Request"
// @Router /habit-trackers [post]
func CreateHabitTracker(w http.ResponseWriter, r *http.Request) {
	var req habit.CreateHabitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Parse start date
	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		http.Error(w, "Invalid start_date format. Use YYYY-MM-DD", http.StatusBadRequest)
		return
	}

	// Set default reminder if none provided
	reminders := req.Reminders
	if len(reminders.Times) == 0 && reminders.Enabled {
		reminders = models.Reminder{
			Times:   []string{"18:00"},
			Enabled: true,
		}
	}

	tracker := habit.HabitTracker{
		TrackerName: req.TrackerName,
		Goal:        req.Goal,
		TimePeriod:  req.TimePeriod,
		StartDate:   startDate,
		Due:         req.Due,
		Reminders:   reminders,
		BadHabit:    req.BadHabit,
		GoalStreak:  req.GoalStreak,
		CreatedAt:   time.Now(),
	}

	created, err := database.CreateHabitTracker(tracker)
	if err != nil {
		http.Error(w, "Failed to create habit tracker: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(created)
}

// DeleteHabitTracker deletes a habit tracker and all its entries
// @Summary Delete habit tracker
// @Description Delete a specific habit tracker and all its associated entries
// @Tags Habit Trackers
// @Param id path int true "Habit Tracker ID"
// @Success 204 "No Content"
// @Failure 400 {string} string "Bad Request"
// @Failure 404 {string} string "Not Found"
// @Router /habit-trackers/{id} [delete]
func DeleteHabitTracker(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid tracker ID", http.StatusBadRequest)
		return
	}

	err = database.DeleteHabitTracker(id)
	if err != nil {
		http.Error(w, "Failed to delete habit tracker: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// UpdateHabitTracker updates a habit tracker
// @Summary Update habit tracker
// @Description Update a specific habit tracker (partial updates supported)
// @Tags Habit Trackers
// @Accept json
// @Produce json
// @Param id path int true "Habit Tracker ID"
// @Param habit body habit.UpdateHabitRequest true "Updated habit tracker data"
// @Success 200 {object} habit.HabitTracker
// @Failure 400 {string} string "Bad Request"
// @Failure 404 {string} string "Not Found"
// @Router /habit-trackers/{id} [put]
func UpdateHabitTracker(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	trackerID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid tracker ID", http.StatusBadRequest)
		return
	}

	var req habit.UpdateHabitRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	database.UpdateHabitTracker(trackerID, req)

	tracker, err := database.GetHabitTrackerByID(trackerID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tracker)
	return
}



// AddHabitEntry adds an entry to a habit tracker
// @Summary Add habit entry
// @Description Add a new entry to a specific habit tracker
// @Tags Habit Trackers
// @Accept json
// @Produce json
// @Param id path int true "Habit Tracker ID"
// @Param entry body models.AddEntryRequest true "Entry data"
// @Success 201 {object} models.Entry
// @Failure 400 {string} string "Bad Request"
// @Failure 404 {string} string "Not Found"
// @Router /habit-trackers/{id}/entries [post]
func AddHabitEntry(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	trackerID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid tracker ID", http.StatusBadRequest)
		return
	}
	
	// Check if habit tracker exists using database
	_, err = database.GetHabitTrackerByID(trackerID)
	if err != nil {
		http.Error(w, "Habit tracker not found", http.StatusNotFound)
		return
	}
	
	var req models.AddEntryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
	
	// Parse date or use now
	var entryDate time.Time
	if req.Date != "" {
		// Try RFC3339 format first (datetime with timezone)
		entryDate, err = time.Parse(time.RFC3339, req.Date)
		if err != nil {
			// Try date-only format - assume local timezone, then convert to UTC
			localDate, err := time.Parse("2006-01-02", req.Date)
			if err != nil {
				http.Error(w, "Invalid date format. Use YYYY-MM-DD or RFC3339 (2006-01-02T15:04:05Z07:00)", http.StatusBadRequest)
				return
			}
			// For date-only, use current time but with the specified date
			now := time.Now()
			entryDate = time.Date(localDate.Year(), localDate.Month(), localDate.Day(), 
				now.Hour(), now.Minute(), now.Second(), now.Nanosecond(), now.Location())
		}
		// Convert to UTC for consistent storage
		entryDate = entryDate.UTC()
	} else {
		entryDate = time.Now().UTC()
	}
	
	done := true // Default to true (yes)
	if req.Done != nil {
		done = *req.Done
	}
	
	entry := models.Entry{
		TrackerID: trackerID,
		Type:      models.HABIT,
		Done:      &done,
		Date:      entryDate,
		Note:      req.Note,
		CreatedAt: time.Now(),
	}
	
	// Use your database helper
	createdEntry, err := database.CreateEntry(entry)
	if err != nil {
		http.Error(w, "Failed to create entry: "+err.Error(), http.StatusInternalServerError)
		return
	}
	
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(createdEntry)
}
