package absen

import (
	"fmt"
	"net/http"

	"github.com/go-playground/validator/v10"
	hr "github.com/jhiven/online-mis-wrapper/internal/core/http_request"
	v "github.com/jhiven/online-mis-wrapper/internal/core/validator"
	"github.com/jhiven/online-mis-wrapper/internal/resources/common"
	"github.com/redis/go-redis/v9"
)

type AbsenHandler struct {
	extractor *AbsenExtractor
	validate  *validator.Validate
	client    *http.Client
	cache     *redis.Client
}

func New(validate *validator.Validate, client *http.Client, cache *redis.Client) *AbsenHandler {
	return &AbsenHandler{
		extractor: &AbsenExtractor{},
		validate:  validate,
		client:    client,
		cache:     cache,
	}
}

func (h *AbsenHandler) GetAbsen(w http.ResponseWriter, r *http.Request) error {
	nrp, _ := r.Cookie("nrp")
	year, semester, err := v.YearSemesterValidator(r.URL.Query(), h.validate)
	if err != nil {
		return err
	}

	opt := &hr.HttpRequest{
		Client: h.client,
		Method: http.MethodGet,
		Path: fmt.Sprintf(
			"https://online.mis.pens.ac.id/absen.php?valTahun=%v&valSemester=%v",
			year,
			semester,
		),
	}

	handler := common.OnlineMisHandler[AbsenData]{
		Req:       opt,
		Extractor: h.extractor,
		Cache:     h.cache,
		CacheKey:  fmt.Sprintf("absen:%s:%s:%s", nrp.Value, year, semester),
	}

	if err := handler.RequestHandler(w, r); err != nil {
		return err
	}

	return nil
}
