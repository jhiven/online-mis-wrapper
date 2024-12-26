package frs

import (
	"fmt"
	"net/http"

	"github.com/go-playground/validator/v10"
	hr "github.com/jhiven/online-mis-wrapper/internal/core/http_request"
	v "github.com/jhiven/online-mis-wrapper/internal/core/validator"
	"github.com/jhiven/online-mis-wrapper/internal/resources/common"
	"github.com/redis/go-redis/v9"
)

type FRSHandler struct {
	extractor *FRSExtractor
	validate  *validator.Validate
	client    *http.Client
	cache     *redis.Client
}

func New(validate *validator.Validate, client *http.Client, cache *redis.Client) *FRSHandler {
	return &FRSHandler{
		extractor: &FRSExtractor{},
		validate:  validate,
		client:    client,
		cache:     cache,
	}
}

func (h *FRSHandler) GetFrsOnlineMbkm(w http.ResponseWriter, r *http.Request) error {
	// f, err := os.Open("internal/resources/academic/frs/frs.html")
	// if err != nil {
	// 	fmt.Println("Failed to open file")
	// 	return err
	// }
	// defer func() {
	// 	if err := f.Close(); err != nil {
	// 		fmt.Println("Failed to close file")
	// 		panic(err)
	// 	}
	// }()

	// data, err := h.extractor.Extract(bufio.NewReader(f))
	// if err != nil {
	// 	fmt.Println("Failed to extract file")
	// 	return err
	// }

	// w.WriteHeader(http.StatusOK)
	// json.NewEncoder(w).Encode(data)

	nrp, _ := r.Cookie("nrp")
	year, semester, err := v.YearSemesterValidator(r.URL.Query(), h.validate)
	if err != nil {
		return err
	}

	opt := &hr.HttpRequest{
		Client: h.client,
		Method: http.MethodGet,
		Path: fmt.Sprintf(
			"https://online.mis.pens.ac.id/FRS_mbkm.php?valTahun=%v&valSemester=%v",
			year,
			semester,
		),
	}

	handler := common.OnlineMisHandler[FRSData]{
		Req:       opt,
		Extractor: h.extractor,
		Cache:     h.cache,
		CacheKey:  fmt.Sprintf("frs:%s:%s:%s", nrp.Value, year, semester),
	}

	if err := handler.RequestHandler(w, r); err != nil {
		return err
	}

	return nil
}
