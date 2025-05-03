use super::{api_response::ValidationErrorCause, result::Result};
use aide::OperationIo;
use anyhow::anyhow;
use axum::{
    extract::{
        rejection::{FormRejection, JsonRejection},
        FromRequest, FromRequestParts, Query, Request,
    },
    http::request::Parts,
    Form, Json,
};
use axum_extra::extract::CookieJar;
use base64::Engine;
use jsonschema::{error::ValidationErrorKind, ValidationError};
use schemars::{schema_for, JsonSchema};
use scraper::{Html, Selector};
use serde::{de::DeserializeOwned, Deserialize, Serialize};

use super::error::Error;

#[derive(FromRequestParts, OperationIo)]
#[from_request(via(axum::extract::Path), rejection(Error))]
#[aide(
    input_with = "axum::extract::Path<T>",
    output_with = "axum::extract::Json<T>",
    json_schema
)]
pub struct ValidatedPath<T>(pub T);

#[derive(OperationIo)]
#[aide(
    input_with = "axum::extract::Form<T>",
    output_with = "axum::extract::Form<T>",
    json_schema
)]
pub struct ValidatedForm<T>(pub T)
where
    T: JsonSchema;

impl<T, S> FromRequest<S> for ValidatedForm<T>
where
    T: DeserializeOwned + JsonSchema + Serialize,
    S: Send + Sync,
    Form<T>: FromRequest<S, Rejection = FormRejection>,
{
    type Rejection = Error;

    async fn from_request(req: Request, state: &S) -> Result<Self> {
        let Form(value) = Form::<T>::from_request(req, state).await?;

        validate_schema(&value)?;

        Ok(Self(value))
    }
}

#[derive(OperationIo)]
#[aide(
    input_with = "axum::extract::Json<T>",
    output_with = "axum::extract::Json<T>",
    json_schema
)]
pub struct ValidatedJson<T>(pub T)
where
    T: JsonSchema + DeserializeOwned;

impl<T, S> FromRequest<S> for ValidatedJson<T>
where
    T: DeserializeOwned + JsonSchema + Serialize,
    S: Send + Sync,
    Json<T>: FromRequest<S, Rejection = JsonRejection>,
{
    type Rejection = Error;

    async fn from_request(req: Request, state: &S) -> Result<Self> {
        let Json(value) = Json::<T>::from_request(req, state).await?;

        validate_schema(&value)?;

        Ok(Self(value))
    }
}

#[derive(OperationIo)]
#[aide(
    input_with = "axum::extract::Query<T>",
    output_with = "axum::extract::Json<T>",
    json_schema
)]
pub struct ValidatedQuery<T>(pub T)
where
    T: JsonSchema;

impl<T, S> FromRequest<S> for ValidatedQuery<T>
where
    T: DeserializeOwned + JsonSchema + Serialize,
    S: Send + Sync,
{
    type Rejection = Error;

    async fn from_request(req: Request, state: &S) -> Result<Self> {
        let Query(value) = Query::<T>::from_request(req, state).await?;

        validate_schema(&value)?;

        Ok(Self(value))
    }
}

#[derive(OperationIo, Serialize, Deserialize)]
pub struct ValidatedCookieJar {
    pub session_id: String,
    pub nrp: String,
}

impl<S> FromRequestParts<S> for ValidatedCookieJar
where
    S: Send + Sync,
{
    type Rejection = Error;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self> {
        let jar = CookieJar::from_request_parts(parts, state)
            .await
            .map_err(|_| anyhow!("Failed to extract cookies"))?;

        let base64 = jar
            .get("SESSION_ID")
            .ok_or_else(|| Error::Unauthorized("Unauthorized".to_string()))?
            .value();

        if base64.is_empty() {
            return Err(Error::Unauthorized("Unauthorized".to_string()));
        }

        let decoded_base64 = base64::engine::general_purpose::STANDARD
            .decode(base64)
            .map_err(|e| anyhow!(e.to_string()))
            .and_then(|e| String::from_utf8(e).map_err(|e| anyhow!(e.to_string())))?;

        let cookie_value: ValidatedCookieJar =
            serde_json::from_str(&decoded_base64).map_err(|e| anyhow!(e.to_string()))?;

        Ok(cookie_value)
    }
}

fn validate_schema<T>(value: &T) -> Result<()>
where
    T: DeserializeOwned + JsonSchema + Serialize,
{
    let instance = &serde_json::to_value(value).map_err(|_| anyhow!("Error serializing value"))?;
    let schema = schema_for!(T);
    let validator = jsonschema::validator_for(
        &serde_json::to_value(&schema).map_err(|_| anyhow!("Error serializing schema"))?,
    )
    .map_err(|_| anyhow!("Error creating validator"))?;

    if !validator.is_valid(&instance) {
        let err = validator
            .iter_errors(&instance)
            .map(|e| ValidationErrorCause {
                field: e.instance_path.to_string(),
                message: validation_error_message(&e),
                received_value: e.instance.to_string(),
            })
            .collect::<Vec<ValidationErrorCause>>();

        return Err(Error::Validation(err));
    }

    Ok(())
}

fn validation_error_message(err: &ValidationError) -> String {
    match &err.kind {
        ValidationErrorKind::AdditionalItems { limit } => {
            format!("Too many items, max allowed: {}", limit)
        }
        ValidationErrorKind::AdditionalProperties { unexpected } => {
            format!("Unexpected properties: {:?}", unexpected)
        }
        ValidationErrorKind::AnyOf => "Value does not match any of the allowed schemas".to_string(),
        ValidationErrorKind::Constant { expected_value } => {
            format!("Value must be: {}", expected_value)
        }
        ValidationErrorKind::Contains => "Array must contain at least one valid item".to_string(),
        ValidationErrorKind::ContentEncoding { content_encoding } => {
            format!("Invalid content encoding: {}", content_encoding)
        }
        ValidationErrorKind::ContentMediaType { content_media_type } => {
            format!("Invalid content media type: {}", content_media_type)
        }
        ValidationErrorKind::Custom { message } => message.clone(),
        ValidationErrorKind::Enum { options } => format!("Value must be one of: {}", options),
        ValidationErrorKind::ExclusiveMaximum { limit } => {
            format!("Value must be less than {}", limit)
        }
        ValidationErrorKind::ExclusiveMinimum { limit } => {
            format!("Value must be greater than {}", limit)
        }
        ValidationErrorKind::FalseSchema => "Schema does not allow any value".to_string(),
        ValidationErrorKind::Format { format } => format!("Invalid format: {}", format),
        ValidationErrorKind::FromUtf8 { error } => format!("Invalid UTF-8 data: {}", error),
        ValidationErrorKind::MaxItems { limit } => {
            format!("Too many items, max allowed: {}", limit)
        }
        ValidationErrorKind::Maximum { limit } => format!("Value must be at most {}", limit),
        ValidationErrorKind::MaxLength { limit } => {
            format!("String is too long, max length: {}", limit)
        }
        ValidationErrorKind::MaxProperties { limit } => {
            format!("Too many properties, max allowed: {}", limit)
        }
        ValidationErrorKind::MinItems { limit } => {
            format!("Not enough items, min required: {}", limit)
        }
        ValidationErrorKind::Minimum { limit } => format!("Value must be at least {}", limit),
        ValidationErrorKind::MinLength { limit } => {
            format!("String is too short, min length: {}", limit)
        }
        ValidationErrorKind::MinProperties { limit } => {
            format!("Not enough properties, min required: {}", limit)
        }
        ValidationErrorKind::MultipleOf { multiple_of } => {
            format!("Value must be a multiple of {}", multiple_of)
        }
        ValidationErrorKind::Not { schema } => {
            format!("Value does not match the 'not' schema: {}", schema)
        }
        ValidationErrorKind::OneOfMultipleValid => {
            "Value is valid under multiple 'oneOf' schemas".to_string()
        }
        ValidationErrorKind::OneOfNotValid => "Value does not match any 'oneOf' schema".to_string(),
        ValidationErrorKind::Pattern { pattern } => {
            format!("Value does not match pattern: {}", pattern)
        }
        ValidationErrorKind::PropertyNames { error } => {
            format!("Invalid property name: {}", validation_error_message(error))
        }
        ValidationErrorKind::Required { property } => {
            format!("Missing required property: {}", property)
        }
        ValidationErrorKind::Type { kind } => format!("Invalid type: expected {:?}", kind),
        ValidationErrorKind::UnevaluatedItems { unexpected } => {
            format!("Unexpected items: {:?}", unexpected)
        }
        ValidationErrorKind::UnevaluatedProperties { unexpected } => {
            format!("Unexpected properties: {:?}", unexpected)
        }
        ValidationErrorKind::UniqueItems => "Array must contain only unique items".to_string(),
        ValidationErrorKind::Referencing(error) => format!("Schema reference error: {}", error),
        ValidationErrorKind::BacktrackLimitExceeded { error } => {
            format!("Regex backtrack limit exceeded: {}", error)
        }
    }
}

pub fn validate_html(html: &Html) -> Result<()> {
    let selector = Selector::parse("option[value='ociexecute(): ORA-00936: missing expression']")
        .map_err(|_| anyhow!("Error parsing selector"))?;

    match html.select(&selector).next() {
        Some(s) => match s.text().next() {
            Some(e) => {
                tracing::debug!("Got error from online mis: {}", e);
                return Err(Error::Unauthorized("Unauthorized".to_string()));
            }
            _ => (),
        },
        _ => (),
    };

    Ok(())
}
