package common

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/jhiven/online-mis-wrapper/internal/core/errs"
	"github.com/jhiven/online-mis-wrapper/internal/core/helper"
	hr "github.com/jhiven/online-mis-wrapper/internal/core/http_request"
	"github.com/jhiven/online-mis-wrapper/internal/services/cache"
	"github.com/redis/go-redis/v9"
)

type OnlineMisHandler[T any] struct {
	Req       *hr.HttpRequest
	Extractor OnlineMisExtractor[T]
	Cache     *redis.Client
	CacheKey  string
}

func (h *OnlineMisHandler[T]) RequestHandler(w http.ResponseWriter, r *http.Request) error {
	phpSessionId, _ := r.Cookie("PHPSESSID")
	nrp, _ := r.Cookie("nrp")

	data, err := cache.Get[T](
		h.Cache,
		r.Context(),
		h.CacheKey,
	)

	if err != nil {
		switch err {
		case redis.Nil:
			h.Req.Header = http.Header{
				"Cookie": []string{fmt.Sprintf("PHPSESSID=%v", phpSessionId.Value)},
			}

			res, err := h.Req.Request()
			if err != nil {
				return errs.NewHTTPError(
					http.StatusInternalServerError,
					"Failed to get response from Online.Mis PENS",
					err,
				)
			}
			defer res.Body.Close()

			data, err = h.Extractor.Extract(res.Body)
			if err != nil {
				if httpErr, _ := err.(errs.HTTPError); httpErr.Status == http.StatusUnauthorized {
					err := h.Cache.Del(r.Context(), fmt.Sprintf("*%s*", nrp.Value)).Err()
					if err != nil {
						slog.Warn("Failed to delete data from redis", "Warning", err)
					}
				}
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

			if err := cache.Set(h.Cache, r.Context(), h.CacheKey, data, exp); err != nil {
				slog.Warn("Failed to set data to redis", "Warning", err)
			}
		default:
			return errs.NewHTTPError(
				http.StatusInternalServerError,
				"Failed to get data from redis",
				err,
			)
		}
	}

	var body []byte
	body, err = json.Marshal(ApiResponse{Status: http.StatusOK, Data: data})
	if err != nil {
		return errs.NewHTTPError(
			http.StatusInternalServerError,
			"Failed to marshal data",
			err,
		)
	}

	w.WriteHeader(http.StatusOK)
	w.Write(body)
	return nil
}
