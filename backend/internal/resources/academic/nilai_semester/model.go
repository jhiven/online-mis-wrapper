package nilaisemester

import "github.com/jhiven/online-mis-wrapper/internal/resources/common"

type NilaiSemesterData struct {
	common.SemesterListData
	Table []table `json:"table"`
}

type table struct {
	Kode       string `json:"kode"`
	MataKuliah string `json:"mataKuliah"`
	Value      string `json:"value"`
}
