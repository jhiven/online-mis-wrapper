use anyhow::anyhow;
use axum::{extract::State, routing::get, Router};
use axum_extra::extract::CookieJar;
use scraper::{selectable::Selectable, Selector};
use serde::{Deserialize, Serialize};

use crate::http::{
    handler::{online_mis_handler, HttpHandler, RedisHandler},
    helper::{cache_helper, http_helper::YearSemesterRequest},
    success::SuccessResponse,
    validator::{validate_cookies, validate_html, ValidatedQuery},
    AppContext, Result,
};

pub fn router() -> Router<AppContext> {
    Router::new().route("/jadwal", get(handler))
}

#[axum::debug_handler]
async fn handler(
    jar: CookieJar,
    State(state): State<AppContext>,
    ValidatedQuery(req): ValidatedQuery<YearSemesterRequest>,
) -> Result<SuccessResponse<JadwalKuliahData>> {
    let (session_id, nrp) = validate_cookies(&jar)?;
    let conn = cache_helper::get_conn(&state.redis_pool).await?;

    let http_handler = HttpHandler {
        url: format!(
            "https://online.mis.pens.ac.id/jadwal_kul.php?valTahun={}&valSemester={}",
            req.year.unwrap_or_default(),
            req.semester.unwrap_or_default()
        ),
        session_id,
        client: &state.client,
    };

    let redis_handler = RedisHandler {
        key: format!(
            "jadwal:{}:{}:{}",
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

fn html_extractor(body: String) -> Result<JadwalKuliahData> {
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

    Ok(JadwalKuliahData {
        semester,
        year,
        kelas,
        jam_istirahat,
        table,
    })
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct JadwalKuliahData {
    pub semester: Vec<u8>,
    pub year: Vec<u16>,
    pub kelas: String,
    pub jam_istirahat: String,
    pub table: Table,
}

#[derive(Serialize, Deserialize)]
struct Table {
    pub minggu: Vec<Matakuliah>,
    pub senin: Vec<Matakuliah>,
    pub selasa: Vec<Matakuliah>,
    pub rabu: Vec<Matakuliah>,
    pub kamis: Vec<Matakuliah>,
    pub jumat: Vec<Matakuliah>,
    pub sabtu: Vec<Matakuliah>,
}

#[derive(Serialize, Deserialize, Default, Clone)]
struct Matakuliah {
    pub nama: String,
    pub dosen: String,
    pub jam: String,
    pub ruangan: String,
}
