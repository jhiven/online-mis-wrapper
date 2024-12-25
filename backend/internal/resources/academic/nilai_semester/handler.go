package nilaisemester

import (
	"fmt"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/jhiven/online-mis-wrapper/internal/core/helper"
	hr "github.com/jhiven/online-mis-wrapper/internal/core/http_request"
	v "github.com/jhiven/online-mis-wrapper/internal/core/validator"
)

type NilaiSemesterHandler struct {
	extractor *NilaiSemesterExtractor
	validate  *validator.Validate
	client    *http.Client
}

func New(validate *validator.Validate, client *http.Client) *NilaiSemesterHandler {
	return &NilaiSemesterHandler{
		extractor: &NilaiSemesterExtractor{},
		validate:  validate,
		client:    client,
	}
}

func (h *NilaiSemesterHandler) GetNilai(w http.ResponseWriter, r *http.Request) error {

	year, semester, err := v.YearSemesterValidator(r.URL.Query(), h.validate)
	if err != nil {
		return err
	}

	opt := &hr.HttpRequest{
		Client: h.client,
		Method: http.MethodGet,
		Path: fmt.Sprintf(
			"https://online.mis.pens.ac.id/nilai_sem.php?valTahun=%v&valSemester=%v",
			year,
			semester,
		),
	}

	handler := helper.OnlineMisHandler[NilaiSemesterData]{
		Req:       opt,
		Extractor: h.extractor,
	}

	if err := handler.RequestHandler(w, r); err != nil {
		return err
	}

	return nil
}