package absen

import "github.com/jhiven/online-mis-wrapper/internal/resources/common"

type table struct {
	Kode       string   `json:"kode"       redis:"kode"`
	MataKuliah string   `json:"mataKuliah" redis:"mataKuliah"`
	Minggu     []string `json:"minggu"     redis:"minggu"`
	Kehadiran  string   `json:"kehadiran"  redis:"kehadiran"`
}

type AbsenData struct {
	common.SemesterListData
	Table []table `json:"table" redis:"table"`
}
