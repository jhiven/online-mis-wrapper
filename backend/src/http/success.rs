use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

use crate::http::api_response::ApiResponse;

pub struct SuccessResponse<T>
where
    T: Serialize,
{
    pub status: StatusCode,
    pub data: T,
}

impl<T> IntoResponse for SuccessResponse<T>
where
    T: Serialize,
{
    fn into_response(self) -> Response {
        (self.status, Json(ApiResponse::from(self))).into_response()
    }
}
