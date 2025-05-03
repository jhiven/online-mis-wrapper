use aide::axum::{routing::get_with, ApiRouter};
use anyhow::anyhow;
use schemars::JsonSchema;
use scraper::Selector;

use axum::extract::State;
use serde::{Deserialize, Serialize};

use crate::{
    core::{
        api_response::{ApiResponseTrait, SuccessApiResponse},
        axum_extractor::{validate_html, ValidatedCookieJar, ValidatedQuery},
        error::Error,
        generate_openapi_response::generate_response,
        handler::{online_mis_handler, HttpHandler, RedisHandler},
        helper::cache_helper,
    },
    http::{AppContext, Result},
};

use super::OPENAPI_TAG;

pub fn endpoint() -> ApiRouter<AppContext> {
    ApiRouter::new().api_route(
        "/logbook",
        get_with(handler, generate_response(handler, OPENAPI_TAG, true)),
    )
}

#[derive(Debug, Serialize, Deserialize, JsonSchema, Default)]
pub struct LobookDetailRequest {
    #[schemars(range(min = 1988))]
    pub year: u16,
    #[schemars(range(min = 1))]
    pub semester: u8,
    #[schemars(range(min = 1, max = 24))]
    pub minggu: u8,
}

#[axum::debug_handler]
async fn handler(
    ValidatedCookieJar { session_id, nrp }: ValidatedCookieJar,
    State(state): State<AppContext>,
    ValidatedQuery(req): ValidatedQuery<LobookDetailRequest>,
) -> Result<SuccessApiResponse<LogbookDetailResponse>> {
    let conn = cache_helper::get_conn(&state.redis_pool).await?;

    let http_handler = HttpHandler {
        session_id: &session_id,
        client: &state.client,
        url: format!(
            "https://online.mis.pens.ac.id/entry_logbook_kp1.php?valTahun={}&valSemester={}&valMinggu={}",
            req.year,
            req.semester,
            req.minggu
        ),
    };

    let redis_handler = RedisHandler {
        redis_pool: conn,
        key: format!(
            "logbook:{}:{}:{}:{}",
            nrp, req.year, req.semester, req.minggu
        ),
    };

    Ok(SuccessApiResponse::new(
        online_mis_handler(redis_handler, http_handler, html_extractor).await?,
    ))
}

fn html_extractor(body: String) -> Result<LogbookDetailResponse> {
    let doc = scraper::Html::parse_document(&body);
    validate_html(&doc)?;

    let validate_selector =
        Selector::parse("table").map_err(|_| anyhow!("Error parsing selector"))?;

    doc.select(&validate_selector)
        .next()
        .ok_or_else(|| Error::Unauthorized("Unauthorized".to_string()))?;

    let semester: Vec<u8> = {
        let selector = Selector::parse("#cbSemester > option")
            .map_err(|_| anyhow!("Error parsing selector"))?;
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
        let selector =
            Selector::parse("#tahun > option").map_err(|_| anyhow!("Error parsing selector"))?;
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

    let minggu: Vec<u8> = {
        let selector =
            Selector::parse("#minggu > option").map_err(|_| anyhow!("Error parsing selector"))?;
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

    let catatan_dosen = {
        let selector = Selector::parse(
            "table:nth-child(10) > tbody:nth-child(1) > tr:nth-child(2) > td:nth-child(1)",
        )
        .map_err(|_| anyhow!("Error parsing selector"))?;
        doc.select(&selector)
            .next()
            .map(|e| e.inner_html())
            .unwrap_or_default()
            .trim()
            .to_owned()
    };

    let catatan_perusahaan = {
        let selector = Selector::parse(
            "table:nth-child(12) > tbody:nth-child(1) > tr:nth-child(2) > td:nth-child(1)",
        )
        .map_err(|_| anyhow!("Error parsing selector"))?;
        doc.select(&selector)
            .next()
            .map(|e| e.inner_html())
            .unwrap_or_default()
            .trim()
            .to_owned()
    };

    let kp_daftar = {
        let selector =
            Selector::parse("#kp_daftar").map_err(|_| anyhow!("Error parsing selector"))?;
        doc.select(&selector)
            .next()
            .map(|e| e.attr("value").unwrap_or_default())
            .unwrap_or_default()
            .to_owned()
    };

    let mahasiswa = {
        let selector =
            Selector::parse("#mahasiswa").map_err(|_| anyhow!("Error parsing selector"))?;
        doc.select(&selector)
            .next()
            .map(|e| e.attr("value").unwrap_or_default())
            .unwrap_or_default()
            .to_owned()
    };

    let nama = {
        let selector =
            Selector::parse("table:nth-child(2) > tbody > tr:nth-child(6) > td:nth-child(2)")
                .map_err(|_| anyhow!("Error parsing selector"))?;
        doc.select(&selector)
            .next()
            .map(|e| e.inner_html())
            .unwrap_or_default()
            .trim()
            .split(": ")
            .last()
            .unwrap_or_default()
            .to_owned()
    };

    let nrp = {
        let selector =
            Selector::parse("table:nth-child(2) > tbody > tr:nth-child(7) > td:nth-child(2)")
                .map_err(|_| anyhow!("Error parsing selector"))?;
        doc.select(&selector)
            .next()
            .map(|e| e.inner_html())
            .unwrap_or_default()
            .trim()
            .split(": ")
            .last()
            .unwrap_or_default()
            .to_owned()
    };

    let pembimbing = {
        let selector =
            Selector::parse("table:nth-child(2) > tbody > tr:nth-child(8) > td:nth-child(2)")
                .map_err(|_| anyhow!("Error parsing selector"))?;
        doc.select(&selector)
            .next()
            .map(|e| e.inner_html())
            .unwrap_or_default()
            .trim()
            .split(": ")
            .last()
            .unwrap_or_default()
            .to_owned()
    };

    let tempat_kp = {
        let selector =
            Selector::parse("table:nth-child(2) > tbody > tr:nth-child(9) > td:nth-child(2)")
                .map_err(|_| anyhow!("Error parsing selector"))?;
        doc.select(&selector)
            .next()
            .map(|e| e.inner_html())
            .unwrap_or_default()
            .trim()
            .split(": ")
            .last()
            .unwrap_or_default()
            .to_owned()
    };

    let tanggal_kp = {
        let selector =
            Selector::parse("table:nth-child(2) > tbody > tr:nth-child(10) > td:nth-child(2)")
                .map_err(|_| anyhow!("Error parsing selector"))?;
        doc.select(&selector)
            .next()
            .map(|e| e.inner_html())
            .unwrap_or_default()
            .split(":")
            .last()
            .unwrap_or_default()
            .trim()
            .to_owned()
    };

    let list_matkul: Vec<LogbookMatkulResponse> = {
        let selector = Selector::parse("#matakuliah > option:not(:first-child)")
            .map_err(|_| anyhow!("Error parsing selector"))?;
        doc.select(&selector)
            .map(|e| {
                let text = e.inner_html().trim().to_owned();
                let value: u32 = e
                    .value()
                    .attr("value")
                    .unwrap_or_default()
                    .parse()
                    .unwrap_or_default();

                LogbookMatkulResponse { text, value }
            })
            .collect()
    };

    let table: Vec<LogbookTableResponse> = {
        let selector =
            Selector::parse("table:nth-child(8) > tbody > tr:not(:first-child):not(:nth-child(2))")
                .map_err(|_| anyhow!("Error parsing selector"))?;

        let tanggal_selector =
            Selector::parse("td:nth-child(2)").map_err(|_| anyhow!("Error parsing selector"))?;
        let jam_mulai_selector =
            Selector::parse("td:nth-child(3)").map_err(|_| anyhow!("Error parsing selector"))?;
        let jam_selesai_selector =
            Selector::parse("td:nth-child(4)").map_err(|_| anyhow!("Error parsing selector"))?;
        let kegiatan_selector =
            Selector::parse("td:nth-child(5)").map_err(|_| anyhow!("Error parsing selector"))?;
        let matkul_kegiatan_selector =
            Selector::parse("td:nth-child(6)").map_err(|_| anyhow!("Error parsing selector"))?;
        let file_progres_selector = Selector::parse("td:nth-child(7) > a")
            .map_err(|_| anyhow!("Error parsing selector"))?;
        let file_foto_selector = Selector::parse("td:nth-child(8) > a")
            .map_err(|_| anyhow!("Error parsing selector"))?;
        let link_cetak_selector = Selector::parse("td:nth-child(9) > a")
            .map_err(|_| anyhow!("Error parsing selector"))?;
        let can_delete_selector = Selector::parse("td:nth-child(10) > img")
            .map_err(|_| anyhow!("Error parsing selector"))?;

        doc.select(&selector)
            .map(|e| {
                let tanggal: String = e
                    .select(&tanggal_selector)
                    .next()
                    .map(|e| e.inner_html().trim().to_owned())
                    .unwrap_or_default();

                let jam_mulai: String = e
                    .select(&jam_mulai_selector)
                    .next()
                    .map(|e| e.inner_html().trim().to_owned())
                    .unwrap_or_default();

                let jam_selesai: String = e
                    .select(&jam_selesai_selector)
                    .next()
                    .map(|e| e.inner_html().trim().to_owned())
                    .unwrap_or_default();

                let kegiatan: String = e
                    .select(&kegiatan_selector)
                    .next()
                    .map(|e| e.inner_html().trim().to_owned())
                    .unwrap_or_default();

                let matkul_kegiatan: String = e
                    .select(&matkul_kegiatan_selector)
                    .next()
                    .map(|e| e.inner_html().trim().to_owned())
                    .unwrap_or_default();

                let file_progres: Option<String> = {
                    let (inner, href) = e
                        .select(&file_progres_selector)
                        .next()
                        .map(|e| {
                            (
                                e.inner_html().trim().to_owned(),
                                e.attr("href").unwrap_or_default().trim().to_owned(),
                            )
                        })
                        .unwrap_or_default();

                    match inner.is_empty() {
                        true => None,
                        false => Some(href),
                    }
                };

                let file_foto: String = e
                    .select(&file_foto_selector)
                    .next()
                    .map(|e| e.attr("href").unwrap_or_default().trim().to_owned())
                    .unwrap_or_default();

                let link_cetak: String = e
                    .select(&link_cetak_selector)
                    .next()
                    .map(|e| e.attr("href").unwrap_or_default().trim().to_owned())
                    .unwrap_or_default();

                let id = link_cetak
                    .clone()
                    .split("=")
                    .last()
                    .unwrap_or_default()
                    .to_owned();

                let deletable = match e.select(&can_delete_selector).next() {
                    Some(_) => true,
                    None => false,
                };

                LogbookTableResponse {
                    id,
                    tanggal,
                    jam_mulai,
                    jam_selesai,
                    file_foto,
                    file_progres,
                    kegiatan,
                    link_cetak,
                    deletable,
                    matkul_kegiatan,
                }
            })
            .collect()
    };

    Ok(LogbookDetailResponse {
        semester,
        year,
        minggu,
        table,
        catatan_dosen,
        catatan_perusahaan,
        kp_daftar,
        mahasiswa,
        form_detail: LogbookFormDetailResponse {
            nama,
            nrp,
            pembimbing,
            tempat_kp,
            tanggal_kp,
            list_matkul,
        },
    })
}

#[derive(Serialize, Deserialize, JsonSchema, Default)]
#[serde(rename_all = "camelCase")]
struct LogbookDetailResponse {
    pub semester: Vec<u8>,
    pub year: Vec<u16>,
    pub minggu: Vec<u8>,
    pub form_detail: LogbookFormDetailResponse,
    pub table: Vec<LogbookTableResponse>,
    pub catatan_dosen: String,
    pub catatan_perusahaan: String,
    pub kp_daftar: String,
    pub mahasiswa: String,
}

#[derive(Serialize, Deserialize, JsonSchema, Default)]
#[serde(rename_all = "camelCase")]
struct LogbookMatkulResponse {
    pub text: String,
    pub value: u32,
}

#[derive(Serialize, Deserialize, JsonSchema, Default)]
#[serde(rename_all = "camelCase")]
struct LogbookFormDetailResponse {
    pub nama: String,
    pub nrp: String,
    pub pembimbing: String,
    pub tempat_kp: String,
    pub tanggal_kp: String,
    pub list_matkul: Vec<LogbookMatkulResponse>,
}

#[derive(Serialize, Deserialize, JsonSchema, Default)]
#[serde(rename_all = "camelCase")]
struct LogbookTableResponse {
    pub id: String,
    pub tanggal: String,
    pub jam_mulai: String,
    pub jam_selesai: String,
    pub kegiatan: String,
    pub matkul_kegiatan: String,
    pub file_progres: Option<String>,
    pub file_foto: String,
    pub link_cetak: String,
    pub deletable: bool,
}
