package auth

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/jhiven/online-mis-wrapper/internal/core/errs"
	"github.com/jhiven/online-mis-wrapper/internal/core/helper"
	hr "github.com/jhiven/online-mis-wrapper/internal/core/http_request"
	"github.com/jhiven/online-mis-wrapper/internal/resources/common"
	"github.com/redis/go-redis/v9"
)

type AuthHandler struct {
	controller *AuthController
	validate   *validator.Validate
	cache      *redis.Client
}

func New(validate *validator.Validate, cache *redis.Client) *AuthHandler {
	return &AuthHandler{
		controller: &AuthController{},
		validate:   validate,
		cache:      cache,
	}
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) error {
	nrp, _ := r.Cookie("nrp")
	slog.Info("Logging out user", "NRP", nrp.Value)

	iter := h.cache.Scan(r.Context(), 0, fmt.Sprintf("*%v*", nrp.Value), 0).Iterator()
	if iter.Err() != nil {
		slog.Warn("Failed to delete cache user after logout", "NRP", nrp)
	}

	for iter.Next(r.Context()) {
		if err := h.cache.Del(r.Context(), iter.Val()).Err(); err != nil {
			slog.Warn("User session deleted")
		}
	}

	http.SetCookie(w, &http.Cookie{
		Name:   "PHPSESSID",
		Value:  "",
		MaxAge: -1,
	})
	http.SetCookie(w, &http.Cookie{
		Name:   "nrp",
		Value:  "",
		MaxAge: -1,
	})

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(common.ApiResponse{
		Status: http.StatusOK,
		Data:   "Logout success",
	})

	return nil

}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) error {
	var payload LoginPayload
	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		return errs.NewHTTPError(http.StatusBadRequest, "Invalid JSON", err)
	}

	err = h.validate.Struct(payload)
	if err != nil {
		errors := err.(validator.ValidationErrors)
		return errs.NewHTTPError(http.StatusBadRequest, "Validation error", errors)
	}

	client, err := hr.NewClientWithJar()
	if err != nil {
		return errs.NewHTTPError(
			http.StatusInternalServerError,
			"Failed to create http client",
			err,
		)
	}
	h.controller.client = client
	data, err := h.controller.LoginCas(payload)
	if err != nil {
		return err

	}

	exp, err := helper.MidnightDuration()
	if err != nil {
		return errs.NewHTTPError(
			http.StatusInternalServerError,
			"Failed to load location",
			err,
		)
	}

	if err := h.cache.Set(r.Context(), fmt.Sprintf("session:%s", data.NRP), true, exp).Err(); err != nil {
		slog.Warn("Failed to set user session to redis", "Warning", err)
	}

	slog.Info("Logging in user", "NRP", data.NRP)

	http.SetCookie(w, data.PHPSESSID)
	http.SetCookie(w, data.UserCookie)
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(common.ApiResponse{
		Status: http.StatusOK,
		Data:   data,
	})

	return nil
}
