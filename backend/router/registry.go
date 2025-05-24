package router

import (
    "fmt"
    "net/http"
    "sort"
    "strings"

    "github.com/gorilla/mux"
)

type Route struct {
    Method      string
    Path        string
    Description string
}

var routeRegistry []Route

// RegisterAndHandle registers a route and sets up the handler in one call
func RegisterAndHandle(api *mux.Router, method, path, description string, handler func(http.ResponseWriter, *http.Request)) {
    // Register for documentation
    RegisterRoute(method, path, description)
    
    // Setup the actual route handler
    api.HandleFunc(path, handler).Methods(method)
}

// RegisterRoute adds a route to the registry for documentation (keep for flexibility)
func RegisterRoute(method, path, description string) {
    routeRegistry = append(routeRegistry, Route{
        Method:      method,
        Path:        APIPrefix + path,
        Description: description,
    })
}

// PrintRoutes displays all registered routes in a nice format
func PrintRoutes(port string) {
    fmt.Println("🎯 Habit & Target Tracker API Server")
    fmt.Printf("📊 Server starting on :%s\n", port)
    fmt.Println("🚀 Available API endpoints:")
    fmt.Println()
    
    // Group routes by category
    categories := make(map[string][]Route)
    
    for _, route := range routeRegistry {
        category := getRouteCategory(route.Path)
        categories[category] = append(categories[category], route)
    }
    
    // Print routes by category
    categoryOrder := []string{"Habit Trackers", "Target Trackers", "General"}
    for _, category := range categoryOrder {
        if routes, exists := categories[category]; exists {
            fmt.Printf("   📋 %s:\n", category)
            
            // Sort routes within category
            sort.Slice(routes, func(i, j int) bool {
                return routes[i].Path < routes[j].Path
            })
            
            for _, route := range routes {
                methodColor := getMethodColor(route.Method)
                fmt.Printf("      %s %-6s %s%s %s\n", 
                    methodColor, route.Method, "\033[0m", route.Path, route.Description)
            }
            fmt.Println()
        }
    }
    
    fmt.Printf("📖 Swagger UI: http://localhost:%s/swagger/\n", port)
}

func getRouteCategory(path string) string {
    if strings.Contains(path, "habit-trackers") {
        return "Habit Trackers"
    } else if strings.Contains(path, "target-trackers") {
        return "Target Trackers"
    }
    return "General"
}

func getMethodColor(method string) string {
    switch method {
    case "GET":
        return "\033[32m"    // Green
    case "POST":
        return "\033[34m"    // Blue
    case "PUT":
        return "\033[33m"    // Yellow
    case "DELETE":
        return "\033[31m"    // Red
    default:
        return "\033[0m"     // Default
    }
}
