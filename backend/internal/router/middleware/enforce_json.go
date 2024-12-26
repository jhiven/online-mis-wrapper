package middleware

import "net/http"

const (
	headerKeyContentType       = "Content-Type"
	headerValueContentTypeJSON = "application/json; charset=utf8"
)

func (m *AppMiddleware) enforceJson(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set(headerKeyContentType, headerValueContentTypeJSON)
		next.ServeHTTP(w, r)
	})
}
