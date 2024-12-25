package absen

import "github.com/jhiven/online-mis-wrapper/internal/core/helper"

type table struct {
	Kode       string   `json:"kode"`
	MataKuliah string   `json:"mataKuliah"`
	Minggu     []string `json:"minggu"`
	Kehadiran  string   `json:"kehadiran"`
}

type AbsenData struct {
	helper.SemesterListData
	Table []table `json:"table"`
}
