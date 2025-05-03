use aide::OperationIo;
use axum::{
    http::{HeaderName, StatusCode},
    response::{AppendHeaders, IntoResponse, Response},
    Json,
};
use schemars::JsonSchema;
use serde::Serialize;

use super::error::Error;

#[derive(Debug, Serialize, OperationIo, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct ValidationErrorCause {
    pub field: String,
    pub message: String,
    pub received_value: String,
}

#[derive(Debug, Serialize, OperationIo, JsonSchema)]
pub struct SuccessApiResponseBody<T>
where
    T: Serialize,
{
    pub success: bool,
    pub data: T,
}

#[derive(Debug, Serialize, OperationIo, JsonSchema)]
pub struct ErrorApiResponseBody {
    pub success: bool,
    pub message: String,
}

#[derive(Debug, Serialize, OperationIo, JsonSchema)]
pub struct ErrorValidationApiResponseBody {
    pub success: bool,
    pub message: String,
    pub cause: Vec<ValidationErrorCause>,
}

#[derive(Debug, Serialize, OperationIo, JsonSchema)]
pub struct ApiResponse<T>
where
    T: Serialize + Serialize + JsonSchema,
{
    pub body: T,

    #[serde(skip_serializing, skip_deserializing)]
    pub code: StatusCode,
    #[serde(skip_serializing, skip_deserializing)]
    pub headers: Option<AppendHeaders<Vec<(HeaderName, String)>>>,
}

pub type SuccessApiResponse<T> = ApiResponse<SuccessApiResponseBody<T>>;
pub type ErrorApiResponse = ApiResponse<ErrorApiResponseBody>;
pub type ErrorValidationApiResponse = ApiResponse<ErrorValidationApiResponseBody>;

pub trait ApiResponseTrait<T>
where
    T: Serialize,
{
    type Body;

    fn new(data: T) -> Self;
    fn with_headers(self, headers: AppendHeaders<Vec<(HeaderName, String)>>) -> Self;
}

impl<T> Default for SuccessApiResponseBody<T>
where
    T: Default + Serialize + JsonSchema,
{
    fn default() -> Self {
        Self {
            success: true,
            data: T::default(),
        }
    }
}

impl<T> ApiResponseTrait<T> for SuccessApiResponse<T>
where
    T: Serialize + Serialize + JsonSchema,
{
    type Body = SuccessApiResponseBody<T>;

    fn new(data: T) -> Self {
        Self {
            body: SuccessApiResponseBody {
                success: true,
                data,
            },
            code: StatusCode::OK,
            headers: None,
        }
    }

    fn with_headers(self, headers: AppendHeaders<Vec<(HeaderName, String)>>) -> Self {
        Self {
            headers: Some(headers),
            ..self
        }
    }
}

impl<T> IntoResponse for ApiResponse<T>
where
    T: Serialize + Serialize + JsonSchema,
{
    fn into_response(self) -> Response {
        match self.headers {
            Some(headers) => (self.code, headers, Json(self.body)).into_response(),
            None => (self.code, Json(self.body)).into_response(),
        }
    }
}

impl From<Error> for ErrorApiResponse {
    fn from(value: Error) -> Self {
        let code = value.status_code();
        let msg = value.to_string();

        Self {
            body: ErrorApiResponseBody {
                success: false,
                message: msg,
            },
            code,
            headers: None,
        }
    }
}

impl From<Error> for ErrorValidationApiResponse {
    fn from(value: Error) -> Self {
        let code = value.status_code();
        let msg = value.to_string();

        match value {
            Error::Validation(e) => Self {
                body: ErrorValidationApiResponseBody {
                    success: false,
                    message: msg,
                    cause: e,
                },
                code,
                headers: None,
            },
            // It should be impossible to reach this point
            _ => Self {
                body: ErrorValidationApiResponseBody {
                    success: false,
                    message: msg,
                    cause: vec![],
                },
                code,
                headers: None,
            },
        }
    }
}
