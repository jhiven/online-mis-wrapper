package main

import (
	"context"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"

	"github.com/jhiven/online-mis-wrapper/internal/router"
	"github.com/joho/godotenv"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	mux := http.NewServeMux()

	server := &http.Server{
		Addr:    ":8080",
		Handler: mux,
	}

	router.New(mux)

	closed := make(chan struct{})
	go func() {
		sigint := make(chan os.Signal, 1)
		signal.Notify(sigint, os.Interrupt)
		<-sigint

		fmt.Println("")
		slog.Info("Server status", "info", fmt.Sprintf("Shutting down server %v", server.Addr))

		ctx, cancel := context.WithTimeout(context.Background(), 15)
		defer cancel()

		if err := server.Shutdown(ctx); err != nil {
			log.Println("Server shutdown failure")
		}

		close(closed)
	}()

	slog.Info("Server status", "info", fmt.Sprintf("Server started at %v", server.Addr))

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}

	<-closed
}
