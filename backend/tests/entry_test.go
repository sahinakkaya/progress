package tests

import (
	"encoding/json"
	"fmt"
	"net/http"
	"testing"
	"time"

	"routine-tracker/models"
	"routine-tracker/trackers/habit"
	"routine-tracker/trackers/target"
)

func TestGetEntriesForHabitTracker(t *testing.T) {
	// Create a habit tracker
	habitRequest := habit.CreateHabitRequest{
		TrackerName: "Daily Meditation",
		Goal:        1,
		TimePeriod:  "perDay",
		StartDate:   time.Now().Format("2006-01-02"),
		Due: models.Due{
			Type:         "specificDays",
			SpecificDays: []string{"monday", "tuesday", "wednesday", "thursday", "friday"},
		},
	}

	createRr, err := makeRequest("POST", "/api/habit-trackers", habitRequest)
	if err != nil {
		t.Fatal(err)
	}

	var createdHabit habit.HabitTracker
	json.Unmarshal(createRr.Body.Bytes(), &createdHabit)

	// Add multiple entries
	entries := []models.AddEntryRequest{
		{Done: func() *bool { b := true; return &b }(), Note: "Morning session"},
		{Done: func() *bool { b := false; return &b }(), Note: "Missed today"},
		{Done: func() *bool { b := true; return &b }(), Note: "Evening session"},
	}

	for _, entryReq := range entries {
		_, err := makeRequest("POST", fmt.Sprintf("/api/habit-trackers/%d/entries", createdHabit.ID), entryReq)
		if err != nil {
			t.Fatal(err)
		}
	}

	// Get entries for this tracker
	entriesRr, err := makeRequest("GET", fmt.Sprintf("/api/habit-trackers/%d/entries", createdHabit.ID), nil)
	if err != nil {
		t.Fatal(err)
	}

	if entriesRr.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, entriesRr.Code)
	}

	var retrievedEntries []models.Entry
	if err := json.Unmarshal(entriesRr.Body.Bytes(), &retrievedEntries); err != nil {
		t.Fatalf("Failed to parse entries response: %v", err)
	}

	if len(retrievedEntries) != 3 {
		t.Errorf("Expected 3 entries, got %d", len(retrievedEntries))
	}

	// Verify entry types
	for _, entry := range retrievedEntries {
		if entry.Type != models.HABIT {
			t.Errorf("Expected entry type HABIT, got %s", entry.Type)
		}
		if entry.TrackerID != createdHabit.ID {
			t.Errorf("Expected TrackerID %d, got %d", createdHabit.ID, entry.TrackerID)
		}
		if entry.Done == nil {
			t.Error("Expected Done field to be set for habit entries")
		}
	}
}

func TestGetEntriesForTargetTracker(t *testing.T) {
	// Create a target tracker
	targetRequest := target.CreateTargetRequest{
		TrackerName: "Study Hours",
		StartValue:  0,
		GoalValue:   200,
		StartDate:   time.Now().Format("2006-01-02"),
		GoalDate:    time.Now().AddDate(0, 4, 0).Format("2006-01-02"),
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

	// Add multiple entries
	entries := []models.AddEntryRequest{
		{Value: 2.5, Note: "Math study"},
		{Value: 3.0, Note: "Science study"},
		{Value: 1.5, Note: "History study"},
	}

	for _, entryReq := range entries {
		_, err := makeRequest("POST", fmt.Sprintf("/api/target-trackers/%d/entries", createdTarget.ID), entryReq)
		if err != nil {
			t.Fatal(err)
		}
	}

	// Get entries for this tracker
	entriesRr, err := makeRequest("GET", fmt.Sprintf("/api/target-trackers/%d/entries", createdTarget.ID), nil)
	if err != nil {
		t.Fatal(err)
	}

	if entriesRr.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, entriesRr.Code)
	}

	var retrievedEntries []models.Entry
	if err := json.Unmarshal(entriesRr.Body.Bytes(), &retrievedEntries); err != nil {
		t.Fatalf("Failed to parse entries response: %v", err)
	}

	if len(retrievedEntries) != 3 {
		t.Errorf("Expected 3 entries, got %d", len(retrievedEntries))
	}

	// Verify entry types and values
	expectedValues := []float64{2.5, 3.0, 1.5}
	for _, entry := range retrievedEntries {
		if entry.Type != models.TARGET {
			t.Errorf("Expected entry type TARGET, got %s", entry.Type)
		}
		if entry.TrackerID != createdTarget.ID {
			t.Errorf("Expected TrackerID %d, got %d", createdTarget.ID, entry.TrackerID)
		}
		// Note: entries might be returned in different order due to ORDER BY date DESC
		found := false
		for _, expectedValue := range expectedValues {
			if entry.Value == expectedValue {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("Unexpected entry value: %f", entry.Value)
		}
	}
}

func TestGetAllEntries(t *testing.T) {
	// Create both habit and target trackers
	habitRequest := habit.CreateHabitRequest{
		TrackerName: "Test Habit",
		Goal:        1,
		TimePeriod:  "perDay",
		StartDate:   time.Now().Format("2006-01-02"),
		Due:         models.Due{Type: "specificDays", SpecificDays: []string{"monday"}},
	}

	targetRequest := target.CreateTargetRequest{
		TrackerName: "Test Target",
		StartValue:  0,
		GoalValue:   50,
		StartDate:   time.Now().Format("2006-01-02"),
		GoalDate:    time.Now().AddDate(0, 1, 0).Format("2006-01-02"),
		AddToTotal:  true,
		Due:         models.Due{Type: "specificDays", SpecificDays: []string{"sunday"}},
	}

	// Create trackers
	habitRr, _ := makeRequest("POST", "/api/habit-trackers", habitRequest)
	targetRr, _ := makeRequest("POST", "/api/target-trackers", targetRequest)

	var createdHabit habit.HabitTracker
	var createdTarget target.TargetTracker
	json.Unmarshal(habitRr.Body.Bytes(), &createdHabit)
	json.Unmarshal(targetRr.Body.Bytes(), &createdTarget)

	// Add entries to both
	habitEntry := models.AddEntryRequest{Done: func() *bool { b := true; return &b }()}
	targetEntry := models.AddEntryRequest{Value: 10.0}

	makeRequest("POST", fmt.Sprintf("/api/habit-trackers/%d/entries", createdHabit.ID), habitEntry)
	makeRequest("POST", fmt.Sprintf("/api/target-trackers/%d/entries", createdTarget.ID), targetEntry)

	// Get all entries
	allEntriesRr, err := makeRequest("GET", "/api/entries", nil)
	if err != nil {
		t.Fatal(err)
	}

	if allEntriesRr.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, allEntriesRr.Code)
	}

	var allEntries []models.Entry
	if err := json.Unmarshal(allEntriesRr.Body.Bytes(), &allEntries); err != nil {
		t.Fatalf("Failed to parse all entries response: %v", err)
	}

	// Should have at least the 2 entries we just created
	if len(allEntries) < 2 {
		t.Errorf("Expected at least 2 entries, got %d", len(allEntries))
	}

	// Verify we have both habit and target entries
	hasHabitEntry := false
	hasTargetEntry := false

	for _, entry := range allEntries {
		if entry.Type == models.HABIT && entry.TrackerID == createdHabit.ID {
			hasHabitEntry = true
		}
		if entry.Type == models.TARGET && entry.TrackerID == createdTarget.ID {
			hasTargetEntry = true
		}
	}

	if !hasHabitEntry {
		t.Error("Expected to find habit entry in all entries")
	}
	if !hasTargetEntry {
		t.Error("Expected to find target entry in all entries")
	}
}

func TestHabitEntryFilteringByStartDate(t *testing.T) {
	// Create a habit tracker with start date of yesterday
	yesterday := time.Now().AddDate(0, 0, -1).Format("2006-01-02")
	habitRequest := habit.CreateHabitRequest{
		TrackerName: "Test Habit Filtering",
		Goal:        1,
		TimePeriod:  "perDay",
		StartDate:   yesterday,
		Due: models.Due{
			Type:         "specificDays",
			SpecificDays: []string{"monday", "tuesday", "wednesday", "thursday", "friday"},
		},
	}

	createRr, err := makeRequest("POST", "/api/habit-trackers", habitRequest)
	if err != nil {
		t.Fatal(err)
	}

	var createdHabit habit.HabitTracker
	json.Unmarshal(createRr.Body.Bytes(), &createdHabit)

	// Add entries with different dates
	twoDaysAgo := time.Now().AddDate(0, 0, -2).Format("2006-01-02T15:04:05Z")
	oneDayAgo := time.Now().AddDate(0, 0, -1).Format("2006-01-02T15:04:05Z")
	today := time.Now().Format("2006-01-02T15:04:05Z")

	entries := []models.AddEntryRequest{
		{Done: func() *bool { b := true; return &b }(), Date: twoDaysAgo, Note: "Two days ago - should be filtered out"},
		{Done: func() *bool { b := true; return &b }(), Date: oneDayAgo, Note: "One day ago - should be included"},
		{Done: func() *bool { b := false; return &b }(), Date: today, Note: "Today - should be included"},
	}

	// Add all entries
	for _, entryReq := range entries {
		_, err := makeRequest("POST", fmt.Sprintf("/api/habit-trackers/%d/entries", createdHabit.ID), entryReq)
		if err != nil {
			t.Fatal(err)
		}
	}

	// Get entries for this tracker - should only return entries from start date onwards
	entriesRr, err := makeRequest("GET", fmt.Sprintf("/api/habit-trackers/%d/entries", createdHabit.ID), nil)
	if err != nil {
		t.Fatal(err)
	}

	if entriesRr.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, entriesRr.Code)
	}

	var retrievedEntries []models.Entry
	if err := json.Unmarshal(entriesRr.Body.Bytes(), &retrievedEntries); err != nil {
		t.Fatalf("Failed to parse entries response: %v", err)
	}

	// Should only have 2 entries (from yesterday onwards), not 3
	if len(retrievedEntries) != 2 {
		t.Errorf("Expected 2 entries (filtered), got %d", len(retrievedEntries))
	}

	// Verify that the filtered entries are the correct ones
	for _, entry := range retrievedEntries {
		if entry.Note == "Two days ago - should be filtered out" {
			t.Error("Entry from before start date should have been filtered out")
		}
	}
}

func TestTargetEntryFilteringByStartDate(t *testing.T) {
	// Create a target tracker with start date of yesterday
	yesterday := time.Now().AddDate(0, 0, -1).Format("2006-01-02")
	targetRequest := target.CreateTargetRequest{
		TrackerName: "Test Target Filtering",
		StartValue:  0,
		GoalValue:   100,
		StartDate:   yesterday,
		GoalDate:    time.Now().AddDate(0, 1, 0).Format("2006-01-02"),
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

	// Add entries with different dates
	twoDaysAgo := time.Now().AddDate(0, 0, -2).Format("2006-01-02T15:04:05Z")
	oneDayAgo := time.Now().AddDate(0, 0, -1).Format("2006-01-02T15:04:05Z")
	today := time.Now().Format("2006-01-02T15:04:05Z")

	entries := []models.AddEntryRequest{
		{Value: 10.0, Date: twoDaysAgo, Note: "Two days ago - should be filtered out"},
		{Value: 20.0, Date: oneDayAgo, Note: "One day ago - should be included"},
		{Value: 15.0, Date: today, Note: "Today - should be included"},
	}

	// Add all entries
	for _, entryReq := range entries {
		_, err := makeRequest("POST", fmt.Sprintf("/api/target-trackers/%d/entries", createdTarget.ID), entryReq)
		if err != nil {
			t.Fatal(err)
		}
	}

	// Get entries for this tracker - should only return entries from start date onwards
	entriesRr, err := makeRequest("GET", fmt.Sprintf("/api/target-trackers/%d/entries", createdTarget.ID), nil)
	if err != nil {
		t.Fatal(err)
	}

	if entriesRr.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, entriesRr.Code)
	}

	var retrievedEntries []models.Entry
	if err := json.Unmarshal(entriesRr.Body.Bytes(), &retrievedEntries); err != nil {
		t.Fatalf("Failed to parse entries response: %v", err)
	}

	// Should only have 2 entries (from yesterday onwards), not 3
	if len(retrievedEntries) != 2 {
		t.Errorf("Expected 2 entries (filtered), got %d", len(retrievedEntries))
	}

	// Verify that the filtered entries are the correct ones
	for _, entry := range retrievedEntries {
		if entry.Note == "Two days ago - should be filtered out" {
			t.Error("Entry from before start date should have been filtered out")
		}
	}

	// Verify the correct entries are present
	expectedValues := []float64{20.0, 15.0}
	actualValues := make([]float64, len(retrievedEntries))
	for i, entry := range retrievedEntries {
		actualValues[i] = entry.Value
	}

	for _, expectedValue := range expectedValues {
		found := false
		for _, actualValue := range actualValues {
			if actualValue == expectedValue {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("Expected value %f not found in filtered entries", expectedValue)
		}
	}
}

func TestTargetCurrentValueCalculationWithFiltering(t *testing.T) {
	// Create a target tracker with start date of yesterday
	yesterday := time.Now().AddDate(0, 0, -1).Format("2006-01-02")
	targetRequest := target.CreateTargetRequest{
		TrackerName: "Test Current Value Calculation",
		StartValue:  10.0,
		GoalValue:   100,
		StartDate:   yesterday,
		GoalDate:    time.Now().AddDate(0, 1, 0).Format("2006-01-02"),
		AddToTotal:  true, // Additive target
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

	// Add entries with different dates - some before start date, some after
	twoDaysAgo := time.Now().AddDate(0, 0, -2).Format("2006-01-02T15:04:05Z")
	oneDayAgo := time.Now().AddDate(0, 0, -1).Format("2006-01-02T15:04:05Z")
	today := time.Now().Format("2006-01-02T15:04:05Z")

	entries := []models.AddEntryRequest{
		{Value: 50.0, Date: twoDaysAgo, Note: "Should be filtered out"},
		{Value: 20.0, Date: oneDayAgo, Note: "Should be included"},
		{Value: 15.0, Date: today, Note: "Should be included"},
	}

	// Add all entries
	for _, entryReq := range entries {
		_, err := makeRequest("POST", fmt.Sprintf("/api/target-trackers/%d/entries", createdTarget.ID), entryReq)
		if err != nil {
			t.Fatal(err)
		}
	}

	// Get the target tracker to check current value calculation
	targetRr, err := makeRequest("GET", fmt.Sprintf("/api/target-trackers/%d", createdTarget.ID), nil)
	if err != nil {
		t.Fatal(err)
	}

	if targetRr.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, targetRr.Code)
	}

	var retrievedTarget target.TargetTracker
	if err := json.Unmarshal(targetRr.Body.Bytes(), &retrievedTarget); err != nil {
		t.Fatalf("Failed to parse target response: %v", err)
	}

	// Current value should be: startValue (10) + valid entries (20 + 15) = 45
	// The entry with value 50 from two days ago should be filtered out
	expectedCurrentValue := 45.0
	if retrievedTarget.CurrentValue == nil {
		t.Fatal("CurrentValue should not be nil")
	}
	if *retrievedTarget.CurrentValue != expectedCurrentValue {
		t.Errorf("Expected current value %f, got %f", expectedCurrentValue, *retrievedTarget.CurrentValue)
	}
}

func TestTargetCurrentValueCalculationReplacementWithFiltering(t *testing.T) {
	// Create a replacement-type target tracker
	yesterday := time.Now().AddDate(0, 0, -1).Format("2006-01-02")
	targetRequest := target.CreateTargetRequest{
		TrackerName: "Test Replacement Calculation",
		StartValue:  70.0,
		GoalValue:   100,
		StartDate:   yesterday,
		GoalDate:    time.Now().AddDate(0, 1, 0).Format("2006-01-02"),
		AddToTotal:  false, // Replacement target
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

	// Add entries with different dates
	twoDaysAgo := time.Now().AddDate(0, 0, -2).Format("2006-01-02T15:04:05Z")
	oneDayAgo := time.Now().AddDate(0, 0, -1).Format("2006-01-02T15:04:05Z")
	today := time.Now().Format("2006-01-02T15:04:05Z")

	entries := []models.AddEntryRequest{
		{Value: 90.0, Date: twoDaysAgo, Note: "Should be filtered out"},
		{Value: 75.0, Date: oneDayAgo, Note: "Should be included"},
		{Value: 80.0, Date: today, Note: "Should be included - most recent"},
	}

	// Add all entries
	for _, entryReq := range entries {
		_, err := makeRequest("POST", fmt.Sprintf("/api/target-trackers/%d/entries", createdTarget.ID), entryReq)
		if err != nil {
			t.Fatal(err)
		}
	}

	// Get the target tracker to check current value calculation
	targetRr, err := makeRequest("GET", fmt.Sprintf("/api/target-trackers/%d", createdTarget.ID), nil)
	if err != nil {
		t.Fatal(err)
	}

	if targetRr.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, targetRr.Code)
	}

	var retrievedTarget target.TargetTracker
	if err := json.Unmarshal(targetRr.Body.Bytes(), &retrievedTarget); err != nil {
		t.Fatalf("Failed to parse target response: %v", err)
	}

	// For replacement targets, current value should be the most recent valid entry (80.0)
	// The entry with value 90.0 from two days ago should be filtered out
	expectedCurrentValue := 80.0
	if retrievedTarget.CurrentValue == nil {
		t.Fatal("CurrentValue should not be nil")
	}
	if *retrievedTarget.CurrentValue != expectedCurrentValue {
		t.Errorf("Expected current value %f, got %f", expectedCurrentValue, *retrievedTarget.CurrentValue)
	}
}

func TestDeleteEntry(t *testing.T) {
	// Create a habit tracker
	habitRequest := habit.CreateHabitRequest{
		TrackerName: "Delete Test Habit",
		Goal:        1,
		TimePeriod:  "perDay",
		StartDate:   time.Now().Format("2006-01-02"),
		Due: models.Due{
			Type:         "specificDays",
			SpecificDays: []string{"monday", "tuesday", "wednesday", "thursday", "friday"},
		},
	}

	createRr, err := makeRequest("POST", "/api/habit-trackers", habitRequest)
	if err != nil {
		t.Fatal(err)
	}

	var createdHabit habit.HabitTracker
	json.Unmarshal(createRr.Body.Bytes(), &createdHabit)

	// Add an entry
	entryRequest := models.AddEntryRequest{
		Done: func() *bool { b := true; return &b }(),
		Note: "Test entry for deletion",
		Date: time.Now().Format("2006-01-02T15:04:05Z"),
	}

	entryRr, err := makeRequest("POST", fmt.Sprintf("/api/habit-trackers/%d/entries", createdHabit.ID), entryRequest)
	if err != nil {
		t.Fatal(err)
	}

	if entryRr.Code != http.StatusCreated {
		t.Fatalf("Expected status 201, got %d. Response: %s", entryRr.Code, entryRr.Body.String())
	}

	var createdEntry models.Entry
	json.Unmarshal(entryRr.Body.Bytes(), &createdEntry)

	// Delete the entry
	deleteRr, err := makeRequest("DELETE", fmt.Sprintf("/api/entries/%d", createdEntry.ID), nil)
	if err != nil {
		t.Fatal(err)
	}

	if deleteRr.Code != http.StatusNoContent {
		t.Fatalf("Expected status 204, got %d. Response: %s", deleteRr.Code, deleteRr.Body.String())
	}

	// Verify entry is deleted by trying to get entries for the tracker
	entriesRr, err := makeRequest("GET", fmt.Sprintf("/api/habit-trackers/%d/entries", createdHabit.ID), nil)
	if err != nil {
		t.Fatal(err)
	}

	if entriesRr.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d", entriesRr.Code)
	}

	var entries []models.Entry
	json.Unmarshal(entriesRr.Body.Bytes(), &entries)

	// Should have no entries since we deleted the only one
	if len(entries) != 0 {
		t.Fatalf("Expected 0 entries after deletion, got %d", len(entries))
	}
}

func TestDeleteNonExistentEntry(t *testing.T) {
	// Try to delete an entry that doesn't exist
	deleteRr, err := makeRequest("DELETE", "/api/entries/99999", nil)
	if err != nil {
		t.Fatal(err)
	}

	if deleteRr.Code != http.StatusNotFound {
		t.Fatalf("Expected status 404, got %d. Response: %s", deleteRr.Code, deleteRr.Body.String())
	}
}

func TestDeleteEntryInvalidID(t *testing.T) {
	// Try to delete with invalid ID
	deleteRr, err := makeRequest("DELETE", "/api/entries/invalid", nil)
	if err != nil {
		t.Fatal(err)
	}

	if deleteRr.Code != http.StatusBadRequest {
		t.Fatalf("Expected status 400, got %d. Response: %s", deleteRr.Code, deleteRr.Body.String())
	}
}
