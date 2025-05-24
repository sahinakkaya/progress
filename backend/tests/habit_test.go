package tests

import (
	"encoding/json"
	"fmt"
	"net/http"
	"testing"
	"time"

	"routine-tracker/models"
	"routine-tracker/trackers/habit"
)

func TestCreateHabitTracker(t *testing.T) {
	// Test data
	habitRequest := habit.CreateHabitRequest{
		TrackerName: "Drink Water",
		Goal:        8,
		TimePeriod:  "perDay",
		StartDate:   time.Now().Format("2006-01-02"),
		Due: models.Due{
			Type:         "specificDays",
			SpecificDays: []string{"monday", "tuesday", "wednesday", "thursday", "friday"},
		},
		BadHabit:   false,
		GoalStreak: func() *int { i := 30; return &i }(),
	}

	// Make request
	rr, err := makeRequest("POST", "/api/habit-trackers", habitRequest)
	if err != nil {
		t.Fatal(err)
	}

	// Check status code
	if rr.Code != http.StatusCreated {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusCreated, rr.Code, rr.Body.String())
	}

	// Parse response
	var createdHabit habit.HabitTracker
	if err := json.Unmarshal(rr.Body.Bytes(), &createdHabit); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	// Verify response
	if createdHabit.TrackerName != "Drink Water" {
		t.Errorf("Expected TrackerName 'Drink Water', got '%s'", createdHabit.TrackerName)
	}
	if createdHabit.Goal != 8 {
		t.Errorf("Expected Goal 8, got %f", createdHabit.Goal)
	}
	if createdHabit.ID == 0 {
		t.Error("Expected ID to be set")
	}
}

func TestGetHabitTrackers(t *testing.T) {
	// First create a habit tracker
	habitRequest := habit.CreateHabitRequest{
		TrackerName: "Exercise",
		Goal:        1,
		TimePeriod:  "perDay",
		StartDate:   time.Now().Format("2006-01-02"),
		Due: models.Due{
			Type:          "interval",
			IntervalType:  "day",
			IntervalValue: 2,
		},
	}

	// Create the habit
	_, err := makeRequest("POST", "/api/habit-trackers", habitRequest)
	if err != nil {
		t.Fatal(err)
	}

	// Get all habits
	rr, err := makeRequest("GET", "/api/habit-trackers", nil)
	if err != nil {
		t.Fatal(err)
	}

	if rr.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, rr.Code)
	}

	var habits []habit.HabitTracker
	if err := json.Unmarshal(rr.Body.Bytes(), &habits); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if len(habits) == 0 {
		t.Error("Expected at least one habit tracker")
	}
}

func TestAddHabitEntry(t *testing.T) {
	// Create a habit first
	habitRequest := habit.CreateHabitRequest{
		TrackerName: "Read Book",
		Goal:        1,
		TimePeriod:  "perDay",
		StartDate:   time.Now().Format("2006-01-02"),
		Due: models.Due{
			Type:         "specificDays",
			SpecificDays: []string{"sunday"},
		},
	}

	createRr, err := makeRequest("POST", "/api/habit-trackers", habitRequest)
	if err != nil {
		t.Fatal(err)
	}

	var createdHabit habit.HabitTracker
	json.Unmarshal(createRr.Body.Bytes(), &createdHabit)

	// Add entry to the habit
	entryRequest := models.AddEntryRequest{
		Done: func() *bool { b := true; return &b }(),
		Note: "Finished chapter 1",
	}

	entryRr, err := makeRequest("POST", fmt.Sprintf("/api/habit-trackers/%d/entries", createdHabit.ID), entryRequest)
	if err != nil {
		t.Fatal(err)
	}

	if entryRr.Code != http.StatusCreated {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusCreated, entryRr.Code, entryRr.Body.String())
	}

	var entry models.Entry
	if err := json.Unmarshal(entryRr.Body.Bytes(), &entry); err != nil {
		t.Fatalf("Failed to parse entry response: %v", err)
	}

	if entry.TrackerID != createdHabit.ID {
		t.Errorf("Expected TrackerID %d, got %d", createdHabit.ID, entry.TrackerID)
	}
	if entry.Done == nil || !*entry.Done {
		t.Error("Expected Done to be true")
	}
}

func TestDeleteHabitTracker(t *testing.T) {
	// Create a habit first
	habitRequest := habit.CreateHabitRequest{
		TrackerName: "Test Delete",
		Goal:        1,
		TimePeriod:  "perDay",
		StartDate:   time.Now().Format("2006-01-02"),
		Due: models.Due{
			Type:         "specificDays",
			SpecificDays: []string{"monday"},
		},
	}

	createRr, err := makeRequest("POST", "/api/habit-trackers", habitRequest)
	if err != nil {
		t.Fatal(err)
	}

	var createdHabit habit.HabitTracker
	json.Unmarshal(createRr.Body.Bytes(), &createdHabit)

	// Delete the habit
	deleteRr, err := makeRequest("DELETE", fmt.Sprintf("/api/habit-trackers/%d", createdHabit.ID), nil)
	if err != nil {
		t.Fatal(err)
	}

	if deleteRr.Code != http.StatusNoContent {
		t.Errorf("Expected status %d, got %d", http.StatusNoContent, deleteRr.Code)
	}

	// Try to get the deleted habit (should fail)
	getRr, err := makeRequest("GET", fmt.Sprintf("/api/habit-trackers/%d", createdHabit.ID), nil)
	if err != nil {
		t.Fatal(err)
	}

	if getRr.Code != http.StatusNotFound {
		t.Errorf("Expected status %d after deletion, got %d", http.StatusNotFound, getRr.Code)
	}
}


func TestGetHabitTracker(t *testing.T) {
	// Create a habit first
	habitRequest := habit.CreateHabitRequest{
		TrackerName: "Test Get Habit",
		Goal:        3,
		TimePeriod:  "perWeek",
		StartDate:   time.Now().Format("2006-01-02"),
		Due: models.Due{
			Type:         "specificDays",
			SpecificDays: []string{"monday", "wednesday", "friday"},
		},
		BadHabit:   false,
		GoalStreak: func() *int { i := 21; return &i }(),
	}

	// Create the habit
	createRr, err := makeRequest("POST", "/api/habit-trackers", habitRequest)
	if err != nil {
		t.Fatal(err)
	}

	var createdHabit habit.HabitTracker
	json.Unmarshal(createRr.Body.Bytes(), &createdHabit)

	// Get the specific habit
	getRr, err := makeRequest("GET", fmt.Sprintf("/api/habit-trackers/%d", createdHabit.ID), nil)
	if err != nil {
		t.Fatal(err)
	}

	if getRr.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, getRr.Code, getRr.Body.String())
	}

	var retrievedHabit habit.HabitTracker
	if err := json.Unmarshal(getRr.Body.Bytes(), &retrievedHabit); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	// Verify the habit details
	if retrievedHabit.ID != createdHabit.ID {
		t.Errorf("Expected ID %d, got %d", createdHabit.ID, retrievedHabit.ID)
	}
	if retrievedHabit.TrackerName != "Test Get Habit" {
		t.Errorf("Expected TrackerName 'Test Get Habit', got '%s'", retrievedHabit.TrackerName)
	}
	if retrievedHabit.Goal != 3 {
		t.Errorf("Expected Goal 3, got %f", retrievedHabit.Goal)
	}
	if retrievedHabit.TimePeriod != "perWeek" {
		t.Errorf("Expected TimePeriod 'perWeek', got '%s'", retrievedHabit.TimePeriod)
	}
	if retrievedHabit.Due.Type != "specificDays" {
		t.Errorf("Expected Due.Type 'specificDays', got '%s'", retrievedHabit.Due.Type)
	}
	if len(retrievedHabit.Due.SpecificDays) != 3 {
		t.Errorf("Expected 3 specific days, got %d", len(retrievedHabit.Due.SpecificDays))
	}
	if retrievedHabit.GoalStreak == nil || *retrievedHabit.GoalStreak != 21 {
		t.Errorf("Expected GoalStreak 21, got %v", retrievedHabit.GoalStreak)
	}
}

func TestGetHabitTrackerNotFound(t *testing.T) {
	// Try to get a non-existent habit tracker
	getRr, err := makeRequest("GET", "/api/habit-trackers/99999", nil)
	if err != nil {
		t.Fatal(err)
	}

	if getRr.Code != http.StatusNotFound {
		t.Errorf("Expected status %d for non-existent tracker, got %d", http.StatusNotFound, getRr.Code)
	}
}

func TestGetHabitTrackerInvalidID(t *testing.T) {
	// Try to get a habit tracker with invalid ID
	getRr, err := makeRequest("GET", "/api/habit-trackers/invalid", nil)
	if err != nil {
		t.Fatal(err)
	}

	if getRr.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d for invalid ID, got %d", http.StatusBadRequest, getRr.Code)
	}
}

func TestUpdateHabitTracker(t *testing.T) {
	// Create a habit first
	habitRequest := habit.CreateHabitRequest{
		TrackerName: "Original Habit",
		Goal:        2,
		TimePeriod:  "perDay",
		StartDate:   time.Now().Format("2006-01-02"),
		Due: models.Due{
			Type:         "specificDays",
			SpecificDays: []string{"monday"},
		},
		BadHabit: false,
	}

	createRr, err := makeRequest("POST", "/api/habit-trackers", habitRequest)
	if err != nil {
		t.Fatal(err)
	}

	var createdHabit habit.HabitTracker
	json.Unmarshal(createRr.Body.Bytes(), &createdHabit)

	// Update the habit - using pointers for optional fields
	updateRequest := habit.UpdateHabitRequest{
		TrackerName: func() *string { s := "Updated Habit Name"; return &s }(),
		Goal:        func() *float64 { g := 5.0; return &g }(),
		TimePeriod:  func() *models.TimePeriod { s := models.PER_WEEK; return &s }(),
		BadHabit:    func() *bool { b := true; return &b }(),
		GoalStreak:  func() *int { i := 14; return &i }(),
		Due: &models.Due{
			Type:         "specificDays",
			SpecificDays: []string{"monday", "wednesday", "friday"},
		},
	}

	updateRr, err := makeRequest("PUT", fmt.Sprintf("/api/habit-trackers/%d", createdHabit.ID), updateRequest)
	if err != nil {
		t.Fatal(err)
	}

	if updateRr.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, updateRr.Code, updateRr.Body.String())
	}

	var updatedHabit habit.HabitTracker
	if err := json.Unmarshal(updateRr.Body.Bytes(), &updatedHabit); err != nil {
		t.Fatalf("Failed to parse update response: %v", err)
	}

	// Verify the updates
	if updatedHabit.TrackerName != "Updated Habit Name" {
		t.Errorf("Expected updated TrackerName 'Updated Habit Name', got '%s'", updatedHabit.TrackerName)
	}
	if updatedHabit.Goal != 5 {
		t.Errorf("Expected updated Goal 5, got %f", updatedHabit.Goal)
	}
	if updatedHabit.TimePeriod != "perWeek" {
		t.Errorf("Expected updated TimePeriod 'perWeek', got '%s'", updatedHabit.TimePeriod)
	}
	if !updatedHabit.BadHabit {
		t.Error("Expected BadHabit to be true after update")
	}
	if updatedHabit.GoalStreak == nil || *updatedHabit.GoalStreak != 14 {
		t.Errorf("Expected updated GoalStreak 14, got %v", updatedHabit.GoalStreak)
	}
	if len(updatedHabit.Due.SpecificDays) != 3 {
		t.Errorf("Expected 3 specific days after update, got %d", len(updatedHabit.Due.SpecificDays))
	}
}



// Integration test to verify the complete flow
func TestHabitTrackerDetailPageFlow(t *testing.T) {
	// 1. Create a habit
	habitRequest := habit.CreateHabitRequest{
		TrackerName: "Integration Test Habit",
		Goal:        1,
		TimePeriod:  "perDay",
		StartDate:   time.Now().Format("2006-01-02"),
		Due: models.Due{
			Type:         "specificDays",
			SpecificDays: []string{"monday", "wednesday", "friday"},
		},
		BadHabit:   false,
		GoalStreak: func() *int { i := 7; return &i }(),
	}

	createRr, err := makeRequest("POST", "/api/habit-trackers", habitRequest)
	if err != nil {
		t.Fatal(err)
	}

	var createdHabit habit.HabitTracker
	json.Unmarshal(createRr.Body.Bytes(), &createdHabit)

	// 2. Add some entries
	entries := []models.AddEntryRequest{
		{Done: func() *bool { b := true; return &b }(), Note: "Day 1 - Great start!"},
		{Done: func() *bool { b := true; return &b }(), Note: "Day 2 - Feeling good"},
		{Done: func() *bool { b := false; return &b }(), Note: "Day 3 - Missed today"},
		{Done: func() *bool { b := true; return &b }(), Note: "Day 4 - Back on track"},
	}

	for _, entryReq := range entries {
		_, err := makeRequest("POST", fmt.Sprintf("/api/habit-trackers/%d/entries", createdHabit.ID), entryReq)
		if err != nil {
			t.Fatal(err)
		}
	}

	// 3. Get habit details (what the detail page would do)
	getRr, err := makeRequest("GET", fmt.Sprintf("/api/habit-trackers/%d", createdHabit.ID), nil)
	if err != nil {
		t.Fatal(err)
	}

	if getRr.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, getRr.Code)
	}

	var mhabit habit.HabitTracker
	json.Unmarshal(getRr.Body.Bytes(), &mhabit)

	// 4. Get habit entries (what the detail page would do)
	entriesRr, err := makeRequest("GET", fmt.Sprintf("/api/habit-trackers/%d/entries", createdHabit.ID), nil)
	if err != nil {
		t.Fatal(err)
	}

	if entriesRr.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, entriesRr.Code)
	}

	var retrievedEntries []models.Entry
	json.Unmarshal(entriesRr.Body.Bytes(), &retrievedEntries)

	// 5. Verify we have everything needed for the detail page
	if mhabit.TrackerName != "Integration Test Habit" {
		t.Errorf("Expected habit name 'Integration Test Habit', got '%s'", mhabit.TrackerName)
	}

	if len(retrievedEntries) != 4 {
		t.Errorf("Expected 4 entries, got %d", len(retrievedEntries))
	}

	// Count completed entries (for frontend calculations)
	completedCount := 0
	for _, entry := range retrievedEntries {
		if entry.Done != nil && *entry.Done {
			completedCount++
		}
	}

	if completedCount != 3 {
		t.Errorf("Expected 3 completed entries, got %d", completedCount)
	}

	// 6. Update the habit (Settings tab functionality)
	updateRequest := habit.UpdateHabitRequest {
		TrackerName: func() *string { s := "Updated Integration Test Habit"; return &s }(),
		Goal:        func() *float64 { g := 2.0; return &g }(),
	}

	updateRr, err := makeRequest("PUT", fmt.Sprintf("/api/habit-trackers/%d", createdHabit.ID), updateRequest)
	if err != nil {
		t.Fatal(err)
	}

	if updateRr.Code != http.StatusOK {
		t.Errorf("Expected update status %d, got %d", http.StatusOK, updateRr.Code)
	}

	// 7. Verify the update worked
	var updatedHabit habit.HabitTracker
	json.Unmarshal(updateRr.Body.Bytes(), &updatedHabit)

	if updatedHabit.TrackerName != "Updated Integration Test Habit" {
		t.Errorf("Expected updated name, got '%s'", updatedHabit.TrackerName)
	}
	if updatedHabit.Goal != 2 {
		t.Errorf("Expected updated goal 2, got %f", updatedHabit.Goal)
	}
}
