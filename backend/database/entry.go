package database

import (
	"database/sql"
	"routine-tracker/models"
)

func CreateEntry(e models.Entry) (*models.Entry, error) {
	query := `
        INSERT INTO entries (tracker_id, type, value, done, date, note)
        VALUES (?, ?, ?, ?, ?, ?)
    `

	result, err := DB.Exec(query, e.TrackerID, e.Type, e.Value, e.Done, e.Date, e.Note)
	if err != nil {
		return nil, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}

	e.ID = int(id)
	return &e, nil
}

func GetEntriesByTracker(trackerID int, trackerType string) ([]models.Entry, error) {
	// Get the tracker's start date to filter entries
	var startDate string
	var query string
	
	if trackerType == "habit" {
		startQuery := `SELECT start_date FROM habit_trackers WHERE id = ?`
		err := DB.QueryRow(startQuery, trackerID).Scan(&startDate)
		if err != nil {
			return nil, err
		}
	} else if trackerType == "target" {
		startQuery := `SELECT start_date FROM target_trackers WHERE id = ?`
		err := DB.QueryRow(startQuery, trackerID).Scan(&startDate)
		if err != nil {
			return nil, err
		}
	}

	// Use JULIANDAY for proper date comparison that handles timezone differences
	// This compares the date part only, ignoring time and timezone
	query = `
        SELECT id, tracker_id, type, value, done, date, note, created_at
        FROM entries 
        WHERE tracker_id = ? AND type = ? 
        AND JULIANDAY(date) >= JULIANDAY(?)
        ORDER BY date DESC
    `

	rows, err := DB.Query(query, trackerID, trackerType, startDate)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

  entries := make([]models.Entry, 0)

	for rows.Next() {
		var e models.Entry
		var value sql.NullFloat64
		var done sql.NullBool

		err := rows.Scan(&e.ID, &e.TrackerID, &e.Type, &value, &done, &e.Date, &e.Note, &e.CreatedAt)
		if err != nil {
			return nil, err
		}

		if value.Valid {
			e.Value = value.Float64
		}
		if done.Valid {
			boolVal := done.Bool
			e.Done = &boolVal
		}

		entries = append(entries, e)
	}

	return entries, nil
}

func GetAllEntries() ([]models.Entry, error) {
	query := `
        SELECT id, tracker_id, type, value, done, date, note, created_at
        FROM entries ORDER BY created_at DESC
    `

	rows, err := DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []models.Entry

	for rows.Next() {
		var e models.Entry
		var value sql.NullFloat64
		var done sql.NullBool

		err := rows.Scan(&e.ID, &e.TrackerID, &e.Type, &value, &done, &e.Date, &e.Note, &e.CreatedAt)
		if err != nil {
			return nil, err
		}

		if value.Valid {
			e.Value = value.Float64
		}
		if done.Valid {
			boolVal := done.Bool
			e.Done = &boolVal
		}

		entries = append(entries, e)
	}

	return entries, nil
}

func DeleteEntry(entryID int) error {
	query := `DELETE FROM entries WHERE id = ?`
	
	result, err := DB.Exec(query, entryID)
	if err != nil {
		return err
	}
	
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	
	if rowsAffected == 0 {
		return sql.ErrNoRows
	}
	
	return nil
}
