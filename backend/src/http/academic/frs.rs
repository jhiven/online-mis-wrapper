use anyhow::anyhow;
use axum::{extract::State, http::StatusCode, routing::get, Router};
use axum_extra::extract::CookieJar;
use scraper::Selector;
use serde::{Deserialize, Serialize};

use crate::http::{
    handler::{online_mis_handler, HttpHandler, RedisHandler},
    helper::{cache_helper, http_helper::YearSemesterRequest},
    success::SuccessResponse,
    validator::{validate_cookies, validate_html, ValidatedQuery},
    AppContext, Result,
};

pub fn router() -> Router<AppContext> {
    Router::new().route("/frs", get(handler))
}

#[axum::debug_handler]
async fn handler(
    jar: CookieJar,
    State(state): State<AppContext>,
    ValidatedQuery(req): ValidatedQuery<YearSemesterRequest>,
) -> Result<SuccessResponse<FRSData>> {
    let (session_id, nrp) = validate_cookies(&jar)?;
    let conn = cache_helper::get_conn(&state.redis_pool).await?;

    let http_handler = HttpHandler {
        url: format!(
            "https://online.mis.pens.ac.id/FRS_mbkm.php?valTahun={}&valSemester={}",
            req.year.unwrap_or_default(),
            req.semester.unwrap_or_default()
        ),
        session_id,
        client: &state.client,
    };

    let redis_handler = RedisHandler {
        key: format!(
            "frs:{}:{}:{}",
            nrp,
            req.year.unwrap_or_default(),
            req.semester.unwrap_or_default()
        ),
        redis_pool: conn,
    };

    Ok(SuccessResponse {
        status: StatusCode::OK,
        data: online_mis_handler(redis_handler, http_handler, html_extractor).await?,
    })
}

fn html_extractor(body: String) -> Result<FRSData> {
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

    let dosen = {
        let selector = Selector::parse("table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(5) > td:nth-child(2) > font:nth-child(1)").map_err(|_| anyhow!("Error parsing selector"))?;
        doc.select(&selector)
            .next()
            .map(|e| e.inner_html())
            .unwrap_or_default()
            .trim()
            .to_owned()
    };

    let sks = {
        let selector = Selector::parse("table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(6) > td:nth-child(2) > font:nth-child(1)").map_err(|_| anyhow!("Error parsing selector"))?;
        let data: Vec<String> = doc
            .select(&selector)
            .next()
            .map(|e| {
                e.inner_html()
                    .split(" ")
                    .map(|s| s.trim().to_owned())
                    .collect()
            })
            .unwrap_or_default();

        let empty = &"".to_owned();

        SKS {
            batas: data
                .get(1)
                .unwrap_or_else(|| empty)
                .parse()
                .unwrap_or_default(),
            sisa: data
                .get(3)
                .unwrap_or_else(|| empty)
                .parse()
                .unwrap_or_default(),
        }
    };

    let ip = {
        let selector = Selector::parse("table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(7) > td:nth-child(2) > font:nth-child(1)").map_err(|_| anyhow!("Error parsing selector"))?;
        let data: Vec<String> = doc
            .select(&selector)
            .next()
            .map(|e| {
                e.inner_html()
                    .split(" ")
                    .map(|s| s.trim().to_owned())
                    .collect()
            })
            .unwrap_or_default();

        let empty = &"".to_owned();

        IP {
            ipk: data
                .get(1)
                .unwrap_or_else(|| empty)
                .parse()
                .unwrap_or_default(),
            ips: data
                .get(3)
                .unwrap_or_else(|| empty)
                .parse()
                .unwrap_or_default(),
        }
    };

    let tanggal_penting = {
        let tanggal_pengisian: Vec<String> = {
            let selector = Selector::parse("table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(8) > td:nth-child(2) > font:nth-child(1) > i:nth-child(2)").map_err(|_| anyhow!("Error parsing selector"))?;
            doc.select(&selector)
                .next()
                .map(|e| e.inner_html())
                .unwrap_or_default()
                .split("sd")
                .map(|e| e.trim().to_owned())
                .collect()
        };

        let tanggal_perubahan: Vec<String> = {
            let selector = Selector::parse("table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(8) > td:nth-child(2) > font:nth-child(1) > i:nth-child(4)").map_err(|_| anyhow!("Error parsing selector"))?;
            doc.select(&selector)
                .next()
                .map(|e| e.inner_html())
                .unwrap_or_default()
                .split("sd")
                .map(|e| e.trim().to_owned())
                .collect()
        };

        let tanggal_drop: Vec<String> = {
            let selector = Selector::parse("table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > div:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(8) > td:nth-child(2) > font:nth-child(1) > i:nth-child(6)").map_err(|_| anyhow!("Error parsing selector"))?;
            doc.select(&selector)
                .next()
                .map(|e| e.inner_html())
                .unwrap_or_default()
                .split("sd")
                .map(|e| e.trim().to_owned())
                .collect()
        };

        let empty = &"".to_owned();

        TanggalPenting {
            pengisian: DateRange {
                from: tanggal_pengisian
                    .get(0)
                    .unwrap_or_else(|| empty)
                    .to_string(),
                to: tanggal_pengisian
                    .get(1)
                    .unwrap_or_else(|| empty)
                    .to_string(),
            },
            perubahan: DateRange {
                from: tanggal_perubahan
                    .get(0)
                    .unwrap_or_else(|| empty)
                    .to_string(),
                to: tanggal_perubahan
                    .get(1)
                    .unwrap_or_else(|| empty)
                    .to_string(),
            },
            drop: DateRange {
                from: tanggal_drop.get(0).unwrap_or_else(|| empty).to_string(),
                to: tanggal_drop.get(1).unwrap_or_else(|| empty).to_string(),
            },
        }
    };

    let table: Vec<Table> = {
        let selector = Selector::parse("table > tbody > tr:nth-child(3) > td > div > table > tbody > tr > td > table > tbody > tr:nth-child(10) > td:nth-child(2) > table:nth-child(1) > tbody > tr:not(:first-child):not(:last-child)").map_err(|_| anyhow!("Error parsing selector"))?;

        let id_selector =
            Selector::parse("td:nth-child(1) a").map_err(|_| anyhow!("Error parsing selector"))?;
        let kode_selector = Selector::parse("td:nth-child(3) font")
            .map_err(|_| anyhow!("Error parsing selector"))?;
        let group_selector = Selector::parse("td:nth-child(4) font")
            .map_err(|_| anyhow!("Error parsing selector"))?;
        let matkul_selector = Selector::parse("td:nth-child(5) font")
            .map_err(|_| anyhow!("Error parsing selector"))?;
        let dosen_selector = Selector::parse("td:nth-child(6) font")
            .map_err(|_| anyhow!("Error parsing selector"))?;
        let sks_selector = Selector::parse("td:nth-child(7) font")
            .map_err(|_| anyhow!("Error parsing selector"))?;
        let kelas_selector = Selector::parse("td:nth-child(8) font")
            .map_err(|_| anyhow!("Error parsing selector"))?;
        let disetujui_selector = Selector::parse("td:nth-child(9) font strong")
            .map_err(|_| anyhow!("Error parsing selector"))?;

        doc.select(&selector)
            .map(|e| {
                let id = e
                    .select(&id_selector)
                    .next()
                    .map(|e| e.attr("href").unwrap_or_default().to_owned())
                    .unwrap_or_default()
                    .split("=")
                    .last()
                    .unwrap_or_default()
                    .to_owned();
                let kode = e
                    .select(&kode_selector)
                    .next()
                    .map(|e| e.inner_html().trim().to_owned())
                    .unwrap_or_default();
                let group = e
                    .select(&group_selector)
                    .next()
                    .map(|e| e.inner_html().trim().to_owned())
                    .unwrap_or_default();
                let dosen = e
                    .select(&dosen_selector)
                    .next()
                    .map(|e| e.inner_html().trim().to_owned())
                    .unwrap_or_default();
                let sks = e
                    .select(&sks_selector)
                    .next()
                    .map(|e| e.inner_html().trim().to_owned())
                    .unwrap_or_default();
                let kelas = e
                    .select(&kelas_selector)
                    .next()
                    .map(|e| e.inner_html().trim().to_owned())
                    .unwrap_or_default();
                let disetujui = e
                    .select(&disetujui_selector)
                    .next()
                    .map(|e| e.inner_html().trim().to_owned())
                    .unwrap_or_default();
                let mata_kuliah = {
                    let data: Vec<&str> = e
                        .select(&matkul_selector)
                        .next()
                        .map(|e| e.text().collect())
                        .unwrap_or_default();

                    MataKuliah {
                        nama: data.get(0).unwrap_or_else(|| &"").to_string(),
                        hari: data
                            .get(1)
                            .unwrap_or_else(|| &"")
                            .split(" : ")
                            .last()
                            .unwrap_or_default()
                            .to_string(),
                        jam: data
                            .get(2)
                            .unwrap_or_else(|| &"")
                            .split(" : ")
                            .last()
                            .unwrap_or_default()
                            .to_string(),
                    }
                };

                Table {
                    id,
                    kode,
                    group,
                    mata_kuliah,
                    dosen,
                    sks,
                    kelas,
                    disetujui,
                }
            })
            .collect()
    };

    Ok(FRSData {
        semester,
        year,
        dosen,
        sks,
        ip,
        tanggal_penting,
        table,
    })
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct FRSData {
    pub semester: Vec<u8>,
    pub year: Vec<u16>,
    pub dosen: String,
    pub sks: SKS,
    pub ip: IP,
    pub tanggal_penting: TanggalPenting,
    pub table: Vec<Table>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct Table {
    pub id: String,
    pub kode: String,
    pub group: String,
    pub mata_kuliah: MataKuliah,
    pub dosen: String,
    pub sks: String,
    pub kelas: String,
    pub disetujui: String,
}

#[derive(Serialize, Deserialize)]
struct MataKuliah {
    pub nama: String,
    pub hari: String,
    pub jam: String,
}

#[derive(Serialize, Deserialize)]
struct DateRange {
    pub from: String,
    pub to: String,
}

#[derive(Serialize, Deserialize)]
struct TanggalPenting {
    pub pengisian: DateRange,
    pub perubahan: DateRange,
    pub drop: DateRange,
}

#[derive(Serialize, Deserialize)]
struct SKS {
    pub batas: i32,
    pub sisa: i32,
}

#[derive(Serialize, Deserialize)]
struct IP {
    pub ipk: f32,
    pub ips: f32,
}
