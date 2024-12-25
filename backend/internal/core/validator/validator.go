package validator

import (
	"net/http"
	"net/url"

	"github.com/go-playground/validator/v10"
	"github.com/jhiven/online-mis-wrapper/internal/core/errs"
)

func New() *validator.Validate {
	return validator.New(validator.WithRequiredStructEnabled())
}

func YearSemesterValidator(
	u url.Values,
	v *validator.Validate,
) (year, semester string, err error) {
	year = u.Get("year")
	if err := v.Var(year, "required,numeric"); err != nil {
		errors := err.(validator.ValidationErrors)
		return "", "", errs.NewHTTPError(
			http.StatusBadRequest,
			"Validation error field year",
			errors,
		)
	}

	semester = u.Get("semester")
	if err := v.Var(semester, "required,numeric,oneof=1 2"); err != nil {
		errors := err.(validator.ValidationErrors)
		return "", "", errs.NewHTTPError(
			http.StatusBadRequest,
			"Validation error field semester",
			errors,
		)
	}

	return year, semester, nil
}
