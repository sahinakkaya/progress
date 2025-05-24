package router

import (
    "github.com/gorilla/mux"
    httpSwagger "github.com/swaggo/http-swagger"
)

const APIPrefix = "/api"

// Setup creates and configures the main router with all routes
func Setup() *mux.Router {
    // Initialize main router
    r := mux.NewRouter()
    
    // Add Swagger documentation
    r.PathPrefix("/swagger/").Handler(httpSwagger.WrapHandler)
    
    // API routes subrouter
    api := r.PathPrefix(APIPrefix).Subrouter()
    
    // Setup route groups
    SetupHabitRoutes(api)
    SetupTargetRoutes(api)
    SetupGeneralRoutes(api)
    
    return r
}
