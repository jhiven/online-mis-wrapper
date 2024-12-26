package common

type SemesterListData struct {
	Semester []int `json:"semester" redis:"semester"`
	Year     []int `json:"year"     redis:"year"`
}

type SemesterData struct {
	Year     int `json:"year"     validate:"required,numeric"`
	Semester int `json:"semester" validate:"required,numeric,oneof=1 2"`
}
