use aide::axum::{routing::delete_with, ApiRouter};
use anyhow::anyhow;
use axum::extract::State;
use redis::AsyncCommands;
use schemars::JsonSchema;
use scraper::Selector;
use serde::{Deserialize, Serialize};

use crate::{
    core::{
        api_response::{ApiResponseTrait, SuccessApiResponse},
        axum_extractor::{ValidatedCookieJar, ValidatedJson, ValidatedPath},
        error::Error,
        generate_openapi_response::generate_response,
        helper::cache_helper,
    },
    http::{AppContext, Result},
};

use super::OPENAPI_TAG;

pub fn endpoint() -> ApiRouter<AppContext> {
    ApiRouter::new().api_route(
        "/logbook/{id}",
        delete_with(handler, generate_response(handler, OPENAPI_TAG, true)),
    )
}

#[derive(Debug, Serialize, Deserialize, JsonSchema, Default)]
#[serde(rename_all = "camelCase")]
pub struct LogbookDeleteBodyRequest {
    #[schemars(range(min = 1988))]
    pub tahun: u16,
    #[schemars(range(min = 1, max = 2))]
    pub semester: u8,
    #[schemars(range(min = 1, max = 24))]
    pub minggu: u8,
}

#[derive(Debug, Serialize, Deserialize, JsonSchema, Default)]
pub struct LogbookDeleteParamRequest {
    #[schemars(range(min = 1988))]
    pub id: String,
}

#[axum::debug_handler]
async fn handler(
    ValidatedCookieJar { session_id, nrp }: ValidatedCookieJar,
    State(state): State<AppContext>,
    ValidatedPath(path): ValidatedPath<LogbookDeleteParamRequest>,
    ValidatedJson(json): ValidatedJson<LogbookDeleteBodyRequest>,
) -> Result<SuccessApiResponse<String>> {
    let mut conn = cache_helper::get_conn(&state.redis_pool).await?;

    let params = [
        ("valnrpMahasiswa", nrp.clone()),
        ("valTahun", json.tahun.to_string()),
        ("valSemester", json.semester.to_string()),
        ("valMinggu", json.minggu.to_string()),
        ("Hapus", "1".to_string()),
        ("nokplogbook", path.id),
    ];

    let response = state
        .client
        .get("https://online.mis.pens.ac.id/entry_logbook_kp1.php")
        .query(&params)
        .header("Cookie", format!("PHPSESSID={};", session_id))
        .send()
        .await?
        .text()
        .await?;

    {
        let doc = scraper::Html::parse_document(&response);
        let validate_selector =
            Selector::parse("table").map_err(|_| anyhow!("Error parsing selector"))?;

        doc.select(&validate_selector)
            .next()
            .ok_or_else(|| Error::Unauthorized("Unauthorized".to_string()))?;
    }

    let () = conn
        .del(format!(
            "logbook:{}:{}:{}:{}",
            nrp, json.tahun, json.semester, json.minggu
        ))
        .await?;

    Ok(SuccessApiResponse::new("Logbook Created".to_string()))
}
