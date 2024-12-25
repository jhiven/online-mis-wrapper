package router

import (
	"net/http"

	hr "github.com/jhiven/online-mis-wrapper/internal/core/http_request"
	"github.com/jhiven/online-mis-wrapper/internal/core/validator"
	"github.com/jhiven/online-mis-wrapper/internal/resources/academic/absen"
	"github.com/jhiven/online-mis-wrapper/internal/resources/academic/frs"
	jadwalkuliah "github.com/jhiven/online-mis-wrapper/internal/resources/academic/jadwal_kuliah"
	nilaisemester "github.com/jhiven/online-mis-wrapper/internal/resources/academic/nilai_semester"
	"github.com/jhiven/online-mis-wrapper/internal/resources/login"
	"github.com/jhiven/online-mis-wrapper/internal/router/middleware"
)

func New(mux *http.ServeMux) {
	validate := validator.New()
	client := hr.NewClient()

	LoginHandler := login.New(validate)

	mux.Handle("POST /login", middleware.NewGuestMiddleware(LoginHandler.Login))

	absenHandler := absen.New(validate, client)
	frsHandler := frs.New(validate, client)
	jadwalKuliahHandler := jadwalkuliah.New(validate, client)
	nilaiSemeserHandler := nilaisemester.New(validate, client)

	mux.Handle("GET /academic/absen", middleware.NewUserMiddleware(absenHandler.GetAbsen))
	mux.Handle("GET /academic/frs", middleware.NewUserMiddleware(frsHandler.GetFrsOnlineMbkm))
	mux.Handle("GET /academic/nilai", middleware.NewUserMiddleware(nilaiSemeserHandler.GetNilai))
	mux.Handle("GET /academic/jadwal", middleware.NewUserMiddleware(jadwalKuliahHandler.GetJadwal))
}
