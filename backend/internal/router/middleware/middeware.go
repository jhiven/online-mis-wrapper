package middleware

import (
	"net/http"

	"github.com/justinas/alice"
)

func NewUserMiddleware(handler rootHandler) http.Handler {
	userHandler := alice.New(enforceJson, userMiddleware).Then(rootHandler(handler))

	return userHandler
}

func NewGuestMiddleware(handler rootHandler) http.Handler {
	guestHandler := alice.New(enforceJson).Then(rootHandler(handler))

	return guestHandler
}
