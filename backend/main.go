package main

import (
	"log"
	"net/http"
	"routine-tracker/database"
  "routine-tracker/router"

	"github.com/rs/cors"
	_ "routine-tracker/docs" // This will be generated
)


// @title Habit & Target Tracker API
// @version 1.0
// @description API for managing habit and target trackers
// @host localhost:8080
// @BasePath /api

func main() {
	if err := database.Init(); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer database.Close()
	// Initialize router
  r := router.Setup()

	// Setup CORS
	c := cors.New(cors.Options{
		AllowedOrigins: []string{
			"http://localhost:5173",  // Vite dev server
			"http://localhost:5174",  // Vite dev server
			"http://localhost:3000",  // Docker serve
			"http://192.168.1.101:5173", // Mobile testing
			"https://my-progress.sahinakkaya.dev", // Personal instance
			"https://progress.sahinakkaya.dev",    // Showcase instance
		},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	handler := c.Handler(r)
  router.PrintRoutes("8080")


	log.Fatal(http.ListenAndServe(":8080", handler))
}
