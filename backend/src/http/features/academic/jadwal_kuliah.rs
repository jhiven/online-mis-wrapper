use aide::axum::{routing::get_with, ApiRouter};
use anyhow::anyhow;
use axum::extract::State;
use schemars::JsonSchema;
use scraper::{selectable::Selectable, Selector};
use serde::{Deserialize, Serialize};

use crate::{
    core::{
        api_response::{ApiResponseTrait, SuccessApiResponse},
        axum_extractor::{validate_html, ValidatedCookieJar, ValidatedQuery},
        generate_openapi_response::generate_response,
        handler::{online_mis_handler, HttpHandler, RedisHandler},
        helper::cache_helper,
    },
    http::{features::shared::year_semester_request::YearSemesterRequest, AppContext, Result},
};

use super::OPENAPI_TAG;

pub fn endpoint() -> ApiRouter<AppContext> {
    ApiRouter::new().api_route(
        "/jadwal",
        get_with(handler, generate_response(handler, OPENAPI_TAG, true)),
    )
}

#[axum::debug_handler]
async fn handler(
    ValidatedCookieJar { session_id, nrp }: ValidatedCookieJar,
    State(state): State<AppContext>,
    ValidatedQuery(req): ValidatedQuery<YearSemesterRequest>,
) -> Result<SuccessApiResponse<JadwalKuliahResponse>> {
    let conn = cache_helper::get_conn(&state.redis_pool).await?;

    let http_handler = HttpHandler {
        url: format!(
            "https://online.mis.pens.ac.id/jadwal_kul.php?valTahun={}&valSemester={}",
            req.year, req.semester
        ),
        session_id: &session_id,
        client: &state.client,
    };

    let redis_handler = RedisHandler {
        key: format!("jadwal:{}:{}:{}", nrp, req.year, req.semester),
        redis_pool: conn,
    };

    Ok(SuccessApiResponse::new(
        online_mis_handler(redis_handler, http_handler, html_extractor).await?,
    ))
}

fn html_extractor(body: String) -> Result<JadwalKuliahResponse> {
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

    let jam_istirahat = {
        let selector = Selector::parse("table > tbody > tr:nth-child(3) > td > div > table > tbody > tr > td > table > tbody > tr:nth-child(4) > td:nth-child(2) > table > tbody > tr > td > table:nth-child(2) > tbody > tr:nth-child(9) > td > strong").map_err(|_| anyhow!("Error parsing selector"))?;
        doc.select(&selector)
            .next()
            .map(|e| e.inner_html())
            .unwrap_or_default()
    };

    let kelas = {
        let selector = Selector::parse("table > tbody > tr:nth-child(3) > td > div > table > tbody > tr > td > table > tbody > tr:nth-child(4) > td:nth-child(2) > table > tbody > tr > td > table:nth-child(1) > tbody > tr > td > div > b").map_err(|_| anyhow!("Error parsing selector"))?;
        doc.select(&selector)
            .next()
            .map(|e| e.inner_html())
            .unwrap_or_default()
    };

    let table: Table = {
        let selector = Selector::parse("body > table > tbody > tr:nth-child(3) > td > div > table > tbody > tr > td > table > tbody > tr:nth-child(4) > td:nth-child(2) > table > tbody > tr > td > table:nth-child(2) > tbody > tr:not(:first-child):not(:last-child)").map_err(|_| anyhow!("Error parsing selector"))?;
        let matkul_selector = Selector::parse("tr:nth-child(odd) > td:nth-child(2) > div")
            .map_err(|_| anyhow!("Error parsing selector"))?;

        let data: Vec<Vec<Matakuliah>> = doc
            .select(&selector)
            .map(|e| {
                e.select(&matkul_selector)
                    .map(|e| {
                        let matkul = e.text().map(|e| e.trim()).collect::<Vec<_>>();

                        let nama = matkul.get(0).unwrap_or_else(|| &"").to_string();

                        let dosen_jam = matkul
                            .get(1)
                            .unwrap_or_else(|| &"")
                            .split(" - ")
                            .collect::<Vec<_>>();
                        let dosen = dosen_jam.get(0).unwrap_or_else(|| &"").trim().to_string();
                        let jam = dosen_jam.get(1).unwrap_or_else(|| &"").to_string();

                        let ruangan = matkul.get(2).unwrap_or_else(|| &"").to_string();

                        Matakuliah {
                            nama,
                            dosen,
                            jam,
                            ruangan,
                        }
                    })
                    .collect()
            })
            .collect();

        let empty: Vec<Matakuliah> = vec![];
        Table {
            minggu: data.get(0).unwrap_or_else(|| &empty).to_vec(),
            senin: data.get(1).unwrap_or_else(|| &empty).to_vec(),
            selasa: data.get(2).unwrap_or_else(|| &empty).to_vec(),
            rabu: data.get(3).unwrap_or_else(|| &empty).to_vec(),
            kamis: data.get(4).unwrap_or_else(|| &empty).to_vec(),
            jumat: data.get(5).unwrap_or_else(|| &empty).to_vec(),
            sabtu: data.get(6).unwrap_or_else(|| &empty).to_vec(),
        }
    };

    Ok(JadwalKuliahResponse {
        semester,
        year,
        kelas,
        jam_istirahat,
        table,
    })
}

#[derive(Serialize, Deserialize, Default, JsonSchema)]
#[serde(rename_all = "camelCase")]
struct JadwalKuliahResponse {
    pub semester: Vec<u8>,
    pub year: Vec<u16>,
    pub kelas: String,
    pub jam_istirahat: String,
    pub table: Table,
}

#[derive(Serialize, Deserialize, Default, JsonSchema)]
struct Table {
    pub minggu: Vec<Matakuliah>,
    pub senin: Vec<Matakuliah>,
    pub selasa: Vec<Matakuliah>,
    pub rabu: Vec<Matakuliah>,
    pub kamis: Vec<Matakuliah>,
    pub jumat: Vec<Matakuliah>,
    pub sabtu: Vec<Matakuliah>,
}

#[derive(Serialize, Deserialize, Default, Clone, JsonSchema)]
struct Matakuliah {
    pub nama: String,
    pub dosen: String,
    pub jam: String,
    pub ruangan: String,
}
