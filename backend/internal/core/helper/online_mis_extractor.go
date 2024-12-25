package helper

import "io"

type OnlineMisExtractor[T any] interface {
	Extract(r io.Reader) (*T, error)
}
