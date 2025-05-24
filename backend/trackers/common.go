package trackers

import "routine-tracker/trackers/habit"
import "routine-tracker/trackers/target"

type TrackersResponse struct {
	HabitTrackers  []habit.HabitTracker  `json:"habitTrackers"`
	TargetTrackers []target.TargetTracker `json:"targetTrackers"`
}


type DashboardResponse struct {
	Date           string          `json:"date" example:"2024-01-01"`
	HabitTrackers  []habit.HabitTracker  `json:"habitTrackers"`
	TargetTrackers []target.TargetTracker `json:"targetTrackers"`
}
