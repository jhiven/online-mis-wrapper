use aide::axum::{routing::get_with, ApiRouter};
use axum::extract::State;

use crate::{
    core::{
        api_response::{ApiResponse, ApiResponseTrait, SuccessApiResponse},
        generate_openapi_response::generate_response,
        result::Result,
    },
    http::AppContext,
};

pub fn endpoint() -> ApiRouter<AppContext> {
    ApiRouter::new().api_route(
        "/check-ip",
        get_with(handler, generate_response(handler, "Debug", false)),
    )
}

#[axum::debug_handler]
async fn handler(State(state): State<AppContext>) -> Result<SuccessApiResponse<String>> {
    let res = state
        .client
        .get("https://icanhazip.com")
        .send()
        .await?
        .text()
        .await?
        .trim()
        .to_owned();

    Ok(ApiResponse::new(res))
}
