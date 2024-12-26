package frs

import "github.com/jhiven/online-mis-wrapper/internal/resources/common"

type FRSData struct {
	common.SemesterListData
	Dosen string `json:"dosen"`
	Sks   struct {
		Batas int `json:"batas"`
		Sisa  int `json:"sisa"`
	} `json:"sks"`
	Ip struct {
		Ipk float64 `json:"ipk"`
		Ips float64 `json:"ips"`
	} `json:"ip"`
	TanggalPenting tanggalPenting `json:"tanggalPenting"`
	Table          []table        `json:"table"`
}

type table struct {
	Id         string     `json:"id"`
	Kode       string     `json:"kode"`
	Group      string     `json:"group"`
	MataKuliah mataKuliah `json:"mataKuliah"`
	Dosen      string     `json:"dosen"`
	Sks        string     `json:"sks"`
	Kelas      string     `json:"kelas"`
	Disetujui  string     `json:"disetujui"`
}

type mataKuliah struct {
	Nama string `json:"nama"`
	Hari string `json:"hari"`
	Jam  string `json:"jam"`
}

type dateRange struct {
	From string `json:"from"`
	To   string `json:"to"`
}

type tanggalPenting struct {
	Pengisian dateRange `json:"pengisian"`
	Perubahan dateRange `json:"perubahan"`
	Drop      dateRange `json:"drop"`
}
