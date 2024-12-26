package absen

import (
	"io"
	"strconv"
	"strings"

	"github.com/PuerkitoBio/goquery"
	v "github.com/jhiven/online-mis-wrapper/internal/core/validator"
	"github.com/jhiven/online-mis-wrapper/internal/resources/common"
)

type AbsenExtractor struct{}

func (e *AbsenExtractor) Extract(r io.Reader) (*AbsenData, error) {
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

	tbl := goquery.Map(doc.Find(
		"table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(4) > td:nth-child(2) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:not(:first-child):not(:nth-child(2))",
	), func(i int, s *goquery.Selection) table {
		kode := strings.TrimSpace(s.Find("td:nth-child(1)").Text())
		mataKuliah := strings.TrimSpace(s.Find("td:nth-child(2)").Text())
		minggu := s.Find("td:not(:nth-child(1)):not(:nth-child(2)):not(:last-child)").
			Map(func(i int, s *goquery.Selection) string {
				return s.Text()
			})
		kehadiran := strings.TrimSpace(s.Find("td:last-child").Text())
		return table{Kode: kode, MataKuliah: mataKuliah, Minggu: minggu, Kehadiran: kehadiran}
	})

	return &AbsenData{
		SemesterListData: common.SemesterListData{Semester: semester, Year: year},
		Table:            tbl,
	}, nil
}
