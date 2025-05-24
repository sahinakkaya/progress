package tests

import (
	"encoding/json"
	"net/http"
	"strings"
	"testing"
	"time"

	"routine-tracker/models"
	"routine-tracker/trackers"
	"routine-tracker/trackers/habit"
	"routine-tracker/trackers/target"
)

func TestDashboardSpecificDays(t *testing.T) {
	today := time.Now()
	todayWeekday := strings.ToLower(today.Weekday().String())

	// Create a habit that should appear today
	habitRequest := habit.CreateHabitRequest{
		TrackerName: "Dashboard Test Habit",
		Goal:        1,
		TimePeriod:  "perDay",
		StartDate:   time.Now().AddDate(0, 0, -1).Format("2006-01-02"), // Started yesterday
		Due: models.Due{
			Type:         "specificDays",
			SpecificDays: []string{todayWeekday}, // Should appear today
		},
	}

	// Create a target that should NOT appear today
	otherDay := "sunday"
	if todayWeekday == "sunday" {
		otherDay = "monday"
	}

	targetRequest := target.CreateTargetRequest{
		TrackerName: "Dashboard Test Target",
		StartValue:  0,
		GoalValue:   100,
		StartDate:   time.Now().AddDate(0, 0, -1).Format("2006-01-02"),
		GoalDate:    time.Now().AddDate(0, 1, 0).Format("2006-01-02"),
		AddToTotal:  true,
		Due: models.Due{
			Type:         "specificDays",
			SpecificDays: []string{otherDay}, // Should NOT appear today
		},
	}

	// Create both trackers
	makeRequest("POST", "/api/habit-trackers", habitRequest)
	makeRequest("POST", "/api/target-trackers", targetRequest)

	// Get dashboard
	dashboardRr, err := makeRequest("GET", "/api/dashboard", nil)
	if err != nil {
		t.Fatal(err)
	}

	if dashboardRr.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, dashboardRr.Code)
	}

	var dashboard trackers.DashboardResponse
	if err := json.Unmarshal(dashboardRr.Body.Bytes(), &dashboard); err != nil {
		t.Fatalf("Failed to parse dashboard response: %v", err)
	}

	// Verify dashboard date
	expectedDate := today.Format("2006-01-02")
	if dashboard.Date != expectedDate {
		t.Errorf("Expected date %s, got %s", expectedDate, dashboard.Date)
	}

	// Verify habit tracker appears (due today)
	found := false
	for _, habit := range dashboard.HabitTrackers {
		if habit.TrackerName == "Dashboard Test Habit" {
			found = true
			break
		}
	}
	if !found {
		t.Error("Expected habit tracker to appear on dashboard (due today)")
	}

	// Verify target tracker does NOT appear (not due today)
	found = false
	for _, target := range dashboard.TargetTrackers {
		if target.TrackerName == "Dashboard Test Target" {
			found = true
			break
		}
	}
	if found {
		t.Error("Expected target tracker to NOT appear on dashboard (not due today)")
	}
}

func TestDashboardInterval(t *testing.T) {
	// Create a habit with interval: every 1 day (should appear today)
	habitRequest := habit.CreateHabitRequest{
		TrackerName: "Interval Test Habit",
		Goal:        1,
		TimePeriod:  "perDay",
		StartDate:   time.Now().Format("2006-01-02"), // Started today
		Due: models.Due{
			Type:          "interval",
			IntervalType:  "day",
			IntervalValue: 1, // Every day
		},
	}

	// Create a target with interval: every 7 days
	targetRequest := target.CreateTargetRequest{
		TrackerName: "Interval Test Target",
		StartValue:  0,
		GoalValue:   50,
		StartDate:   time.Now().AddDate(0, 0, -7).Format("2006-01-02"), // Started 7 days ago
		GoalDate:    time.Now().AddDate(0, 1, 0).Format("2006-01-02"),
		AddToTotal:  true,
		Due: models.Due{
			Type:          "interval",
			IntervalType:  "day",
			IntervalValue: 7, // Every 7 days
		},
	}

	// Create both trackers
	makeRequest("POST", "/api/habit-trackers", habitRequest)
	makeRequest("POST", "/api/target-trackers", targetRequest)

	// Get dashboard
	dashboardRr, err := makeRequest("GET", "/api/dashboard", nil)
	if err != nil {
		t.Fatal(err)
	}

	var dashboard trackers.DashboardResponse
	json.Unmarshal(dashboardRr.Body.Bytes(), &dashboard)

	// Verify habit tracker appears (every day)
	habitFound := false
	for _, habit := range dashboard.HabitTrackers {
		if habit.TrackerName == "Interval Test Habit" {
			habitFound = true
			break
		}
	}
	if !habitFound {
		t.Error("Expected habit tracker with daily interval to appear on dashboard")
	}

	// Verify target tracker appears (every 7 days, started 7 days ago)
	targetFound := false
	for _, target := range dashboard.TargetTrackers {
		if target.TrackerName == "Interval Test Target" {
			targetFound = true
			break
		}
	}
	if !targetFound {
		t.Error("Expected target tracker with 7-day interval to appear on dashboard")
	}
}

func TestDashboardFutureStartDate(t *testing.T) {
	// Create a habit that starts in the future (should NOT appear)
	habitRequest := habit.CreateHabitRequest{
		TrackerName: "Future Habit",
		Goal:        1,
		TimePeriod:  "perDay",
		StartDate:   time.Now().AddDate(0, 0, 1).Format("2006-01-02"), // Starts tomorrow
		Due: models.Due{
			Type:         "specificDays",
			SpecificDays: []string{strings.ToLower(time.Now().Weekday().String())},
		},
	}

	makeRequest("POST", "/api/habit-trackers", habitRequest)

	// Get dashboard
	dashboardRr, err := makeRequest("GET", "/api/dashboard", nil)
	if err != nil {
		t.Fatal(err)
	}

	var dashboard trackers.DashboardResponse
	json.Unmarshal(dashboardRr.Body.Bytes(), &dashboard)

	// Verify future habit does NOT appear
	for _, habit := range dashboard.HabitTrackers {
		if habit.TrackerName == "Future Habit" {
			t.Error("Expected future habit to NOT appear on dashboard")
		}
	}
}

// TestDashboardWithDateParameter tests the dashboard with a specific date parameter
func TestDashboardWithDateParameter(t *testing.T) {
	// Use a specific date for testing (e.g., a Monday)
	testDate := time.Date(2024, 1, 15, 0, 0, 0, 0, time.UTC) // Monday, January 15, 2024
	testDateStr := testDate.Format("2006-01-02")
	testWeekday := "monday"

	// Create a habit that should appear on Mondays
	habitRequest := habit.CreateHabitRequest{
		TrackerName: "Monday Habit",
		Goal:        1,
		TimePeriod:  "perDay",
		StartDate:   "2024-01-01", // Started before test date
		Due: models.Due{
			Type:         "specificDays",
			SpecificDays: []string{testWeekday},
		},
	}

	// Create a target that should appear on Mondays
	targetRequest := target.CreateTargetRequest{
		TrackerName: "Monday Target",
		StartValue:  0,
		GoalValue:   100,
		StartDate:   "2024-01-01",
		GoalDate:    "2024-12-31",
		AddToTotal:  true,
		Due: models.Due{
			Type:         "specificDays",
			SpecificDays: []string{testWeekday},
		},
	}

	// Create both trackers
	makeRequest("POST", "/api/habit-trackers", habitRequest)
	makeRequest("POST", "/api/target-trackers", targetRequest)

	// Get dashboard for the specific date
	dashboardRr, err := makeRequest("GET", "/api/dashboard?date="+testDateStr, nil)
	if err != nil {
		t.Fatal(err)
	}

	if dashboardRr.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, dashboardRr.Code)
	}

	var dashboard trackers.DashboardResponse
	if err := json.Unmarshal(dashboardRr.Body.Bytes(), &dashboard); err != nil {
		t.Fatalf("Failed to parse dashboard response: %v", err)
	}

	// Verify the date in response matches requested date
	if dashboard.Date != testDateStr {
		t.Errorf("Expected date %s, got %s", testDateStr, dashboard.Date)
	}

	// Verify Monday habit appears
	habitFound := false
	for _, habit := range dashboard.HabitTrackers {
		if habit.TrackerName == "Monday Habit" {
			habitFound = true
			break
		}
	}
	if !habitFound {
		t.Error("Expected Monday habit to appear on dashboard for Monday date")
	}

	// Verify Monday target appears
	targetFound := false
	for _, target := range dashboard.TargetTrackers {
		if target.TrackerName == "Monday Target" {
			targetFound = true
			break
		}
	}
	if !targetFound {
		t.Error("Expected Monday target to appear on dashboard for Monday date")
	}
}

// TestDashboardWithInvalidDateFormat tests error handling for invalid date formats
func TestDashboardWithInvalidDateFormat(t *testing.T) {
	invalidDates := []string{
		"2024/01/15",    // Wrong separator
		"15-01-2024",    // Wrong order
		"2024-1-15",     // Missing zero padding
		"invalid-date",  // Completely invalid
		"2024-13-01",    // Invalid month
		"2024-01-32",    // Invalid day
	}

	for _, invalidDate := range invalidDates {
		dashboardRr, err := makeRequest("GET", "/api/dashboard?date="+invalidDate, nil)
		if err != nil {
			t.Fatal(err)
		}

		if dashboardRr.Code != http.StatusBadRequest {
			t.Errorf("Expected status %d for invalid date %s, got %d", 
				http.StatusBadRequest, invalidDate, dashboardRr.Code)
		}

		// Check error message contains format information
		responseBody := dashboardRr.Body.String()
		if !strings.Contains(responseBody, "YYYY-MM-DD") {
			t.Errorf("Expected error message to mention YYYY-MM-DD format for date %s", invalidDate)
		}
	}
}

// TestDashboardDateVsTodayComparison tests that different dates return different results
func TestDashboardDateVsTodayComparison(t *testing.T) {
	// Create a habit that appears only on Sundays
	habitRequest := habit.CreateHabitRequest{
		TrackerName: "Sunday Only Habit",
		Goal:        1,
		TimePeriod:  "perDay",
		StartDate:   "2024-01-01",
		Due: models.Due{
			Type:         "specificDays",
			SpecificDays: []string{"sunday"},
		},
	}

	makeRequest("POST", "/api/habit-trackers", habitRequest)

	// Test Sunday date (should appear)
	sundayDate := "2024-01-14" // A Sunday
	sundayRr, err := makeRequest("GET", "/api/dashboard?date="+sundayDate, nil)
	if err != nil {
		t.Fatal(err)
	}

	var sundayDashboard trackers.DashboardResponse
	json.Unmarshal(sundayRr.Body.Bytes(), &sundayDashboard)

	// Test Monday date (should NOT appear)
	mondayDate := "2024-01-15" // A Monday
	mondayRr, err := makeRequest("GET", "/api/dashboard?date="+mondayDate, nil)
	if err != nil {
		t.Fatal(err)
	}

	var mondayDashboard trackers.DashboardResponse
	json.Unmarshal(mondayRr.Body.Bytes(), &mondayDashboard)

	// Count Sunday habit occurrences
	sundayHabitCount := 0
	mondayHabitCount := 0

	for _, habit := range sundayDashboard.HabitTrackers {
		if habit.TrackerName == "Sunday Only Habit" {
			sundayHabitCount++
		}
	}

	for _, habit := range mondayDashboard.HabitTrackers {
		if habit.TrackerName == "Sunday Only Habit" {
			mondayHabitCount++
		}
	}

	if sundayHabitCount != 1 {
		t.Errorf("Expected Sunday habit to appear once on Sunday, got %d", sundayHabitCount)
	}

	if mondayHabitCount != 0 {
		t.Errorf("Expected Sunday habit to NOT appear on Monday, got %d", mondayHabitCount)
	}
}

// TestDashboardWithIntervalAndSpecificDate tests interval-based trackers with specific dates
func TestDashboardWithIntervalAndSpecificDate(t *testing.T) {
	startDate := "2024-01-01" // Start date

	// Create habit with 3-day interval
	habitRequest := habit.CreateHabitRequest{
		TrackerName: "Every 3 Days Habit",
		Goal:        1,
		TimePeriod:  "perDay",
		StartDate:   startDate,
		Due: models.Due{
			Type:          "interval",
			IntervalType:  "day",
			IntervalValue: 3,
		},
	}

	makeRequest("POST", "/api/habit-trackers", habitRequest)

	// Test dates that should match the interval
	testCases := []struct {
		date         string
		shouldAppear bool
		description  string
	}{
		{"2024-01-01", true, "start date"},
		{"2024-01-04", true, "3 days after start"},
		{"2024-01-07", true, "6 days after start"},
		{"2024-01-03", false, "2 days after start"},
		{"2024-01-06", false, "5 days after start"},
	}

	for _, tc := range testCases {
		dashboardRr, err := makeRequest("GET", "/api/dashboard?date="+tc.date, nil)
		if err != nil {
			t.Fatal(err)
		}

		var dashboard trackers.DashboardResponse
		json.Unmarshal(dashboardRr.Body.Bytes(), &dashboard)

		habitFound := false
		for _, habit := range dashboard.HabitTrackers {
			if habit.TrackerName == "Every 3 Days Habit" {
				habitFound = true
				break
			}
		}

		if habitFound != tc.shouldAppear {
			t.Errorf("For date %s (%s): expected habit found=%t, got %t", 
				tc.date, tc.description, tc.shouldAppear, habitFound)
		}
	}
}

// TestDashboardDefaultsToToday tests that dashboard without date parameter uses today
func TestDashboardDefaultsToToday(t *testing.T) {
	today := time.Now()
	todayStr := today.Format("2006-01-02")

	// Get dashboard without date parameter
	dashboardRr, err := makeRequest("GET", "/api/dashboard", nil)
	if err != nil {
		t.Fatal(err)
	}

	if dashboardRr.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, dashboardRr.Code)
	}

	var dashboard trackers.DashboardResponse
	if err := json.Unmarshal(dashboardRr.Body.Bytes(), &dashboard); err != nil {
		t.Fatalf("Failed to parse dashboard response: %v", err)
	}

	// The date should be today's date
	if dashboard.Date != todayStr {
		t.Errorf("Expected dashboard date to be today (%s), got %s", todayStr, dashboard.Date)
	}
}
