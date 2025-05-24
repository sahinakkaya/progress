package router

import (
    "github.com/gorilla/mux"
    "routine-tracker/handlers"
)

// SetupGeneralRoutes configures general/shared routes
func SetupGeneralRoutes(api *mux.Router) {
    // Dashboard and overview routes
    RegisterAndHandle(api, "GET", "/dashboard", "Get today's due trackers", handlers.GetDashboard)
    
    // Combined data routes
    RegisterAndHandle(api, "GET", "/trackers", "Get all trackers combined", handlers.GetAllTrackers)
    RegisterAndHandle(api, "GET", "/entries", "Get all entries", handlers.GetAllEntries)
    RegisterAndHandle(api, "DELETE", "/entries/{id}", "Delete entry by ID", handlers.DeleteEntry)

    // Health check or status routes (optional)
    // api.HandleFunc("/health", handlers.HealthCheck).Methods("GET")
}
