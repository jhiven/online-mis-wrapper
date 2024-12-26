package jadwalkuliah

import (
	"fmt"
	"net/http"

	"github.com/go-playground/validator/v10"
	hr "github.com/jhiven/online-mis-wrapper/internal/core/http_request"
	v "github.com/jhiven/online-mis-wrapper/internal/core/validator"
	"github.com/jhiven/online-mis-wrapper/internal/resources/common"
	"github.com/redis/go-redis/v9"
)

type JadwalKuliahHandler struct {
	extractor *JadwalKuliahExtractor
	validate  *validator.Validate
	client    *http.Client
	cache     *redis.Client
}

func New(
	validate *validator.Validate,
	client *http.Client,
	cache *redis.Client,
) *JadwalKuliahHandler {
	return &JadwalKuliahHandler{
		extractor: &JadwalKuliahExtractor{},
		validate:  validate,
		client:    client,
		cache:     cache,
	}
}

func (h *JadwalKuliahHandler) GetJadwal(w http.ResponseWriter, r *http.Request) error {
	nrp, _ := r.Cookie("nrp")
	year, semester, err := v.YearSemesterValidator(r.URL.Query(), h.validate)
	if err != nil {
		return err
	}

	opt := &hr.HttpRequest{
		Client: h.client,
		Method: http.MethodGet,
		Path: fmt.Sprintf(
			"https://online.mis.pens.ac.id/jadwal_kul.php?valTahun=%v&valSemester=%v",
			year,
			semester,
		),
	}

	handler := common.OnlineMisHandler[JadwalKuliahData]{
		Req:       opt,
		Extractor: h.extractor,
		Cache:     h.cache,
		CacheKey:  fmt.Sprintf("jadwal:%s:%s:%s", nrp.Value, year, semester),
	}

	if err := handler.RequestHandler(w, r); err != nil {
		return err
	}

	return nil
}
