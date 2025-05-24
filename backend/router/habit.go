package router

import (
	"github.com/gorilla/mux"
	"net/http"
	"routine-tracker/handlers"
)

// SetupHabitRoutes configures all habit tracker routes
func SetupHabitRoutes(api *mux.Router) {

	RegisterAndHandle(api, "GET", "/habit-trackers", "Get all habit trackers", handlers.GetHabitTrackers)
	RegisterAndHandle(api, "POST", "/habit-trackers", "Create new habit tracker", handlers.CreateHabitTracker)
	RegisterAndHandle(api, "GET", "/habit-trackers/{id}", "Get specific habit tracker", handlers.GetHabitTracker)
	RegisterAndHandle(api, "PUT", "/habit-trackers/{id}", "Update habit tracker", handlers.UpdateHabitTracker)
	RegisterAndHandle(api, "DELETE", "/habit-trackers/{id}", "Delete habit tracker", handlers.DeleteHabitTracker)
	RegisterAndHandle(api, "POST", "/habit-trackers/{id}/entries", "Add habit entry", handlers.AddHabitEntry)
	RegisterAndHandle(api, "GET", "/habit-trackers/{id}/entries", "Get habit entries",
		func(w http.ResponseWriter, r *http.Request) {
			vars := mux.Vars(r)
			vars["type"] = "habit"
			handlers.GetTrackerEntries(w, r.WithContext(r.Context()))
		})
}
