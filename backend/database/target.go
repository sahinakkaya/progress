package database

import (
	"encoding/json"
	"routine-tracker/trackers/target"
	"time"
)

func CreateTargetTracker(t target.TargetTracker) (*target.TargetTracker, error) {
	dueSpecificDays, _ := json.Marshal(t.Due.SpecificDays)
	reminderTimes, _ := json.Marshal(t.Reminders.Times)

	query := `
        INSERT INTO target_trackers (
            tracker_name, start_value, goal_value, start_date, goal_date, add_to_total, use_actual_bounds,
            due_type, due_specific_days, due_interval_type, due_interval_value,
            reminder_times, reminder_enabled
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

	result, err := DB.Exec(query,
		t.TrackerName, t.StartValue, t.GoalValue, t.StartDate, t.GoalDate, t.AddToTotal, t.UseActualBounds,
		t.Due.Type, string(dueSpecificDays), t.Due.IntervalType, t.Due.IntervalValue,
		string(reminderTimes), t.Reminders.Enabled,
	)

	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	t.ID = int(id)
	t.CreatedAt = time.Now()

	return &t, nil
}

func GetAllTargetTrackers() ([]target.TargetTracker, error) {
	query := `
        SELECT id, tracker_name, start_value, goal_value, start_date, goal_date, add_to_total, use_actual_bounds,
               due_type, due_specific_days, due_interval_type, due_interval_value,
               reminder_times, reminder_enabled, created_at
        FROM target_trackers ORDER BY created_at DESC
    `

	rows, err := DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var targets []target.TargetTracker

	for rows.Next() {
		var t target.TargetTracker
		var dueSpecificDaysJSON, reminderTimesJSON string

		err := rows.Scan(
			&t.ID, &t.TrackerName, &t.StartValue, &t.GoalValue, &t.StartDate, &t.GoalDate, &t.AddToTotal, &t.UseActualBounds,
			&t.Due.Type, &dueSpecificDaysJSON, &t.Due.IntervalType, &t.Due.IntervalValue,
			&reminderTimesJSON, &t.Reminders.Enabled, &t.CreatedAt,
		)

		if err != nil {
			return nil, err
		}

		json.Unmarshal([]byte(dueSpecificDaysJSON), &t.Due.SpecificDays)
		json.Unmarshal([]byte(reminderTimesJSON), &t.Reminders.Times)

		targets = append(targets, t)
	}

	return targets, nil
}

func GetTargetTrackerByID(id int) (*target.TargetTracker, error) {

	query := `
        SELECT id, tracker_name, start_value, goal_value, start_date, goal_date, add_to_total, use_actual_bounds,
               due_type, due_specific_days, due_interval_type, due_interval_value,
               reminder_times, reminder_enabled, created_at
        FROM target_trackers WHERE id = ?
    `
	var t target.TargetTracker
	var dueSpecificDaysJSON, reminderTimesJSON string

	err := DB.QueryRow(query, id).Scan(
		&t.ID, &t.TrackerName, &t.StartValue, &t.GoalValue, &t.StartDate, &t.GoalDate, &t.AddToTotal, &t.UseActualBounds,
		&t.Due.Type, &dueSpecificDaysJSON, &t.Due.IntervalType, &t.Due.IntervalValue,
		&reminderTimesJSON, &t.Reminders.Enabled, &t.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	json.Unmarshal([]byte(dueSpecificDaysJSON), &t.Due.SpecificDays)
	json.Unmarshal([]byte(reminderTimesJSON), &t.Reminders.Times)

	return &t, nil

}

func UpdateTargetTracker(id int, t target.UpdateTargetRequest) error {
	// First get the current target tracker to merge with updates
	current, err := GetTargetTrackerByID(id)
	if err != nil {
		return err
	}
	
	// Apply updates to current values
	if t.TrackerName != nil {
		current.TrackerName = *t.TrackerName
	}
	if t.StartValue != nil {
		current.StartValue = *t.StartValue
	}
	if t.GoalValue != nil {
		current.GoalValue = *t.GoalValue
	}
	if t.StartDate != nil {
		startDate, err := time.Parse("2006-01-02", *t.StartDate)
		if err != nil {
			return err
		}
		current.StartDate = startDate
	}
	if t.GoalDate != nil {
		goalDate, err := time.Parse("2006-01-02", *t.GoalDate)
		if err != nil {
			return err
		}
		current.GoalDate = goalDate
	}
	if t.AddToTotal != nil {
		current.AddToTotal = *t.AddToTotal
	}
	if t.UseActualBounds != nil {
		current.UseActualBounds = *t.UseActualBounds
	}
	if t.Due != nil {
		current.Due = *t.Due
	}
	if t.Reminders != nil {
		current.Reminders = *t.Reminders
	}
	
	// Now update with the merged values
	dueSpecificDays, _ := json.Marshal(current.Due.SpecificDays)
	reminderTimes, _ := json.Marshal(current.Reminders.Times)

	query := `
        UPDATE target_trackers SET
            tracker_name = ?, start_value = ?, goal_value = ?, start_date = ?, goal_date = ?, add_to_total = ?, use_actual_bounds = ?,
            due_type = ?, due_specific_days = ?, due_interval_type = ?, due_interval_value = ?,
            reminder_times = ?, reminder_enabled = ?
        WHERE id = ?
    `

	_, err = DB.Exec(query,
		current.TrackerName, current.StartValue, current.GoalValue, current.StartDate, current.GoalDate, current.AddToTotal, current.UseActualBounds,
		current.Due.Type, string(dueSpecificDays), current.Due.IntervalType, current.Due.IntervalValue,
		string(reminderTimes), current.Reminders.Enabled, id,
	)

	return err
}

func DeleteTargetTracker(id int) error {
	tx, err := DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	_, err = tx.Exec("DELETE FROM entries WHERE tracker_id = ? AND type = 'target'", id)
	if err != nil {
		return err
	}

	_, err = tx.Exec("DELETE FROM target_trackers WHERE id = ?", id)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// CalculateCurrentValue calculates the current value for a target tracker based on its entries
func CalculateCurrentValue(tracker *target.TargetTracker) (float64, error) {
	entries, err := GetEntriesByTracker(tracker.ID, "target")
	if err != nil {
		return tracker.StartValue, err
	}

	if tracker.AddToTotal {
		// Additive: sum all entry values and add to start value
		total := tracker.StartValue
		for _, entry := range entries {
			total += entry.Value
		}
		return total, nil
	} else {
		// Replacement: use the most recent entry value, or start value if no entries
		if len(entries) > 0 {
			// entries are already ordered by date DESC from GetEntriesByTracker
			return entries[0].Value, nil
		}
		return tracker.StartValue, nil
	}
}

// GetAdjustedStartValue returns the adjusted start value based on UseActualBounds setting
func GetAdjustedStartValue(tracker *target.TargetTracker) (float64, error) {
	if !tracker.UseActualBounds {
		return tracker.StartValue, nil
	}

	entries, err := GetEntriesByTracker(tracker.ID, "target")
	if err != nil {
		return tracker.StartValue, err
	}

	if len(entries) == 0 {
		return tracker.StartValue, nil
	}

	// Calculate all progress values
	var allValues []float64
	if tracker.AddToTotal {
		// For additive targets, calculate cumulative values
		cumulative := tracker.StartValue
		for i := len(entries) - 1; i >= 0; i-- { // Process in chronological order
			cumulative += entries[i].Value
			allValues = append(allValues, cumulative)
		}
	} else {
		// For replacement targets, use actual entry values
		for _, entry := range entries {
			allValues = append(allValues, entry.Value)
		}
	}

	// Find min and max values
	minValue := allValues[0]
	maxValue := allValues[0]
	for _, value := range allValues {
		if value < minValue {
			minValue = value
		}
		if value > maxValue {
			maxValue = value
		}
	}

	// For increasing targets (startValue < goalValue), use the lower bound
	// For decreasing targets (startValue > goalValue), use the upper bound
	if tracker.StartValue < tracker.GoalValue {
		if minValue < tracker.StartValue {
			return minValue, nil
		}
	} else {
		if maxValue > tracker.StartValue {
			return maxValue, nil
		}
	}

	return tracker.StartValue, nil
}
