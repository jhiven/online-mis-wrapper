package helper

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/jhiven/online-mis-wrapper/internal/core/errs"
	hr "github.com/jhiven/online-mis-wrapper/internal/core/http_request"
)

type OnlineMisHandler[T any] struct {
	Req       *hr.HttpRequest
	Extractor OnlineMisExtractor[T]
}

func (h *OnlineMisHandler[T]) RequestHandler(w http.ResponseWriter, r *http.Request) error {
	phpSessionId, success := r.Context().Value("PHPSESSID").(*http.Cookie)
	if !success {
		return errs.NewHTTPError(
			http.StatusInternalServerError,
			"Failed to get PHPSESSID from context",
			nil,
		)
	}
	h.Req.Header = http.Header{"Cookie": []string{fmt.Sprintf("PHPSESSID=%v", phpSessionId.Value)}}

	res, err := h.Req.Request()
	if err != nil {
		return errs.NewHTTPError(
			http.StatusInternalServerError,
			"Failed to get response from Online.Mis PENS",
			err,
		)
	}
	defer res.Body.Close()

	data, err := h.Extractor.Extract(res.Body)
	if err != nil {
		return errs.NewHTTPError(
			http.StatusInternalServerError,
			"Failed to extract data from response",
			err,
		)
	}

	var body []byte
	body, err = json.Marshal(ApiResponse{Status: http.StatusOK, Data: data})
	if err != nil {
		return errs.NewHTTPError(
			http.StatusInternalServerError,
			"Failed to marshal data",
			err,
		)
	}

	w.WriteHeader(http.StatusOK)
	w.Write(body)
	return nil
}
