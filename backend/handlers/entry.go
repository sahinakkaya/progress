package handlers

import (
	"encoding/json"
	"github.com/gorilla/mux"
	"net/http"
  "routine-tracker/database"
	"strconv"
)


// GetAllEntries gets all entries
// @Summary Get all entries
// @Description Retrieve all tracking entries
// @Tags General
// @Produce json
// @Success 200 {array} models.Entry
// @Router /entries [get]
func GetAllEntries(w http.ResponseWriter, r *http.Request) {
  entries, _ := database.GetAllEntries()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(entries)
}

// GetTrackerEntries gets entries for a specific tracker
// @Summary Get tracker entries
// @Description Get all entries for a specific tracker
// @Tags General
// @Produce json
// @Param type path string true "Tracker type" Enums(habit, target)
// @Param id path int true "Tracker ID"
// @Success 200 {array} models.Entry
// @Failure 400 {string} string "Bad Request"
// @Router /{type}-trackers/{id}/entries [get]
func GetTrackerEntries(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	trackerID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid tracker ID", http.StatusBadRequest)
		return
	}

	trackerType := vars["type"]
	if trackerType != "habit" && trackerType != "target" {
		http.Error(w, "Invalid tracker type. Use 'habit' or 'target'", http.StatusBadRequest)
		return
	}

  entries, err := database.GetEntriesByTracker(trackerID, trackerType)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(entries)
}

// DeleteEntry deletes a specific entry
// @Summary Delete entry
// @Description Delete a specific entry by ID
// @Tags General
// @Param id path int true "Entry ID"
// @Success 204 "No Content"
// @Failure 400 {string} string "Bad Request"
// @Failure 404 {string} string "Entry not found"
// @Router /entries/{id} [delete]
func DeleteEntry(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	entryID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid entry ID", http.StatusBadRequest)
		return
	}

	err = database.DeleteEntry(entryID)
	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			http.Error(w, "Entry not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to delete entry", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// BulkDeleteEntries deletes multiple entries
// @Summary Bulk delete entries
// @Description Delete multiple entries by their IDs
// @Tags General
// @Accept json
// @Param ids body []int true "Array of entry IDs to delete"
// @Success 204 "No Content"
// @Failure 400 {string} string "Bad Request"
// @Router /entries [delete]
func BulkDeleteEntries(w http.ResponseWriter, r *http.Request) {
	var entryIDs []int
	
	if err := json.NewDecoder(r.Body).Decode(&entryIDs); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	if len(entryIDs) == 0 {
		http.Error(w, "No entry IDs provided", http.StatusBadRequest)
		return
	}
	
	err := database.BulkDeleteEntries(entryIDs)
	if err != nil {
		http.Error(w, "Failed to delete entries", http.StatusInternalServerError)
		return
	}
	
	w.WriteHeader(http.StatusNoContent)
}
