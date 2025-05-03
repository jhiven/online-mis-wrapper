use aide::axum::{routing::post_with, ApiRouter};
use axum::extract::State;
use redis::AsyncCommands;

use crate::{
    core::{
        api_response::SuccessApiResponse, axum_extractor::ValidatedCookieJar,
        generate_openapi_response::generate_response, helper::cache_helper,
    },
    http::AppContext,
};

use crate::{core::api_response::ApiResponseTrait, http::Result};

use super::OPENAPI_TAG;

pub fn endpoint() -> ApiRouter<AppContext> {
    ApiRouter::new().api_route(
        "/invalidate-cache",
        post_with(handler, generate_response(handler, OPENAPI_TAG, false)),
    )
}

#[axum::debug_handler]
async fn handler(
    ValidatedCookieJar { nrp, .. }: ValidatedCookieJar,
    State(state): State<AppContext>,
) -> Result<SuccessApiResponse<String>> {
    let mut conn = cache_helper::get_conn(&state.redis_pool).await?;

    let keys = {
        let mut iter = conn
            .scan_match::<String, String>(format!("*{}*", nrp))
            .await?;

        let mut keys = Vec::new();
        while let Some(key) = iter.next_item().await {
            keys.push(key);
        }
        keys
    };

    for key in keys {
        let () = conn.del(key).await?;
    }

    Ok(SuccessApiResponse::new(
        "Cache invalidated successfully".to_owned(),
    ))
}
