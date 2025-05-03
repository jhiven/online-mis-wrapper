use crate::config::AppConfig;
use crate::core::result::Result;
use aide::{axum::ApiRouter, openapi::OpenApi};
use anyhow::{anyhow, Context};
use axum::{Extension, Router};
use bb8_redis::RedisConnectionManager;
use docs::{api_docs, docs_routes};
use redis::AsyncCommands;
use reqwest::Method;
use std::{
    net::{Ipv4Addr, SocketAddr},
    str::FromStr,
    sync::Arc,
    time::Duration,
};
use tokio::net::TcpListener;
use tower_http::{
    catch_panic::CatchPanicLayer, compression::CompressionLayer, cors::CorsLayer,
    set_header::SetResponseHeaderLayer, timeout::TimeoutLayer, trace::TraceLayer,
};

mod docs;
mod features;

#[derive(Clone)]
pub struct AppContext {
    client: reqwest::Client,
    redis_pool: bb8::Pool<RedisConnectionManager>,
    proxy_url: Option<String>,
}

pub async fn serve(cfg: AppConfig) -> anyhow::Result<()> {
    let redis_pool = connect_redis(cfg.redis_address, cfg.redis_password, cfg.redis_user).await?;

    let api_context = AppContext {
        client: match cfg.proxy_url.clone() {
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
        proxy_url: cfg.proxy_url,
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
    axum::serve(listener, app.into_make_service())
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

fn api_router(ctx: AppContext) -> Router {
    let mut api = OpenApi::default();

    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST, Method::DELETE])
        .allow_headers([
            axum::http::header::CONTENT_TYPE,
            axum::http::header::AUTHORIZATION,
            axum::http::header::ACCEPT,
        ])
        .allow_credentials(true)
        .allow_origin(
            "http://localhost:3000"
                .parse::<axum::http::HeaderValue>()
                .unwrap(),
        );

    ApiRouter::new()
        .nest_api_service("/api/v1", features::router().with_state(ctx))
        .nest_api_service("/docs", docs_routes())
        .finish_api_with(&mut api, api_docs)
        .layer(Extension(Arc::new(api)))
        .layer(cors)
        // Enables logging. Use `RUST_LOG=tower_http=debug`
        .layer((
            SetResponseHeaderLayer::if_not_present(
                axum::http::header::CONTENT_TYPE,
                axum::http::HeaderValue::from_static("application/json"),
            ),
            CompressionLayer::new(),
            TraceLayer::new_for_http(),
            TimeoutLayer::new(Duration::from_secs(60)),
            CatchPanicLayer::new(),
        ))
}
