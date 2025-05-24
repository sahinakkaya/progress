package router

import (
	"github.com/gorilla/mux"
	"net/http"
	"routine-tracker/handlers"
)

func SetupTargetRoutes(api *mux.Router) {
	// Target tracker routes
	RegisterAndHandle(api, "GET", "/target-trackers", "Get all target trackers", handlers.GetTargetTrackers)
	RegisterAndHandle(api, "POST", "/target-trackers", "Create new target tracker", handlers.CreateTargetTracker)
	RegisterAndHandle(api, "GET", "/target-trackers/{id}", "Get specific target tracker", handlers.GetTargetTracker)
	RegisterAndHandle(api, "PUT", "/target-trackers/{id}", "Update target tracker", handlers.UpdateTargetTracker)
	RegisterAndHandle(api, "DELETE", "/target-trackers/{id}", "Delete target tracker", handlers.DeleteTargetTracker)
	RegisterAndHandle(api, "POST", "/target-trackers/{id}/entries", "Add target entry", handlers.AddTargetEntry)
	RegisterAndHandle(api, "GET", "/target-trackers/{id}/entries", "Get target entries",
		func(w http.ResponseWriter, r *http.Request) {
			vars := mux.Vars(r)
			vars["type"] = "target"
			handlers.GetTrackerEntries(w, r.WithContext(r.Context()))
		})
}
