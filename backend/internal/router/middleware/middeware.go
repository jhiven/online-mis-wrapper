package middleware

import (
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/justinas/alice"
	"github.com/redis/go-redis/v9"
)

type AppMiddleware struct {
	validate *validator.Validate
	Cache    *redis.Client
}

func New(validate *validator.Validate, cache *redis.Client) *AppMiddleware {
	return &AppMiddleware{
		validate: validate,
		Cache:    cache,
	}
}

func (m *AppMiddleware) UserMiddleware(handler rootHandler) http.Handler {
	userHandler := alice.New(m.enforceJson, m.userMiddleware).Then(rootHandler(handler))

	return userHandler
}

func (m *AppMiddleware) GuestMiddleware(handler rootHandler) http.Handler {
	guestHandler := alice.New(m.enforceJson).Then(rootHandler(handler))

	return guestHandler
}
