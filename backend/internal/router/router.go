package router

import (
	"net/http"

	hr "github.com/jhiven/online-mis-wrapper/internal/core/http_request"
	"github.com/jhiven/online-mis-wrapper/internal/core/validator"
	"github.com/jhiven/online-mis-wrapper/internal/resources/academic/absen"
	"github.com/jhiven/online-mis-wrapper/internal/resources/academic/frs"
	jadwalkuliah "github.com/jhiven/online-mis-wrapper/internal/resources/academic/jadwal_kuliah"
	nilaisemester "github.com/jhiven/online-mis-wrapper/internal/resources/academic/nilai_semester"
	"github.com/jhiven/online-mis-wrapper/internal/resources/auth"
	"github.com/jhiven/online-mis-wrapper/internal/router/middleware"
	"github.com/jhiven/online-mis-wrapper/internal/services/cache"
)

func New(mux *http.ServeMux) {
	validate := validator.New()
	httpClient := hr.NewClient()
	redisClient := cache.New()
	m := middleware.New(validate, redisClient)

	authHandler := auth.New(validate, redisClient)

	mux.Handle("POST /api/v1/login", m.GuestMiddleware(authHandler.Login))
	mux.Handle("POST /api/v1/logout", m.UserMiddleware(authHandler.Logout))

	absenHandler := absen.New(validate, httpClient, redisClient)
	frsHandler := frs.New(validate, httpClient, redisClient)
	jadwalKuliahHandler := jadwalkuliah.New(validate, httpClient, redisClient)
	nilaiSemeserHandler := nilaisemester.New(validate, httpClient, redisClient)

	mux.Handle("GET /api/v1/academic/absen", m.UserMiddleware(absenHandler.GetAbsen))
	mux.Handle("GET /api/v1/academic/frs", m.UserMiddleware(frsHandler.GetFrsOnlineMbkm))
	mux.Handle("GET /api/v1/academic/nilai", m.UserMiddleware(nilaiSemeserHandler.GetNilai))
	mux.Handle("GET /api/v1/academic/jadwal", m.UserMiddleware(jadwalKuliahHandler.GetJadwal))
}
