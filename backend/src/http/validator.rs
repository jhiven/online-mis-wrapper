use anyhow::anyhow;
use axum::{
    extract::{
        rejection::{FormRejection, JsonRejection},
        FromRequest, Query, Request,
    },
    Form, Json,
};
use axum_extra::extract::CookieJar;
use scraper::{Html, Selector};
use serde::de::DeserializeOwned;
use validator::Validate;

use super::{error::Error, Result};

#[derive(Debug, Clone, Copy, Default)]
pub struct ValidatedForm<T>(pub T);

impl<T, S> FromRequest<S> for ValidatedForm<T>
where
    T: DeserializeOwned + Validate,
    S: Send + Sync,
    Form<T>: FromRequest<S, Rejection = FormRejection>,
{
    type Rejection = Error;

    async fn from_request(req: Request, state: &S) -> Result<Self> {
        let Form(value) = Form::<T>::from_request(req, state).await?;
        value.validate()?;
        Ok(Self(value))
    }
}

#[derive(Debug, Clone, Copy, Default)]
pub struct ValidatedJson<T>(pub T);

impl<T, S> FromRequest<S> for ValidatedJson<T>
where
    T: DeserializeOwned + Validate,
    S: Send + Sync,
    Json<T>: FromRequest<S, Rejection = JsonRejection>,
{
    type Rejection = Error;

    async fn from_request(req: Request, state: &S) -> Result<Self> {
        let Json(value) = Json::<T>::from_request(req, state).await?;
        value.validate()?;
        Ok(Self(value))
    }
}

#[derive(Debug, Clone, Copy, Default)]
pub struct ValidatedQuery<T>(pub T);

impl<T, S> FromRequest<S> for ValidatedQuery<T>
where
    T: DeserializeOwned + Validate,
    S: Send + Sync,
{
    type Rejection = Error;

    async fn from_request(req: Request, state: &S) -> Result<Self> {
        let Query(value) = Query::<T>::from_request(req, state).await?;
        value.validate()?;
        Ok(Self(value))
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

pub fn validate_cookies(jar: &CookieJar) -> Result<(&str, &str)> {
    let session_id = jar
        .get("PHPSESSID")
        .ok_or_else(|| Error::Unauthorized("Unauthorized".to_string()))?
        .value();

    let nrp = jar
        .get("nrp")
        .ok_or_else(|| Error::Unauthorized("Unauthorized".to_string()))?
        .value();

    if nrp.is_empty() || session_id.is_empty() {
        return Err(Error::Unauthorized("Unauthorized".to_string()));
    }

    Ok((session_id, nrp))
}
