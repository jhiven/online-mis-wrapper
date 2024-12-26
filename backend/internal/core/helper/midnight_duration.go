package helper

import (
	"time"
)

func MidnightDuration() (time.Duration, error) {
	loc, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		return 0, err
	}
	now := time.Now().In(loc)
	midnight := time.Date(now.Year(), now.Month(), now.Day()+1, 0, 0, 0, 0, loc)
	duration := midnight.Sub(now)

	return duration, nil
}
