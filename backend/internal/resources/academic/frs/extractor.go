package frs

import (
	"io"
	"slices"
	"strconv"
	"strings"

	"github.com/PuerkitoBio/goquery"
	"github.com/jhiven/online-mis-wrapper/internal/core/helper"
	v "github.com/jhiven/online-mis-wrapper/internal/core/validator"
	"github.com/jhiven/online-mis-wrapper/internal/resources/common"
)

type FRSExtractor struct{}

func (e *FRSExtractor) Extract(r io.Reader) (*FRSData, error) {
	doc, err := v.ParseAndValidateExtractor(r)
	if err != nil {
		return nil, err
	}

	semester := goquery.Map(doc.Find(
		"table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(2) > font:nth-child(1) > font:nth-child(1) > select:nth-child(1) > option",
	), func(i int, s *goquery.Selection) int {
		val := s.AttrOr("value", "")
		sem, _ := strconv.Atoi(val)
		return sem
	})

	year := goquery.Map(doc.Find(
		"table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(2) > td:nth-child(2) > font:nth-child(1) > font:nth-child(1) > select:nth-child(1) > option",
	), func(i int, s *goquery.Selection) int {
		val := s.AttrOr("value", "")
		sem, _ := strconv.Atoi(val)
		return sem
	})

	dosen := strings.TrimSpace(doc.Find(
		"table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(5) > td:nth-child(2) > font:nth-child(1)",
	).Text())

	sks := strings.Split(strings.TrimSpace(doc.Find(
		"table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(6) > td:nth-child(2) > font:nth-child(1)",
	).Text()), " ")

	ip := strings.Split(strings.TrimSpace(doc.Find(
		"table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(7) > td:nth-child(2) > font:nth-child(1)",
	).Text()), " ")

	tanggalPengisian := slices.Collect(helper.Map(slices.Values(strings.Split(doc.Find(
		"table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(8) > td:nth-child(2) > font:nth-child(1) > i:nth-child(2)",
	).Text(), "sd")), func(s string) string {
		return strings.TrimSpace(s)
	}))

	tanggalPerubahan := slices.Collect(helper.Map(slices.Values(strings.Split(doc.Find(
		"table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(8) > td:nth-child(2) > font:nth-child(1) > i:nth-child(4)",
	).Text(), "sd")), func(s string) string {
		return strings.TrimSpace(s)
	}))

	tanggalDrop := slices.Collect(helper.Map(slices.Values(strings.Split(doc.Find(
		"table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(8) > td:nth-child(2) > font:nth-child(1) > i:nth-child(6)",
	).Text(), "sd")), func(s string) string {
		return strings.TrimSpace(s)
	}))

	tbl := goquery.Map(doc.Find(
		"table > tbody > tr:nth-child(3) > td > div > table > tbody > tr > td > table > tbody > tr:nth-child(10) > td:nth-child(2) > table:nth-child(1) > tbody > tr:not(:first-child):not(:last-child)",
	), func(i int, s *goquery.Selection) table {
		id := strings.TrimSpace(s.Find("td:nth-child(1) a").AttrOr("href", ""))
		kode := strings.TrimSpace(s.Find("td:nth-child(3) font").Text())
		group := strings.TrimSpace(s.Find("td:nth-child(4) font").Text())
		dosen := strings.TrimSpace(s.Find("td:nth-child(6) font").Text())
		sks := strings.TrimSpace(s.Find("td:nth-child(7) font").Text())
		kelas := strings.TrimSpace(s.Find("td:nth-child(8) font").Text())
		disetujui := strings.TrimSpace(s.Find("td:nth-child(9) font").Text())
		matkul := s.Find("td:nth-child(5) font").
			Contents().
			Map(func(i int, s *goquery.Selection) string {
				return strings.TrimSpace(s.Text())
			})

		return table{
			Kode:      kode,
			Id:        id,
			Group:     group,
			Sks:       sks,
			Kelas:     kelas,
			Disetujui: disetujui,
			Dosen:     dosen,
			MataKuliah: mataKuliah{
				Nama: matkul[0],
				Hari: strings.TrimSpace(strings.Split(matkul[2], " : ")[1]),
				Jam:  strings.TrimSpace(strings.Split(matkul[4], " : ")[1]),
			},
		}
	})

	batas, _ := strconv.Atoi(sks[0])
	sisa, _ := strconv.Atoi(sks[2])
	ipk, _ := strconv.ParseFloat(ip[0], 64)
	ips, _ := strconv.ParseFloat(ip[2], 64)

	return &FRSData{
		Dosen: dosen,
		Sks: struct {
			Batas int "json:\"batas\""
			Sisa  int "json:\"sisa\""
		}{
			Batas: batas,
			Sisa:  sisa,
		},
		Ip: struct {
			Ipk float64 "json:\"ipk\""
			Ips float64 "json:\"ips\""
		}{
			Ipk: ipk,
			Ips: ips,
		},
		TanggalPenting: tanggalPenting{
			Pengisian: dateRange{From: tanggalPengisian[0], To: tanggalPengisian[1]},
			Perubahan: dateRange{From: tanggalPerubahan[0], To: tanggalPerubahan[1]},
			Drop:      dateRange{From: tanggalDrop[0], To: tanggalDrop[1]},
		},
		SemesterListData: common.SemesterListData{Semester: semester, Year: year},
		Table:            tbl,
	}, nil
}
