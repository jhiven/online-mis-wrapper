package helper

type SemesterListData struct {
	Semester []int `json:"semester"`
	Year     []int `json:"year"`
}

type SemesterData struct {
	Year     int `json:"year"     validate:"required,numeric"`
	Semester int `json:"semester" validate:"required,numeric,oneof=1 2"`
}
