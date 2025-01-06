use crate::http::Result;
use anyhow::anyhow;
use redis::{AsyncCommands, RedisError, ToRedisArgs};
use serde::{de::DeserializeOwned, Serialize};

use super::{error::Error, helper};

pub struct RedisHandler<'a, K>
where
    K: ToRedisArgs + Clone + Send + Sync,
{
    pub redis_pool: bb8::PooledConnection<'a, bb8_redis::RedisConnectionManager>,
    pub key: K,
}

impl<K> RedisHandler<'_, K>
where
    K: ToRedisArgs + Clone + Send + Sync,
{
    pub async fn get_value(&mut self) -> Result<redis::Value> {
        let redis_val = self
            .redis_pool
            .get::<K, redis::Value>(self.key.clone())
            .await
            .unwrap_or_else(|_| redis::Value::Nil);

        Ok(redis_val)
    }

    pub async fn set_value<V>(&mut self, value: V) -> Result<()>
    where
        V: Serialize,
    {
        let v = serde_json::to_string(&value).map_err(|_| anyhow!("Error serializing absen"))?;
        Ok(helper::cache_helper::cache_set(self.key.clone(), v, &mut *self.redis_pool).await?)
    }
}

pub struct HttpHandler<'a> {
    pub url: String,
    pub session_id: &'a str,
    pub client: &'a reqwest::Client,
}

pub async fn online_mis_handler<T, F, K>(
    mut redis_handler: RedisHandler<'_, K>,
    http_handler: HttpHandler<'_>,
    html_extractor: F,
) -> Result<T>
where
    T: Serialize + DeserializeOwned,
    F: FnOnce(String) -> Result<T>,
    K: ToRedisArgs + Clone + Send + Sync,
{
    match redis_handler.get_value().await? {
        redis::Value::Nil => {
            let body = helper::http_helper::http_request(
                &http_handler.client,
                http_handler.url,
                http_handler.session_id,
            )
            .await?;

            let data = html_extractor(body)?;

            redis_handler.set_value(&data).await?;

            Ok(data)
        }
        redis::Value::ServerError(e) => {
            return Err(Error::Redis(RedisError::from(e)));
        }
        value => {
            let redis_str: String = redis::FromRedisValue::from_redis_value(&value)
                .map_err(|e| anyhow!(e.to_string()))?;
            Ok(serde_json::from_str::<T>(&redis_str)
                .map_err(|_| anyhow!("Deserialization error"))?)
        }
    }
}
