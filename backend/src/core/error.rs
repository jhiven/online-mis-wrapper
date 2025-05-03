use crate::core::api_response::{ErrorApiResponse, ErrorValidationApiResponse};

use super::api_response::{ApiResponse, ValidationErrorCause};
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
};

#[derive(thiserror::Error, Debug, aide::OperationIo)]
pub enum Error {
    #[error("{}", _0)]
    Unauthorized(String),

    #[error("User may not perform that action")]
    Forbidden,

    #[error("{}", _0)]
    BadRequest(String),

    #[error("Request path not found")]
    NotFound,

    #[error("Anyhow error: {}", _0)]
    Anyhow(#[from] anyhow::Error),

    #[error("Reqwest error: {}", _0)]
    Reqwest(#[from] reqwest::Error),

    #[error("Redis error")]
    Redis(#[from] redis::RedisError),

    #[error("Validation Error")]
    Validation(Vec<ValidationErrorCause>),

    #[error("Invalid form request")]
    AxumFormRejection(#[from] axum::extract::rejection::FormRejection),

    #[error("Invalid json request")]
    AxumJsonRejection(#[from] axum::extract::rejection::JsonRejection),

    #[error("Invalid query params request")]
    AxumQueryRejection(#[from] axum::extract::rejection::QueryRejection),

    #[error("Invalid query params request")]
    AxumPathRejection(#[from] axum::extract::rejection::PathRejection),
}

impl Error {
    pub fn status_code(&self) -> StatusCode {
        match self {
            Self::Unauthorized(_) => StatusCode::UNAUTHORIZED,
            Self::BadRequest(_) => StatusCode::BAD_GATEWAY,
            Self::Forbidden => StatusCode::FORBIDDEN,
            Self::NotFound => StatusCode::NOT_FOUND,
            Self::Anyhow(_) | Self::Reqwest(_) | Self::Redis(_) => {
                StatusCode::INTERNAL_SERVER_ERROR
            }
            Self::AxumFormRejection(_)
            | Self::AxumJsonRejection(_)
            | Self::AxumPathRejection(_)
            | Self::Validation(_)
            | Self::AxumQueryRejection(_) => StatusCode::BAD_REQUEST,
        }
    }
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        tracing::error!("{:?}", self);
        match self {
            Self::Validation(_) => {
                let body: ErrorValidationApiResponse = ApiResponse::from(self);
                body.into_response()
            }
            _ => {
                let body: ErrorApiResponse = ApiResponse::from(self);
                body.into_response()
            }
        }
    }
}
