use super::api_response::ApiResponse;
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};

#[derive(thiserror::Error, Debug)]
pub enum Error {
    #[error("{}", _0)]
    Unauthorized(String),

    #[error("User may not perform that action")]
    Forbidden,

    #[error("Request path not found")]
    NotFound,

    #[error("Anyhow error: {}", _0)]
    Anyhow(#[from] anyhow::Error),

    #[error("Reqwest error: {}", _0)]
    Reqwest(#[from] reqwest::Error),

    #[error("Redis error")]
    Redis(#[from] redis::RedisError),

    #[error("Error validating request")]
    Validation(#[from] validator::ValidationErrors),

    #[error("Invalid form request")]
    AxumFormRejection(#[from] axum::extract::rejection::FormRejection),

    #[error("Invalid json request")]
    AxumJsonRejection(#[from] axum::extract::rejection::JsonRejection),

    #[error("Invalid query params request")]
    AxumQueryRejection(#[from] axum::extract::rejection::QueryRejection),
}

impl Error {
    pub fn status_code(&self) -> StatusCode {
        match self {
            Self::Unauthorized(_) => StatusCode::UNAUTHORIZED,
            Self::Forbidden => StatusCode::FORBIDDEN,
            Self::NotFound => StatusCode::NOT_FOUND,
            Self::Anyhow(_) | Self::Reqwest(_) | Self::Redis(_) => {
                StatusCode::INTERNAL_SERVER_ERROR
            }
            Self::AxumFormRejection(_)
            | Self::AxumJsonRejection(_)
            | Self::AxumQueryRejection(_)
            | Self::Validation(_) => StatusCode::BAD_REQUEST,
        }
    }
}

impl IntoResponse for Error {
    fn into_response(self) -> Response {
        let status_code = self.status_code();

        if status_code >= StatusCode::INTERNAL_SERVER_ERROR {
            tracing::error!(
                "[{}] {}",
                status_code.canonical_reason().unwrap_or_default(),
                self
            );
        }

        let body: ApiResponse<()> = ApiResponse::from(self);

        (status_code, Json(body)).into_response()
    }
}
