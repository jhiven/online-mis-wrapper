package nilaisemester

import "github.com/jhiven/online-mis-wrapper/internal/core/helper"

type NilaiSemesterData struct {
	helper.SemesterListData
	Table []table `json:"table"`
}

type table struct {
	Kode       string `json:"kode"`
	MataKuliah string `json:"mataKuliah"`
	Value      string `json:"value"`
}
