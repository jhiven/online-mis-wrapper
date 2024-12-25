package login

import (
	"encoding/json"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/jhiven/online-mis-wrapper/internal/core/errs"
	hr "github.com/jhiven/online-mis-wrapper/internal/core/http_request"
)

type LoginHandler struct {
	controller *LoginController
	validate   *validator.Validate
}

func New(validate *validator.Validate) *LoginHandler {
	return &LoginHandler{
		controller: &LoginController{},
		validate:   validate,
	}
}

func (h *LoginHandler) Login(w http.ResponseWriter, r *http.Request) error {
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
	phpSessId, userCookie, err := h.controller.LoginCas(payload)
	if err != nil {
		return errs.NewHTTPError(
			http.StatusInternalServerError,
			"Failed to get sessionId from Cas",
			err,
		)
	}

	http.SetCookie(w, phpSessId)
	http.SetCookie(w, userCookie)
	w.WriteHeader(http.StatusOK)

	return nil
}
