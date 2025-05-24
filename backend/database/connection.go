package database

import (
    "database/sql"
    "log"
    _ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

func Init() error {
    var err error
    DB, err = sql.Open("sqlite3", "./tracker.db")
    if err != nil {
        return err
    }
    
    if err = DB.Ping(); err != nil {
        return err
    }
    
    log.Println("📦 Database connected successfully")
    
    return createTables()
}

func createTables() error {
    habitTable := `
    CREATE TABLE IF NOT EXISTS habit_trackers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tracker_name TEXT NOT NULL,
        goal REAL NOT NULL,
        time_period TEXT NOT NULL,
        start_date DATETIME NOT NULL,
        due_type TEXT NOT NULL,
        due_specific_days TEXT,
        due_interval_type TEXT,
        due_interval_value INTEGER,
        reminder_times TEXT,
        reminder_enabled BOOLEAN DEFAULT TRUE,
        bad_habit BOOLEAN DEFAULT FALSE,
        goal_streak INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
    
    targetTable := `
    CREATE TABLE IF NOT EXISTS target_trackers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tracker_name TEXT NOT NULL,
        start_value REAL NOT NULL,
        goal_value REAL NOT NULL,
        start_date DATETIME NOT NULL,
        goal_date DATETIME NOT NULL,
        add_to_total BOOLEAN DEFAULT FALSE,
        due_type TEXT NOT NULL,
        due_specific_days TEXT,
        due_interval_type TEXT,
        due_interval_value INTEGER,
        reminder_times TEXT,
        reminder_enabled BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
    
    entriesTable := `
    CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tracker_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        value REAL,
        done BOOLEAN,
        date DATETIME NOT NULL,
        note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
    
    tables := []string{habitTable, targetTable, entriesTable}
    
    for _, table := range tables {
        if _, err := DB.Exec(table); err != nil {
            return err
        }
    }
    
    log.Println("📋 Database tables created/verified")
    return nil
}

func Close() error {
    if DB != nil {
        return DB.Close()
    }
    return nil
}

func InitTest(dbPath string) error {
    var err error
    DB, err = sql.Open("sqlite3", dbPath)
    if err != nil {
        return err
    }
    
    if err = DB.Ping(); err != nil {
        return err
    }
    
    return createTables()
}
