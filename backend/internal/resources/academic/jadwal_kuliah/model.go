package jadwalkuliah

import "github.com/jhiven/online-mis-wrapper/internal/core/helper"

type Hari string

const (
	SENIN  Hari = "senin"
	SELASA      = "selasa"
	RABU        = "rabu"
	KAMIS       = "kamis"
	JUMAT       = "jumat"
	SABTU       = "sabtu"
	MINGGU      = "minggu"
)

type JadwalKuliahData struct {
	helper.SemesterListData
	Kelas        string `json:"kelas"`
	JamIstirahat string `json:"jamIstirahat"`
	Table        table  `json:"table"`
}

type MataKuliah struct {
	Nama    string `json:"nama"`
	Dosen   string `json:"dosen"`
	Jam     string `json:"jam"`
	Ruangan string `json:"ruangan"`
}

type table map[Hari][]MataKuliah
