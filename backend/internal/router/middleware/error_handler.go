package middleware

import (
	"net/http"

	"github.com/jhiven/online-mis-wrapper/internal/core/helper"
)

type rootHandler func(http.ResponseWriter, *http.Request) error

func (fn rootHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	err := fn(w, r)
	if err == nil {
		return
	}

	helper.JSONError(w, err)
}
