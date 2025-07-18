package handlers

import (
	"encoding/json"
  // "fmt"
	"github.com/gorilla/mux"

	"net/http"
	"routine-tracker/database"
	"routine-tracker/models"
	"routine-tracker/trackers/target"
	"strconv"
	"time"
)

// GetTargetTrackers gets all target trackers
// @Summary Get all target trackers
// @Description Retrieve all created target trackers
// @Tags Target Trackers
// @Produce json
// @Success 200 {array} target.TargetTracker
// @Router /target-trackers [get]
func GetTargetTrackers(w http.ResponseWriter, r *http.Request) {
	targets, err := database.GetAllTargetTrackers()
	if err != nil {
		http.Error(w, "Failed to get target trackers: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Calculate current values and adjust start values for all target trackers
	for i := range targets {
		currentValue, err := database.CalculateCurrentValue(&targets[i])
		if err != nil {
			// Log error but continue with start value
			currentValue = targets[i].StartValue
		}
		targets[i].CurrentValue = &currentValue

		// Set original start value (always the database value)
		targets[i].OriginalStartValue = targets[i].StartValue

		// Adjust start value if UseActualBounds is true
		if targets[i].UseActualBounds {
			adjustedStartValue, err := database.GetAdjustedStartValue(&targets[i])
			if err == nil {
				targets[i].StartValue = adjustedStartValue
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(targets)
}

// GetTargetTracker gets a specific target tracker by ID
// @Summary Get target tracker by ID
// @Description Retrieve a specific target tracker with all its details
// @Tags Target Trackers
// @Produce json
// @Param id path int true "Target Tracker ID"
// @Success 200 {object} target.TargetTracker
// @Failure 400 {string} string "Bad Request"
// @Failure 404 {string} string "Not Found"
// @Router /target-trackers/{id} [get]
func GetTargetTracker(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	trackerID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid tracker ID", http.StatusBadRequest)
		return
	}

	tracker, err := database.GetTargetTrackerByID(trackerID)
	if err != nil {
		http.Error(w, "Target tracker not found", http.StatusNotFound)
		return
	}

	// Calculate current value for the target tracker
	currentValue, err := database.CalculateCurrentValue(tracker)
	if err != nil {
		// Log error but continue with start value
		currentValue = tracker.StartValue
	}
	tracker.CurrentValue = &currentValue

	// Set original start value (always the database value)
	tracker.OriginalStartValue = tracker.StartValue

	// Adjust start value if UseActualBounds is true
	if tracker.UseActualBounds {
		adjustedStartValue, err := database.GetAdjustedStartValue(tracker)
		if err == nil {
			tracker.StartValue = adjustedStartValue
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tracker)
}

// CreateTargetTracker creates a new target tracker
// @Summary Create target tracker
// @Description Create a new target tracker with specified configuration
// @Tags Target Trackers
// @Accept json
// @Produce json
// @Param target body target.CreateTargetRequest true "Target tracker configuration"
// @Success 201 {object} target.TargetTracker
// @Failure 400 {string} string "Bad Request"
// @Router /target-trackers [post]
func CreateTargetTracker(w http.ResponseWriter, r *http.Request) {
	var req target.CreateTargetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Parse dates
	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		http.Error(w, "Invalid start_date format. Use YYYY-MM-DD", http.StatusBadRequest)
		return
	}

	goalDate, err := time.Parse("2006-01-02", req.GoalDate)
	if err != nil {
		http.Error(w, "Invalid goal_date format. Use YYYY-MM-DD", http.StatusBadRequest)
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

	tracker := target.TargetTracker{
		TrackerName:     req.TrackerName,
		StartValue:      req.StartValue,
		GoalValue:       req.GoalValue,
		StartDate:       startDate,
		GoalDate:        goalDate,
		AddToTotal:      req.AddToTotal,
		UseActualBounds: false, // Default to false for new targets
		Due:             req.Due,
		Reminders:       reminders,
		CreatedAt:       time.Now(),
	}

	created, err := database.CreateTargetTracker(tracker)
	if err != nil {
		http.Error(w, "Failed to create target tracker: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(created)
}


// UpdateTargetTracker updates a target tracker
// @Summary Update target tracker
// @Description Update a specific target tracker (partial updates supported)
// @Tags Target Trackers
// @Accept json
// @Produce json
// @Param id path int true "Target Tracker ID"
// @Param target body target.UpdateTargetRequest true "Updated target tracker data"
// @Success 200 {object} target.TargetTracker
// @Failure 400 {string} string "Bad Request"
// @Failure 404 {string} string "Not Found"
// @Router /target-trackers/{id} [put]
func UpdateTargetTracker(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	trackerID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid tracker ID", http.StatusBadRequest)
		return
	}

	var req target.UpdateTargetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON: "+err.Error(), http.StatusBadRequest)
		return
	}
  // fmt.Println(req.Due.SpecificDays)
  database.UpdateTargetTracker(trackerID, req)


	tracker, err := database.GetTargetTrackerByID(trackerID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tracker)
	return
}


// DeleteTargetTracker deletes a target tracker and all its entries
// @Summary Delete target tracker
// @Description Delete a specific target tracker and all its associated entries
// @Tags Target Trackers
// @Param id path int true "Target Tracker ID"
// @Success 204 "No Content"
// @Failure 400 {string} string "Bad Request"
// @Failure 404 {string} string "Not Found"
// @Router /target-trackers/{id} [delete]
func DeleteTargetTracker(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	trackerID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid tracker ID", http.StatusBadRequest)
		return
	}

  err = database.DeleteTargetTracker(trackerID)


	if err != nil {
		http.Error(w, "Failed to delete target tracker: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}


// AddTargetEntry adds an entry to a target tracker
// @Summary Add target entry
// @Description Add a new entry to a specific target tracker
// @Tags Target Trackers
// @Accept json
// @Produce json
// @Param id path int true "Target Tracker ID"
// @Param entry body models.AddEntryRequest true "Entry data"
// @Success 201 {object} models.Entry
// @Failure 400 {string} string "Bad Request"
// @Failure 404 {string} string "Not Found"
// @Router /target-trackers/{id}/entries [post]
func AddTargetEntry(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	trackerID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid tracker ID", http.StatusBadRequest)
		return
	}
	
	// Check if target tracker exists using database
	_, err = database.GetTargetTrackerByID(trackerID)
	if err != nil {
		http.Error(w, "Target tracker not found", http.StatusNotFound)
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
	
	entry := models.Entry{
		TrackerID: trackerID,
		Type:      models.TARGET,
		Value:     req.Value,
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
