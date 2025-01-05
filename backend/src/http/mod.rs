use crate::config::AppConfig;
use anyhow::{anyhow, Context};
use axum::{extract::State, routing::get, Json, Router};
use bb8_redis::RedisConnectionManager;
use error::Error;
use redis::AsyncCommands;
use std::{
    net::{Ipv4Addr, SocketAddr},
    str::FromStr,
    time::Duration,
};
use tokio::net::TcpListener;
use tower_http::{
    catch_panic::CatchPanicLayer, compression::CompressionLayer,
    set_header::SetResponseHeaderLayer, timeout::TimeoutLayer, trace::TraceLayer,
};

mod academic;
mod api_response;
mod auth;
mod error;
mod handler;
mod helper;
mod middleware;
mod success;
mod validator;

pub type Result<T, E = Error> = std::result::Result<T, E>;

#[derive(Clone)]
pub struct AppContext {
    client: reqwest::Client,
    redis_pool: bb8::Pool<RedisConnectionManager>,
}

pub async fn serve(cfg: AppConfig) -> anyhow::Result<()> {
    let redis_pool = connect_redis(cfg.redis_address, cfg.redis_password, cfg.redis_user).await?;

    let api_context = AppContext {
        client: match cfg.proxy_url {
            Some(url) => {
                tracing::info!("Using proxy: '{url}'");
                reqwest::Client::builder()
                    .proxy(reqwest::Proxy::all(url)?)
                    .build()?
            }
            None => {
                tracing::info!("Not using proxy");
                reqwest::Client::new()
            }
        },
        redis_pool,
    };

    let app = api_router(api_context);

    let addr = match cfg.server_address {
        Some(addr) => Ipv4Addr::from_str(addr.as_str())?,
        None => Ipv4Addr::UNSPECIFIED,
    };
    tracing::debug!("server address {}", addr);

    let addr = SocketAddr::from((addr, cfg.server_port.unwrap_or_else(|| 8080)));

    let listener = TcpListener::bind(addr).await?;
    tracing::info!("listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, app)
        .await
        .context("Error running HTTP server")
}

async fn connect_redis(
    redis_address: String,
    redis_password: String,
    redis_user: String,
) -> Result<bb8::Pool<RedisConnectionManager>> {
    tracing::debug!("connecting to redis");

    let redis_url = format!("redis://{redis_user}:{redis_password}@{redis_address}");
    let manager = RedisConnectionManager::new(redis_url).map_err(|e| anyhow!(e.to_string()))?;
    let pool = bb8::Pool::builder()
        .build(manager)
        .await
        .map_err(|e| anyhow!(e.to_string()))?;

    {
        tracing::debug!("pinging redis");
        let mut conn = pool.get().await.map_err(|e| anyhow!(e.to_string()))?;
        conn.set::<&str, &str, ()>("foo", "bar")
            .await
            .map_err(|e| anyhow!(e.to_string()))?;
        let result: String = conn.get("foo").await.map_err(|e| anyhow!(e.to_string()))?;
        assert_eq!(result, "bar");
        conn.del::<&str, ()>("foo")
            .await
            .map_err(|e| anyhow!(e.to_string()))?;
    }

    tracing::debug!("successfully connected to redis and pinged it");
    return Ok(pool);
}

#[axum::debug_handler]
async fn check_ip_handler(State(state): State<AppContext>) -> Result<Json<String>> {
    let res = state
        .client
        .get("https://icanhazip.com")
        .send()
        .await?
        .text()
        .await?
        .trim()
        .to_owned();

    Ok(Json(res))
}

fn api_router(ctx: AppContext) -> Router {
    Router::new()
        .route("/check-ip", get(check_ip_handler))
        .nest(
            "/api/v1",
            Router::new()
                .merge(auth::router())
                .merge(academic::router()),
        )
        // Enables logging. Use `RUST_LOG=tower_http=debug`
        .layer((
            SetResponseHeaderLayer::overriding(
                axum::http::header::CONTENT_TYPE,
                axum::http::HeaderValue::from_static("application/json"),
            ),
            CompressionLayer::new(),
            TraceLayer::new_for_http(),
            TimeoutLayer::new(Duration::from_secs(60)),
            CatchPanicLayer::new(),
        ))
        .with_state(ctx)
}
