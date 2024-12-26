package middleware

import "net/http"

func (m *AppMiddleware) enforceJson(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Content-Type", "application/json; charset=utf8")
		next.ServeHTTP(w, r)
	})
}
