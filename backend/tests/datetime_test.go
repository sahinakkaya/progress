package tests

import (
	"encoding/json"
	"fmt"
	"net/http"
	"routine-tracker/models"
	"routine-tracker/trackers/habit"
	"testing"
	"time"
)

func TestAddEntryWithDatetime(t *testing.T) {
	// Create a habit tracker first
	createRequest := habit.CreateHabitRequest{
		TrackerName: "Test Datetime Habit",
		Goal:        1,
		TimePeriod:  models.PER_DAY,
		StartDate:   "2024-01-01",
		Due: models.Due{
			Type:         models.SPECIFIC_DAYS,
			SpecificDays: []string{"monday", "tuesday", "wednesday", "thursday", "friday"},
		},
		Reminders: models.Reminder{
			Times:   []string{"09:00"},
			Enabled: true,
		},
	}

	rr, err := makeRequest("POST", "/api/habit-trackers", createRequest)
	if err != nil {
		t.Fatal(err)
	}

	if rr.Code != http.StatusCreated {
		t.Fatalf("Expected status %d, got %d. Body: %s", http.StatusCreated, rr.Code, rr.Body.String())
	}

	var createdHabit habit.HabitTracker
	if err := json.Unmarshal(rr.Body.Bytes(), &createdHabit); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	// Test with datetime format
	datetimeEntry := models.AddEntryRequest{
		Done: func() *bool { b := true; return &b }(),
		Date: "2024-01-15T14:30:00Z",
		Note: "Added with datetime",
	}

	entryRr, err := makeRequest("POST", fmt.Sprintf("/api/habit-trackers/%d/entries", createdHabit.ID), datetimeEntry)
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

	// Verify the datetime was parsed correctly
	expectedTime, _ := time.Parse(time.RFC3339, "2024-01-15T14:30:00Z")
	if !entry.Date.Equal(expectedTime) {
		t.Errorf("Expected date %s, got %s", expectedTime.Format(time.RFC3339), entry.Date.Format(time.RFC3339))
	}

	if entry.Note != "Added with datetime" {
		t.Errorf("Expected note 'Added with datetime', got '%s'", entry.Note)
	}
}

func TestAddEntryWithDateOnly(t *testing.T) {
	// Create a habit tracker first
	createRequest := habit.CreateHabitRequest{
		TrackerName: "Test Date Only Habit",
		Goal:        1,
		TimePeriod:  models.PER_DAY,
		StartDate:   "2024-01-01",
		Due: models.Due{
			Type:         models.SPECIFIC_DAYS,
			SpecificDays: []string{"monday", "tuesday", "wednesday", "thursday", "friday"},
		},
		Reminders: models.Reminder{
			Times:   []string{"09:00"},
			Enabled: true,
		},
	}

	rr, err := makeRequest("POST", "/api/habit-trackers", createRequest)
	if err != nil {
		t.Fatal(err)
	}

	if rr.Code != http.StatusCreated {
		t.Fatalf("Expected status %d, got %d. Body: %s", http.StatusCreated, rr.Code, rr.Body.String())
	}

	var createdHabit habit.HabitTracker
	if err := json.Unmarshal(rr.Body.Bytes(), &createdHabit); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	// Test with date-only format (should still work)
	dateEntry := models.AddEntryRequest{
		Done: func() *bool { b := true; return &b }(),
		Date: "2024-01-15",
		Note: "Added with date only",
	}

	entryRr, err := makeRequest("POST", fmt.Sprintf("/api/habit-trackers/%d/entries", createdHabit.ID), dateEntry)
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

	// Verify the date was parsed correctly (should be start of day)
	expectedTime, _ := time.Parse("2006-01-02", "2024-01-15")
	if !entry.Date.Equal(expectedTime) {
		t.Errorf("Expected date %s, got %s", expectedTime.Format(time.RFC3339), entry.Date.Format(time.RFC3339))
	}

	if entry.Note != "Added with date only" {
		t.Errorf("Expected note 'Added with date only', got '%s'", entry.Note)
	}
}

func TestAddEntryWithInvalidDateTime(t *testing.T) {
	// Create a habit tracker first
	createRequest := habit.CreateHabitRequest{
		TrackerName: "Test Invalid DateTime Habit",
		Goal:        1,
		TimePeriod:  models.PER_DAY,
		StartDate:   "2024-01-01",
		Due: models.Due{
			Type:         models.SPECIFIC_DAYS,
			SpecificDays: []string{"monday"},
		},
		Reminders: models.Reminder{
			Times:   []string{"09:00"},
			Enabled: true,
		},
	}

	rr, err := makeRequest("POST", "/api/habit-trackers", createRequest)
	if err != nil {
		t.Fatal(err)
	}

	var createdHabit habit.HabitTracker
	if err := json.Unmarshal(rr.Body.Bytes(), &createdHabit); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	// Test with invalid datetime format
	invalidEntry := models.AddEntryRequest{
		Done: func() *bool { b := true; return &b }(),
		Date: "invalid-date-format",
		Note: "Should fail",
	}

	entryRr, err := makeRequest("POST", fmt.Sprintf("/api/habit-trackers/%d/entries", createdHabit.ID), invalidEntry)
	if err != nil {
		t.Fatal(err)
	}

	if entryRr.Code != http.StatusBadRequest {
		t.Errorf("Expected status %d for invalid date, got %d. Body: %s", http.StatusBadRequest, entryRr.Code, entryRr.Body.String())
	}
}