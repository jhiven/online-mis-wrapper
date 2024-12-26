package jadwalkuliah

import (
	"io"
	"strconv"
	"strings"

	"github.com/PuerkitoBio/goquery"
	v "github.com/jhiven/online-mis-wrapper/internal/core/validator"
	"github.com/jhiven/online-mis-wrapper/internal/resources/common"
)

type JadwalKuliahExtractor struct{}

func (e *JadwalKuliahExtractor) Extract(r io.Reader) (*JadwalKuliahData, error) {
	doc, err := v.ParseAndValidateExtractor(r)

	if err != nil {
		return nil, err
	}

	semester := goquery.Map(doc.Find(
		"table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(2) > font:nth-child(1) > font:nth-child(1) > select:nth-child(1) > option",
	), func(i int, s *goquery.Selection) int {
		val, _ := s.Attr("value")
		sem, _ := strconv.Atoi(val)
		return sem
	})

	year := goquery.Map(doc.Find(
		"table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(2) > td:nth-child(2) > font:nth-child(1) > font:nth-child(1) > select:nth-child(1) > option",
	), func(i int, s *goquery.Selection) int {
		val, _ := s.Attr("value")
		sem, _ := strconv.Atoi(val)
		return sem
	})

	jamIstirahat := strings.TrimSpace(doc.Find(
		"table > tbody > tr:nth-child(3) > td > div > table > tbody > tr > td > table > tbody > tr:nth-child(4) > td:nth-child(2) > table > tbody > tr > td > table:nth-child(2) > tbody > tr:nth-child(9) > td > strong",
	).Text())

	kelas := strings.TrimSpace(doc.Find(
		"table > tbody > tr:nth-child(3) > td > div > table > tbody > tr > td > table > tbody > tr:nth-child(4) > td:nth-child(2) > table > tbody > tr > td > table:nth-child(1) > tbody > tr > td > div > b",
	).Text())

	tbl := goquery.Map(doc.Find(
		"body > table > tbody > tr:nth-child(3) > td > div > table > tbody > tr > td > table > tbody > tr:nth-child(4) > td:nth-child(2) > table > tbody > tr > td > table:nth-child(2) > tbody > tr:not(:first-child):not(:last-child)",
	), func(i int, s *goquery.Selection) []MataKuliah {
		listMatkulPerHari := goquery.Map(
			s.Find("tr:nth-child(odd) > td:nth-child(2) > div"),
			func(i int, s *goquery.Selection) MataKuliah {
				matkul := s.Contents().Map(func(i int, s *goquery.Selection) string {
					return strings.TrimSpace(s.Text())
				})

				nama := matkul[0]
				dosen := strings.TrimSpace(strings.Split(matkul[2], "-")[0])
				jam := strings.TrimSpace(strings.Split(matkul[2], "-")[1])
				ruangan := strings.TrimSpace(matkul[4])

				return MataKuliah{Nama: nama, Dosen: dosen, Jam: jam, Ruangan: ruangan}
			},
		)

		return listMatkulPerHari
	})

	return &JadwalKuliahData{
		SemesterListData: common.SemesterListData{Semester: semester, Year: year},
		Kelas:            kelas,
		JamIstirahat:     jamIstirahat,
		Table: map[Hari][]MataKuliah{
			SABTU:  tbl[6],
			JUMAT:  tbl[5],
			KAMIS:  tbl[4],
			RABU:   tbl[3],
			SELASA: tbl[2],
			SENIN:  tbl[1],
			MINGGU: tbl[0],
		},
	}, nil
}
