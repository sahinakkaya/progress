package database

import (
    "database/sql"
    "encoding/json"
    "time"
    "routine-tracker/trackers/habit"
)

func CreateHabitTracker(h habit.HabitTracker) (*habit.HabitTracker, error) {
    // Convert Due struct to JSON string for storage
    dueSpecificDays, _ := json.Marshal(h.Due.SpecificDays)
    reminderTimes, _ := json.Marshal(h.Reminders.Times)
    
    query := `
        INSERT INTO habit_trackers (
            tracker_name, goal, time_period, start_date, due_type,
            due_specific_days, due_interval_type, due_interval_value,
            reminder_times, reminder_enabled, bad_habit, goal_streak
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    result, err := DB.Exec(query,
        h.TrackerName, h.Goal, h.TimePeriod, h.StartDate, h.Due.Type,
        string(dueSpecificDays), h.Due.IntervalType, h.Due.IntervalValue,
        string(reminderTimes), h.Reminders.Enabled, h.BadHabit, h.GoalStreak,
    )
    
    if err != nil {
        return nil, err
    }
    
    id, err := result.LastInsertId()
    if err != nil {
        return nil, err
    }
    
    h.ID = int(id)
    h.CreatedAt = time.Now()
    
    return &h, nil
}

func GetAllHabitTrackers() ([]habit.HabitTracker, error) {
    query := `
        SELECT id, tracker_name, goal, time_period, start_date, due_type,
               due_specific_days, due_interval_type, due_interval_value,
               reminder_times, reminder_enabled, bad_habit, goal_streak, created_at
        FROM habit_trackers ORDER BY created_at DESC
    `
    
    rows, err := DB.Query(query)
    if err != nil {
        return nil, err
    }
    defer rows.Close()
    
    var habits []habit.HabitTracker
    
    for rows.Next() {
        var h habit.HabitTracker
        var dueSpecificDaysJSON, reminderTimesJSON string
        var goalStreak sql.NullInt64
        
        err := rows.Scan(
            &h.ID, &h.TrackerName, &h.Goal, &h.TimePeriod, &h.StartDate,
            &h.Due.Type, &dueSpecificDaysJSON, &h.Due.IntervalType, &h.Due.IntervalValue,
            &reminderTimesJSON, &h.Reminders.Enabled, &h.BadHabit, &goalStreak, &h.CreatedAt,
        )
        
        if err != nil {
            return nil, err
        }
        
        // Convert JSON strings back to structs
        json.Unmarshal([]byte(dueSpecificDaysJSON), &h.Due.SpecificDays)
        json.Unmarshal([]byte(reminderTimesJSON), &h.Reminders.Times)
        
        if goalStreak.Valid {
            streak := int(goalStreak.Int64)
            h.GoalStreak = &streak
        }
        
        habits = append(habits, h)
    }
    
    return habits, nil
}

func GetHabitTrackerByID(id int) (*habit.HabitTracker, error) {
    query := `
        SELECT id, tracker_name, goal, time_period, start_date, due_type,
               due_specific_days, due_interval_type, due_interval_value,
               reminder_times, reminder_enabled, bad_habit, goal_streak, created_at
        FROM habit_trackers WHERE id = ?
    `
    
    var h habit.HabitTracker
    var dueSpecificDaysJSON, reminderTimesJSON string
    var goalStreak sql.NullInt64
    
    err := DB.QueryRow(query, id).Scan(
        &h.ID, &h.TrackerName, &h.Goal, &h.TimePeriod, &h.StartDate,
        &h.Due.Type, &dueSpecificDaysJSON, &h.Due.IntervalType, &h.Due.IntervalValue,
        &reminderTimesJSON, &h.Reminders.Enabled, &h.BadHabit, &goalStreak, &h.CreatedAt,
    )
    
    if err != nil {
        return nil, err
    }
    
    json.Unmarshal([]byte(dueSpecificDaysJSON), &h.Due.SpecificDays)
    json.Unmarshal([]byte(reminderTimesJSON), &h.Reminders.Times)
    
    if goalStreak.Valid {
        streak := int(goalStreak.Int64)
        h.GoalStreak = &streak
    }
    
    return &h, nil
}

func UpdateHabitTracker(id int, h habit.UpdateHabitRequest) error {
    // First get the current habit tracker to merge with updates
    current, err := GetHabitTrackerByID(id)
    if err != nil {
        return err
    }
    
    // Apply updates to current values
    if h.TrackerName != nil {
        current.TrackerName = *h.TrackerName
    }
    if h.Goal != nil {
        current.Goal = *h.Goal
    }
    if h.TimePeriod != nil {
        current.TimePeriod = *h.TimePeriod
    }
    if h.StartDate != nil {
        startDate, err := time.Parse("2006-01-02", *h.StartDate)
        if err != nil {
            return err
        }
        current.StartDate = startDate
    }
    if h.Due != nil {
        current.Due = *h.Due
    }
    if h.Reminders != nil {
        current.Reminders = *h.Reminders
    }
    if h.BadHabit != nil {
        current.BadHabit = *h.BadHabit
    }
    if h.GoalStreak != nil {
        current.GoalStreak = h.GoalStreak
    }
    
    // Now update with the merged values
    dueSpecificDays, _ := json.Marshal(current.Due.SpecificDays)
    reminderTimes, _ := json.Marshal(current.Reminders.Times)
    
    query := `
        UPDATE habit_trackers SET
            tracker_name = ?, goal = ?, time_period = ?, start_date = ?,
            due_type = ?, due_specific_days = ?, due_interval_type = ?, due_interval_value = ?,
            reminder_times = ?, reminder_enabled = ?, bad_habit = ?, goal_streak = ?
        WHERE id = ?
    `
    
    _, err = DB.Exec(query,
        current.TrackerName, current.Goal, current.TimePeriod, current.StartDate,
        current.Due.Type, string(dueSpecificDays), current.Due.IntervalType, current.Due.IntervalValue,
        string(reminderTimes), current.Reminders.Enabled, current.BadHabit, current.GoalStreak, id,
    )
    
    return err
}

func DeleteHabitTracker(id int) error {
    // Delete tracker and its entries in a transaction
    tx, err := DB.Begin()
    if err != nil {
        return err
    }
    defer tx.Rollback()
    
    // Delete entries first
    _, err = tx.Exec("DELETE FROM entries WHERE tracker_id = ? AND type = 'habit'", id)
    if err != nil {
        return err
    }
    
    // Delete tracker
    _, err = tx.Exec("DELETE FROM habit_trackers WHERE id = ?", id)
    if err != nil {
        return err
    }
    
    return tx.Commit()
}
