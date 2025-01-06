use anyhow::anyhow;
use axum_extra::extract::CookieJar;
use scraper::Selector;

use axum::{extract::State, routing::get, Router};
use serde::{Deserialize, Serialize};

use crate::http::{
    handler::{online_mis_handler, HttpHandler, RedisHandler},
    helper::{cache_helper, http_helper::YearSemesterRequest},
    success::SuccessResponse,
    validator::{validate_cookies, validate_html, ValidatedQuery},
    AppContext, Result,
};

pub fn router() -> Router<AppContext> {
    Router::new().route("/absen", get(handler))
}

#[axum::debug_handler]
async fn handler(
    jar: CookieJar,
    State(state): State<AppContext>,
    ValidatedQuery(req): ValidatedQuery<YearSemesterRequest>,
) -> Result<SuccessResponse<AbsenData>> {
    let (session_id, nrp) = validate_cookies(&jar)?;
    let conn = cache_helper::get_conn(&state.redis_pool).await?;

    let http_handler = HttpHandler {
        url: format!(
            "https://online.mis.pens.ac.id/absen.php?valTahun={}&valSemester={}",
            req.year.unwrap_or_default(),
            req.semester.unwrap_or_default()
        ),
        session_id,
        client: &state.client,
    };

    let redis_handler = RedisHandler {
        key: format!(
            "absen:{}:{}:{}",
            nrp,
            req.year.unwrap_or_default(),
            req.semester.unwrap_or_default()
        ),
        redis_pool: conn,
    };

    Ok(SuccessResponse {
        status: axum::http::StatusCode::OK,
        data: online_mis_handler(redis_handler, http_handler, html_extractor).await?,
    })
}

fn html_extractor(body: String) -> Result<AbsenData> {
    let doc = scraper::Html::parse_document(&body);
    validate_html(&doc)?;

    let semester: Vec<u8> = {
        let selector = Selector::parse("table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(2) > font:nth-child(1) > font:nth-child(1) > select:nth-child(1) > option").map_err(|_| anyhow!("Error parsing selector"))?;
        doc.select(&selector)
            .map(|e| {
                e.value()
                    .attr("value")
                    .unwrap_or_default()
                    .parse()
                    .unwrap_or_default()
            })
            .collect()
    };

    let year: Vec<u16> = {
        let selector = Selector::parse("table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(2) > td:nth-child(2) > font:nth-child(1) > font:nth-child(1) > select:nth-child(1) > option").map_err(|_| anyhow!("Error parsing selector"))?;
        doc.select(&selector)
            .map(|e| {
                e.value()
                    .attr("value")
                    .unwrap_or_default()
                    .parse()
                    .unwrap_or_default()
            })
            .collect()
    };

    let table: Vec<Table> = {
        let selector = Selector::parse("table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(4) > td:nth-child(2) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:not(:first-child):not(:nth-child(2))").map_err(|_| anyhow!("Error parsing selector"))?;

        let kode_selector =
            Selector::parse("td:nth-child(1)").map_err(|_| anyhow!("Error parsing selector"))?;
        let matakuliah_selector =
            Selector::parse("td:nth-child(2)").map_err(|_| anyhow!("Error parsing selector"))?;
        let minggu_selector =
            Selector::parse("td:not(:nth-child(1)):not(:nth-child(2)):not(:last-child)")
                .map_err(|_| anyhow!("Error parsing selector"))?;
        let kehadiran_selector =
            Selector::parse("td:last-child").map_err(|_| anyhow!("Error parsing selector"))?;

        doc.select(&selector)
            .map(|e| {
                let kode: String = e
                    .select(&kode_selector)
                    .next()
                    .map(|e| e.text().collect())
                    .unwrap_or_default();

                let mata_kuliah: String = e
                    .select(&matakuliah_selector)
                    .next()
                    .map(|e| e.text().collect::<String>().trim().to_owned())
                    .unwrap_or_default();

                let kehadiran: String = e
                    .select(&kehadiran_selector)
                    .next()
                    .map(|e| e.text().collect::<String>().trim().to_owned())
                    .unwrap_or_default();

                let minggu: Vec<String> = e
                    .select(&minggu_selector)
                    .map(|e| e.text().collect())
                    .collect();

                Table {
                    kode,
                    mata_kuliah,
                    minggu,
                    kehadiran,
                }
            })
            .collect()
    };

    Ok(AbsenData {
        semester,
        year,
        table,
    })
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AbsenData {
    pub semester: Vec<u8>,
    pub year: Vec<u16>,
    pub table: Vec<Table>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Table {
    pub kode: String,
    pub mata_kuliah: String,
    pub minggu: Vec<String>,
    pub kehadiran: String,
}
