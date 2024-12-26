package helper

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/jhiven/online-mis-wrapper/internal/core/errs"
)

func JSONError(w http.ResponseWriter, err error) {
	httpError, ok := err.(errs.HTTPError)
	if !ok {
		slog.Error("Unexpected error occured", "error", err)
		httpError = errs.NewHTTPError(http.StatusInternalServerError, "Unknown Error", err)
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.WriteHeader(httpError.Status)
	json.NewEncoder(w).Encode(httpError)
}
