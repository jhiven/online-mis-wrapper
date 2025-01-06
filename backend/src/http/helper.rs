pub mod http_helper {
    use crate::http::Result;
    use reqwest::Client;

    #[derive(Debug, serde::Deserialize, validator::Validate)]
    pub struct YearSemesterRequest {
        #[validate(required(message = "Email is required"))]
        pub year: Option<u16>,
        #[validate(required(message = "Semester is required"))]
        pub semester: Option<u8>,
    }

    pub async fn http_request(client: &Client, url: String, session_id: &str) -> Result<String> {
        Ok(client
            .get(url)
            .header("Cookie", format!("PHPSESSID={};", session_id))
            .send()
            .await?
            .text()
            .await?)
    }
}

pub mod cache_helper {
    use anyhow::anyhow;
    use bb8::{Pool, PooledConnection};
    use bb8_redis::RedisConnectionManager;
    use redis::{aio::ConnectionLike, ToRedisArgs};
    use std::time::SystemTime;

    use crate::http::Result;

    pub async fn cache_set<K, V>(key: K, value: V, conn: &mut impl ConnectionLike) -> Result<()>
    where
        K: ToRedisArgs,
        V: ToRedisArgs,
    {
        let midnight = {
            let now = SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)
                .unwrap()
                .as_secs();

            now - (now % (24 * 60 * 60)) + (17 * 60 * 60)
        };

        Ok(redis::cmd("SET")
            .arg(key)
            .arg(value)
            .arg("EXAT")
            .arg(midnight)
            .query_async(conn)
            .await?)
    }

    pub async fn get_conn(
        pool: &Pool<RedisConnectionManager>,
    ) -> Result<PooledConnection<'_, RedisConnectionManager>> {
        Ok(pool.get().await.map_err(|e| anyhow!(e.to_string()))?)
    }
}
