use serde::Serialize;
use serde_json::json;

use crate::http::{success::SuccessResponse, Error};

#[derive(Debug, serde::Serialize)]
pub struct ApiResponse<T>
where
    T: Serialize,
{
    pub status: u16,
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<serde_json::Value>,
}

impl<T> From<SuccessResponse<T>> for ApiResponse<T>
where
    T: Serialize,
{
    fn from(value: SuccessResponse<T>) -> Self {
        Self {
            status: value.status.as_u16(),
            success: value.status.is_success(),
            data: Some(value.data),
            error: None,
        }
    }
}

impl<T> From<Error> for ApiResponse<T>
where
    T: Serialize,
{
    fn from(value: Error) -> Self {
        let status_code = value.status_code();
        let msg = match value {
            Error::Validation(e) => json!(e
                .field_errors()
                .into_iter()
                .map(|(k, v)| json!({k.to_string():  v.iter().map(|err| err.message.clone()).collect::<Vec<_>>()}))
                .collect::<Vec<_>>()),
            _ => json!(value.to_string()),
        };

        Self {
            status: status_code.as_u16(),
            success: status_code.is_success(),
            data: None,
            error: Some(msg),
        }
    }
}
