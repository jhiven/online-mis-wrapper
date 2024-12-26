package middleware

import (
	"fmt"
	"net/http"

	"github.com/PuerkitoBio/goquery"
	"github.com/go-playground/validator/v10"
	"github.com/jhiven/online-mis-wrapper/internal/core/errs"
	"github.com/jhiven/online-mis-wrapper/internal/core/helper"
	"github.com/redis/go-redis/v9"
)

func (m *AppMiddleware) userMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		phpSessionId, user, err := validateCookies(r, m.validate)
		if err != nil {
			helper.JSONError(w, err)
			return
		}

		if err := m.Cache.Exists(r.Context(), fmt.Sprintf("session:%s", user)).Err(); err != nil {
			switch err {
			case redis.Nil:
				if err := checkSessionValid(phpSessionId); err != nil {
					helper.JSONError(w, err)
					return
				}

			default:
				helper.JSONError(w, errs.NewHTTPError(
					http.StatusInternalServerError,
					"Failed to get session from cache",
					err,
				))
			}
		}

		next.ServeHTTP(w, r)
	})
}

func validateCookies(r *http.Request, validate *validator.Validate) (string, string, error) {
	phpSessionId, err := r.Cookie("PHPSESSID")
	if err != nil {
		return "", "", errs.NewHTTPError(
			http.StatusUnauthorized,
			"Unauthorized",
			err,
		)
	}
	if err := validate.Var(phpSessionId, "required"); err != nil {
		return "", "", errs.NewHTTPError(
			http.StatusUnauthorized,
			"Unauthorized",
			err,
		)
	}

	user, err := r.Cookie("nrp")
	if err != nil {
		return "", "", errs.NewHTTPError(
			http.StatusUnauthorized,
			"Unauthorized",
			err,
		)
	}
	if err := validate.Var(user, "required,numeric"); err != nil {
		return "", "", errs.NewHTTPError(
			http.StatusUnauthorized,
			"Unauthorized",
			err,
		)
	}

	return phpSessionId.Value, user.Value, nil
}

func checkSessionValid(phpSessionId string) error {
	client := &http.Client{}
	req, err := http.NewRequest(
		http.MethodGet,
		"https://online.mis.pens.ac.id/nilai_sem.php",
		nil,
	)
	if err != nil {
		return errs.NewHTTPError(
			http.StatusInternalServerError,
			"Failed to create request for cookie verification",
			err,
		)
	}
	req.AddCookie(&http.Cookie{Name: "PHPSESSID", Value: phpSessionId})

	res, err := client.Do(req)
	if err != nil {
		return errs.NewHTTPError(
			http.StatusInternalServerError,
			"Failed to verify cookie",
			err,
		)
	}
	defer res.Body.Close()

	doc, err := goquery.NewDocumentFromReader(res.Body)
	if err != nil {
		return errs.NewHTTPError(
			http.StatusInternalServerError,
			"Failed to read document for cookie verification",
			err,
		)
	}

	sessionValid := doc.Find("option[value='ociexecute(): ORA-00936: missing expression']").
		Length() == 0

	if !sessionValid {
		return errs.NewHTTPError(http.StatusUnauthorized, "Unauthorized", nil)
	}

	return nil
}
