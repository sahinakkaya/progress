package tests

import (
	"encoding/json"
	"fmt"
	"net/http"
	"testing"
	"time"

	"routine-tracker/models"
	"routine-tracker/trackers/target"
)

func TestCreateTargetTracker(t *testing.T) {
	// Test data
	targetRequest := target.CreateTargetRequest{
		TrackerName: "Save Money",
		StartValue:  0,
		GoalValue:   5000,
		StartDate:   time.Now().Format("2006-01-02"),
		GoalDate:    time.Now().AddDate(0, 6, 0).Format("2006-01-02"), // 6 months from now
		AddToTotal:  true,
		Due: models.Due{
			Type:         "specificDays",
			SpecificDays: []string{"sunday"},
		},
	}

	// Make request
	rr, err := makeRequest("POST", "/api/target-trackers", targetRequest)
	if err != nil {
		t.Fatal(err)
	}

	// Check status code
	if rr.Code != http.StatusCreated {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusCreated, rr.Code, rr.Body.String())
	}

	// Parse response
	var createdTarget target.TargetTracker
	if err := json.Unmarshal(rr.Body.Bytes(), &createdTarget); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	// Verify response
	if createdTarget.TrackerName != "Save Money" {
		t.Errorf("Expected TrackerName 'Save Money', got '%s'", createdTarget.TrackerName)
	}
	if createdTarget.StartValue != 0 {
		t.Errorf("Expected StartValue 0, got %f", createdTarget.StartValue)
	}
	if createdTarget.GoalValue != 5000 {
		t.Errorf("Expected GoalValue 5000, got %f", createdTarget.GoalValue)
	}
	if !createdTarget.AddToTotal {
		t.Error("Expected AddToTotal to be true")
	}
	if createdTarget.ID == 0 {
		t.Error("Expected ID to be set")
	}
}

func TestGetTargetTrackers(t *testing.T) {
	// First create a target tracker
	targetRequest := target.CreateTargetRequest{
		TrackerName: "Learn Spanish",
		StartValue:  0,
		GoalValue:   100, // 100 lessons
		StartDate:   time.Now().Format("2006-01-02"),
		GoalDate:    time.Now().AddDate(0, 3, 0).Format("2006-01-02"), // 3 months
		AddToTotal:  true,
		Due: models.Due{
			Type:          "interval",
			IntervalType:  "day",
			IntervalValue: 3, // Every 3 days
		},
	}

	// Create the target
	_, err := makeRequest("POST", "/api/target-trackers", targetRequest)
	if err != nil {
		t.Fatal(err)
	}

	// Get all targets
	rr, err := makeRequest("GET", "/api/target-trackers", nil)
	if err != nil {
		t.Fatal(err)
	}

	if rr.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, rr.Code)
	}

	var targets []target.TargetTracker
	if err := json.Unmarshal(rr.Body.Bytes(), &targets); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if len(targets) == 0 {
		t.Error("Expected at least one target tracker")
	}
}

func TestAddTargetEntry(t *testing.T) {
	// Create a target first
	targetRequest := target.CreateTargetRequest{
		TrackerName: "Read Pages",
		StartValue:  0,
		GoalValue:   300,
		StartDate:   time.Now().Format("2006-01-02"),
		GoalDate:    time.Now().AddDate(0, 2, 0).Format("2006-01-02"), // 2 months
		AddToTotal:  true,
		Due: models.Due{
			Type:         "specificDays",
			SpecificDays: []string{"monday", "wednesday", "friday"},
		},
	}

	createRr, err := makeRequest("POST", "/api/target-trackers", targetRequest)
	if err != nil {
		t.Fatal(err)
	}

	var createdTarget target.TargetTracker
	json.Unmarshal(createRr.Body.Bytes(), &createdTarget)

	// Add entry to the target
	entryRequest := models.AddEntryRequest{
		Value: 25.5, // Read 25.5 pages
		Note:  "Great progress today",
	}

	entryRr, err := makeRequest("POST", fmt.Sprintf("/api/target-trackers/%d/entries", createdTarget.ID), entryRequest)
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

	if entry.TrackerID != createdTarget.ID {
		t.Errorf("Expected TrackerID %d, got %d", createdTarget.ID, entry.TrackerID)
	}
	if entry.Value != 25.5 {
		t.Errorf("Expected Value 25.5, got %f", entry.Value)
	}
	if entry.Note != "Great progress today" {
		t.Errorf("Expected Note 'Great progress today', got '%s'", entry.Note)
	}
}

func TestTargetWithAddToTotalFalse(t *testing.T) {
	// Create a target with AddToTotal = false (replace mode)
	targetRequest := target.CreateTargetRequest{
		TrackerName: "Current Weight",
		StartValue:  80.0,
		GoalValue:   75.0,
		StartDate:   time.Now().Format("2006-01-02"),
		GoalDate:    time.Now().AddDate(0, 6, 0).Format("2006-01-02"),
		AddToTotal:  false, // Replace mode
		Due: models.Due{
			Type:         "specificDays",
			SpecificDays: []string{"saturday"},
		},
	}

	createRr, err := makeRequest("POST", "/api/target-trackers", targetRequest)
	if err != nil {
		t.Fatal(err)
	}

	var createdTarget target.TargetTracker
	json.Unmarshal(createRr.Body.Bytes(), &createdTarget)

	if createdTarget.AddToTotal {
		t.Error("Expected AddToTotal to be false")
	}

	// Add entries
	entry1 := models.AddEntryRequest{Value: 79.5, Note: "Week 1"}
	entry2 := models.AddEntryRequest{Value: 78.2, Note: "Week 2"}

	for _, entryReq := range []models.AddEntryRequest{entry1, entry2} {
		entryRr, err := makeRequest("POST", fmt.Sprintf("/api/target-trackers/%d/entries", createdTarget.ID), entryReq)
		if err != nil {
			t.Fatal(err)
		}
		if entryRr.Code != http.StatusCreated {
			t.Errorf("Expected status %d, got %d", http.StatusCreated, entryRr.Code)
		}
	}
}

func TestDeleteTargetTracker(t *testing.T) {
	// Create a target first
	targetRequest := target.CreateTargetRequest{
		TrackerName: "Test Delete Target",
		StartValue:  0,
		GoalValue:   100,
		StartDate:   time.Now().Format("2006-01-02"),
		GoalDate:    time.Now().AddDate(0, 1, 0).Format("2006-01-02"),
		AddToTotal:  true,
		Due: models.Due{
			Type:         "specificDays",
			SpecificDays: []string{"tuesday"},
		},
	}

	createRr, err := makeRequest("POST", "/api/target-trackers", targetRequest)
	if err != nil {
		t.Fatal(err)
	}

	var createdTarget target.TargetTracker
	json.Unmarshal(createRr.Body.Bytes(), &createdTarget)

	// Add an entry to test cascade delete
	entryRequest := models.AddEntryRequest{Value: 10, Note: "Test entry"}
	_, err = makeRequest("POST", fmt.Sprintf("/api/target-trackers/%d/entries", createdTarget.ID), entryRequest)
	if err != nil {
		t.Fatal(err)
	}

	// Delete the target
	deleteRr, err := makeRequest("DELETE", fmt.Sprintf("/api/target-trackers/%d", createdTarget.ID), nil)
	if err != nil {
		t.Fatal(err)
	}

	if deleteRr.Code != http.StatusNoContent {
		t.Errorf("Expected status %d, got %d", http.StatusNoContent, deleteRr.Code)
	}

	// Try to get the deleted target (should fail)
	getRr, err := makeRequest("GET", fmt.Sprintf("/api/target-trackers/%d", createdTarget.ID), nil)
	if err != nil {
		t.Fatal(err)
	}

	if getRr.Code != http.StatusNotFound {
		t.Errorf("Expected status %d after deletion, got %d", http.StatusNotFound, getRr.Code)
	}
}


func TestGetTargetTracker(t *testing.T) {
	// Create a target first
	targetRequest := target.CreateTargetRequest{
		TrackerName: "Test Get Target",
		StartValue:  10.5,
		GoalValue:   100.0,
		StartDate:   time.Now().Format("2006-01-02"),
		GoalDate:    time.Now().AddDate(0, 3, 0).Format("2006-01-02"), // 3 months
		AddToTotal:  true,
		Due: models.Due{
			Type:          "interval",
			IntervalType:  "day",
			IntervalValue: 3,
		},
	}

	// Create the target
	createRr, err := makeRequest("POST", "/api/target-trackers", targetRequest)
	if err != nil {
		t.Fatal(err)
	}

	var createdTarget target.TargetTracker
	json.Unmarshal(createRr.Body.Bytes(), &createdTarget)

	// Get the specific target
	getRr, err := makeRequest("GET", fmt.Sprintf("/api/target-trackers/%d", createdTarget.ID), nil)
	if err != nil {
		t.Fatal(err)
	}

	if getRr.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, getRr.Code, getRr.Body.String())
	}

	var retrievedTarget target.TargetTracker
	if err := json.Unmarshal(getRr.Body.Bytes(), &retrievedTarget); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	// Verify the target details
	if retrievedTarget.ID != createdTarget.ID {
		t.Errorf("Expected ID %d, got %d", createdTarget.ID, retrievedTarget.ID)
	}
	if retrievedTarget.TrackerName != "Test Get Target" {
		t.Errorf("Expected TrackerName 'Test Get Target', got '%s'", retrievedTarget.TrackerName)
	}
	if retrievedTarget.StartValue != 10.5 {
		t.Errorf("Expected StartValue 10.5, got %f", retrievedTarget.StartValue)
	}
	if retrievedTarget.GoalValue != 100.0 {
		t.Errorf("Expected GoalValue 100.0, got %f", retrievedTarget.GoalValue)
	}
	if !retrievedTarget.AddToTotal {
		t.Error("Expected AddToTotal to be true")
	}
	if retrievedTarget.Due.Type != "interval" {
		t.Errorf("Expected Due.Type 'interval', got '%s'", retrievedTarget.Due.Type)
	}
	if retrievedTarget.Due.IntervalType != "day" {
		t.Errorf("Expected Due.IntervalType 'day', got '%s'", retrievedTarget.Due.IntervalType)
	}
	if retrievedTarget.Due.IntervalValue != 3 {
		t.Errorf("Expected Due.IntervalValue 3, got %d", retrievedTarget.Due.IntervalValue)
	}
}

func TestGetTargetTrackerNotFound(t *testing.T) {
	// Try to get a non-existent target tracker
	getRr, err := makeRequest("GET", "/api/target-trackers/99999", nil)
	if err != nil {
		t.Fatal(err)
	}

	if getRr.Code != http.StatusNotFound {
		t.Errorf("Expected status %d for non-existent tracker, got %d", http.StatusNotFound, getRr.Code)
	}
}

func TestGetTargetTrackerInvalidID(t *testing.T) {
	// Try to get a target tracker with invalid ID
	getRr, err := makeRequest("GET", "/api/target-trackers/invalid", nil)
	if err != nil {
		t.Fatal(err)
	}

	if getRr.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d for invalid ID, got %d", http.StatusBadRequest, getRr.Code)
	}
}

func TestUpdateTargetTracker(t *testing.T) {
	// Create a target first
	targetRequest := target.CreateTargetRequest{
		TrackerName: "Original Target",
		StartValue:  0,
		GoalValue:   50,
		StartDate:   time.Now().Format("2006-01-02"),
		GoalDate:    time.Now().AddDate(0, 2, 0).Format("2006-01-02"),
		AddToTotal:  true,
		Due: models.Due{
			Type:         "specificDays",
			SpecificDays: []string{"sunday"},
		},
	}

	createRr, err := makeRequest("POST", "/api/target-trackers", targetRequest)
	if err != nil {
		t.Fatal(err)
	}

	var createdTarget target.TargetTracker
	json.Unmarshal(createRr.Body.Bytes(), &createdTarget)

	// Update the target - using pointers for optional fields
	updateRequest := target.UpdateTargetRequest{
		TrackerName: func() *string { s := "Updated Target Name"; return &s }(),
		StartValue:  func() *float64 { v := 10.0; return &v }(),
		GoalValue:   func() *float64 { v := 200.0; return &v }(),
		AddToTotal:  func() *bool { b := false; return &b }(), // Change to replacement mode
		Due: &models.Due{
			Type:          "interval",
			IntervalType:  "week",
			IntervalValue: 2,
		},
	}

	updateRr, err := makeRequest("PUT", fmt.Sprintf("/api/target-trackers/%d", createdTarget.ID), updateRequest)
	if err != nil {
		t.Fatal(err)
	}

	if updateRr.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, updateRr.Code, updateRr.Body.String())
	}

	var updatedTarget target.TargetTracker
	if err := json.Unmarshal(updateRr.Body.Bytes(), &updatedTarget); err != nil {
		t.Fatalf("Failed to parse update response: %v", err)
	}

	// Verify the updates
	if updatedTarget.TrackerName != "Updated Target Name" {
		t.Errorf("Expected updated TrackerName 'Updated Target Name', got '%s'", updatedTarget.TrackerName)
	}
	if updatedTarget.StartValue != 10.0 {
		t.Errorf("Expected updated StartValue 10.0, got %f", updatedTarget.StartValue)
	}
	if updatedTarget.GoalValue != 200.0 {
		t.Errorf("Expected updated GoalValue 200.0, got %f", updatedTarget.GoalValue)
	}
	if updatedTarget.AddToTotal {
		t.Error("Expected AddToTotal to be false after update")
	}
	if updatedTarget.Due.Type != "interval" {
		t.Errorf("Expected updated Due.Type 'interval', got '%s'", updatedTarget.Due.Type)
	}
	if updatedTarget.Due.IntervalType != "week" {
		t.Errorf("Expected updated Due.IntervalType 'week', got '%s'", updatedTarget.Due.IntervalType)
	}
	if updatedTarget.Due.IntervalValue != 2 {
		t.Errorf("Expected updated Due.IntervalValue 2, got %d", updatedTarget.Due.IntervalValue)
	}
}


func TestTargetTrackerDetailPageFlow(t *testing.T) {
	// Similar integration test for target trackers
	targetRequest := target.CreateTargetRequest{
		TrackerName: "Integration Test Target",
		StartValue:  0,
		GoalValue:   100,
		StartDate:   time.Now().Format("2006-01-02"),
		GoalDate:    time.Now().AddDate(0, 2, 0).Format("2006-01-02"),
		AddToTotal:  true,
		Due: models.Due{
			Type:         "specificDays",
			SpecificDays: []string{"sunday"},
		},
	}

	createRr, err := makeRequest("POST", "/api/target-trackers", targetRequest)
	if err != nil {
		t.Fatal(err)
	}

	var createdTarget target.TargetTracker
	json.Unmarshal(createRr.Body.Bytes(), &createdTarget)

	// Add entries
	entries := []models.AddEntryRequest{
		{Value: 10.5, Note: "First entry"},
		{Value: 15.0, Note: "Second entry"},
		{Value: 8.5, Note: "Third entry"},
	}

	for _, entryReq := range entries {
		_, err := makeRequest("POST", fmt.Sprintf("/api/target-trackers/%d/entries", createdTarget.ID), entryReq)
		if err != nil {
			t.Fatal(err)
		}
	}

	// Get target details and entries
	getRr, err := makeRequest("GET", fmt.Sprintf("/api/target-trackers/%d", createdTarget.ID), nil)
	if err != nil {
		t.Fatal(err)
	}

	entriesRr, err := makeRequest("GET", fmt.Sprintf("/api/target-trackers/%d/entries", createdTarget.ID), nil)
	if err != nil {
		t.Fatal(err)
	}

	// Verify
	if getRr.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, getRr.Code)
	}
	if entriesRr.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, entriesRr.Code)
	}

	var target target.TargetTracker
	var retrievedEntries []models.Entry
	json.Unmarshal(getRr.Body.Bytes(), &target)
	json.Unmarshal(entriesRr.Body.Bytes(), &retrievedEntries)

	if target.TrackerName != "Integration Test Target" {
		t.Errorf("Expected target name 'Integration Test Target', got '%s'", target.TrackerName)
	}
	if len(retrievedEntries) != 3 {
		t.Errorf("Expected 3 entries, got %d", len(retrievedEntries))
	}

	// Calculate total (what frontend would do)
	totalValue := 0.0
	for _, entry := range retrievedEntries {
		totalValue += entry.Value
	}

	expectedTotal := 10.5 + 15.0 + 8.5
	if totalValue != expectedTotal {
		t.Errorf("Expected total value %.1f, got %.1f", expectedTotal, totalValue)
	}
}

func TestTargetTrendWeightTypeDefault(t *testing.T) {
	// Create a target without specifying TrendWeightType
	targetRequest := target.CreateTargetRequest{
		TrackerName: "Test Default Trend Weight",
		StartValue:  0,
		GoalValue:   100,
		StartDate:   time.Now().Format("2006-01-02"),
		GoalDate:    time.Now().AddDate(0, 3, 0).Format("2006-01-02"),
		AddToTotal:  true,
		Due: models.Due{
			Type:         "specificDays",
			SpecificDays: []string{"monday"},
		},
	}

	createRr, err := makeRequest("POST", "/api/target-trackers", targetRequest)
	if err != nil {
		t.Fatal(err)
	}

	var createdTarget target.TargetTracker
	json.Unmarshal(createRr.Body.Bytes(), &createdTarget)

	// Verify default trend weight type is "none"
	if createdTarget.TrendWeightType == nil {
		t.Error("Expected TrendWeightType to be set to default value")
	} else if *createdTarget.TrendWeightType != "none" {
		t.Errorf("Expected default TrendWeightType 'none', got '%s'", *createdTarget.TrendWeightType)
	}
}

func TestTargetTrendWeightTypeCreate(t *testing.T) {
	// Create a target with specific TrendWeightType
	weightType := "exponential_low"
	targetRequest := target.CreateTargetRequest{
		TrackerName:     "Test Custom Trend Weight",
		StartValue:      0,
		GoalValue:       100,
		StartDate:       time.Now().Format("2006-01-02"),
		GoalDate:        time.Now().AddDate(0, 3, 0).Format("2006-01-02"),
		AddToTotal:      true,
		TrendWeightType: &weightType,
		Due: models.Due{
			Type:         "specificDays",
			SpecificDays: []string{"tuesday"},
		},
	}

	createRr, err := makeRequest("POST", "/api/target-trackers", targetRequest)
	if err != nil {
		t.Fatal(err)
	}

	if createRr.Code != http.StatusCreated {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusCreated, createRr.Code, createRr.Body.String())
	}

	var createdTarget target.TargetTracker
	json.Unmarshal(createRr.Body.Bytes(), &createdTarget)

	// Verify trend weight type is set correctly
	if createdTarget.TrendWeightType == nil {
		t.Error("Expected TrendWeightType to be set")
	} else if *createdTarget.TrendWeightType != "exponential_low" {
		t.Errorf("Expected TrendWeightType 'exponential_low', got '%s'", *createdTarget.TrendWeightType)
	}
}

func TestTargetTrendWeightTypeUpdate(t *testing.T) {
	// Create a target with default trend weight type
	targetRequest := target.CreateTargetRequest{
		TrackerName: "Test Update Trend Weight",
		StartValue:  0,
		GoalValue:   100,
		StartDate:   time.Now().Format("2006-01-02"),
		GoalDate:    time.Now().AddDate(0, 3, 0).Format("2006-01-02"),
		AddToTotal:  true,
		Due: models.Due{
			Type:         "specificDays",
			SpecificDays: []string{"wednesday"},
		},
	}

	createRr, err := makeRequest("POST", "/api/target-trackers", targetRequest)
	if err != nil {
		t.Fatal(err)
	}

	var createdTarget target.TargetTracker
	json.Unmarshal(createRr.Body.Bytes(), &createdTarget)

	// Update the trend weight type
	newWeightType := "linear"
	updateRequest := target.UpdateTargetRequest{
		TrendWeightType: &newWeightType,
	}

	updateRr, err := makeRequest("PUT", fmt.Sprintf("/api/target-trackers/%d", createdTarget.ID), updateRequest)
	if err != nil {
		t.Fatal(err)
	}

	if updateRr.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d. Body: %s", http.StatusOK, updateRr.Code, updateRr.Body.String())
	}

	var updatedTarget target.TargetTracker
	json.Unmarshal(updateRr.Body.Bytes(), &updatedTarget)

	// Verify the trend weight type was updated
	if updatedTarget.TrendWeightType == nil {
		t.Error("Expected TrendWeightType to be set after update")
	} else if *updatedTarget.TrendWeightType != "linear" {
		t.Errorf("Expected updated TrendWeightType 'linear', got '%s'", *updatedTarget.TrendWeightType)
	}
}

func TestTargetTrendWeightTypeAllOptions(t *testing.T) {
	// Test all valid trend weight type options
	validOptions := []string{"none", "linear", "sqrt", "quadratic", "exponential_low", "exponential_high"}

	for _, option := range validOptions {
		weightType := option
		targetRequest := target.CreateTargetRequest{
			TrackerName:     fmt.Sprintf("Test %s", option),
			StartValue:      0,
			GoalValue:       100,
			StartDate:       time.Now().Format("2006-01-02"),
			GoalDate:        time.Now().AddDate(0, 3, 0).Format("2006-01-02"),
			AddToTotal:      true,
			TrendWeightType: &weightType,
			Due: models.Due{
				Type:         "specificDays",
				SpecificDays: []string{"friday"},
			},
		}

		createRr, err := makeRequest("POST", "/api/target-trackers", targetRequest)
		if err != nil {
			t.Fatal(err)
		}

		if createRr.Code != http.StatusCreated {
			t.Errorf("Expected status %d for option '%s', got %d", http.StatusCreated, option, createRr.Code)
		}

		var createdTarget target.TargetTracker
		json.Unmarshal(createRr.Body.Bytes(), &createdTarget)

		if createdTarget.TrendWeightType == nil {
			t.Errorf("Expected TrendWeightType to be set for option '%s'", option)
		} else if *createdTarget.TrendWeightType != option {
			t.Errorf("Expected TrendWeightType '%s', got '%s'", option, *createdTarget.TrendWeightType)
		}
	}
}
