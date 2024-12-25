package middleware

import (
	"context"
	"net/http"

	"github.com/PuerkitoBio/goquery"
	"github.com/jhiven/online-mis-wrapper/internal/core/errs"
	"github.com/jhiven/online-mis-wrapper/internal/core/helper"
)

func userMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var httpError *errs.HTTPError

		phpSessionId, err := r.Cookie("PHPSESSID")
		if err != nil {
			httpError = errs.NewHTTPError(http.StatusUnauthorized, "Unauthorized", nil)
		}

		if phpSessionId.Value == "" {
			httpError = errs.NewHTTPError(http.StatusUnauthorized, "Unauthorized", nil)
		}

		client := &http.Client{}
		req, err := http.NewRequest(
			http.MethodGet,
			"https://online.mis.pens.ac.id/nilai_sem.php",
			nil,
		)
		if err != nil {
			httpError = errs.NewHTTPError(
				http.StatusInternalServerError,
				"Failed to create request for cookie verification",
				err,
			)
		}
		req.AddCookie(&http.Cookie{Name: "PHPSESSID", Value: phpSessionId.Value})

		res, err := client.Do(req)
		if err != nil {
			httpError = errs.NewHTTPError(
				http.StatusInternalServerError,
				"Failed to verify cookie",
				err,
			)
		}
		defer res.Body.Close()

		doc, err := goquery.NewDocumentFromReader(res.Body)
		if err != nil {
			httpError = errs.NewHTTPError(
				http.StatusInternalServerError,
				"Failed to read document for cookie verification",
				err,
			)
		}

		sessionValid := doc.Find("option[value='ociexecute(): ORA-00936: missing expression']").
			Length() == 0

		if !sessionValid {
			httpError = errs.NewHTTPError(http.StatusUnauthorized, "Unauthorized", nil)
		}

		if httpError != nil {
			helper.JSONError(w, httpError)
			return
		}

		ctx := context.WithValue(r.Context(), "PHPSESSID", phpSessionId)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
