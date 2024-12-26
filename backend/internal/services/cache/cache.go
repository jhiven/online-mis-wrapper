package cache

import (
	"context"
	"encoding/json"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

func New() *redis.Client {
	return redis.NewClient(&redis.Options{
		Addr:     os.Getenv("REDIS_ADDRESS"),
		Password: os.Getenv("REDIS_PASSWORD"),
		DB:       0,
	})
}

func Get[T any](client *redis.Client, ctx context.Context, key string) (*T, error) {
	res, err := client.Get(ctx, key).Result()
	if err != nil {
		return nil, err
	}

	var data T
	if err := json.Unmarshal([]byte(res), &data); err != nil {
		return nil, err
	}

	return &data, nil
}

func Set[T any](
	client *redis.Client,
	ctx context.Context,
	key string,
	val *T,
	exp time.Duration,
) error {
	data, err := json.Marshal(val)
	if err != nil {
		return err
	}

	if err := client.Set(ctx, key, data, exp).Err(); err != nil {
		return err
	}

	return nil
}
