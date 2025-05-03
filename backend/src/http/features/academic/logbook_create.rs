use std::collections::HashMap;

use aide::axum::{routing::post_with, ApiRouter};
use anyhow::anyhow;
use axum::extract::State;
use redis::AsyncCommands;
use schemars::JsonSchema;
use scraper::Selector;
use serde::{Deserialize, Serialize};

use crate::{
    core::{
        api_response::{ApiResponseTrait, SuccessApiResponse},
        axum_extractor::{ValidatedCookieJar, ValidatedJson},
        error::Error,
        generate_openapi_response::generate_response,
        helper::cache_helper,
    },
    http::{AppContext, Result},
};

use super::OPENAPI_TAG;

pub fn endpoint() -> ApiRouter<AppContext> {
    ApiRouter::new().api_route(
        "/logbook",
        post_with(handler, generate_response(handler, OPENAPI_TAG, true)),
    )
}

#[derive(Debug, Serialize, Deserialize, JsonSchema, Default)]
#[serde(rename_all = "camelCase")]
pub struct LobookCreateRequest {
    #[schemars(range(min = 1988))]
    pub tahun: u16,
    #[schemars(range(min = 1, max = 2))]
    pub semester: u8,
    #[schemars(range(min = 1, max = 24))]
    pub minggu: u8,
    pub tanggal: String,
    #[schemars(regex(pattern = r"^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$"))]
    pub jam_mulai: String,
    #[schemars(regex(pattern = r"^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$"))]
    pub jam_selesai: String,
    #[schemars(length(max = 4000))]
    pub kegiatan: String,
    pub sesuai_kuliah: bool,
    pub matakuliah: Option<u32>,
    pub kp_daftar: String,
    pub mahasiswa: String,
}

#[axum::debug_handler]
async fn handler(
    ValidatedCookieJar { session_id, nrp }: ValidatedCookieJar,
    State(state): State<AppContext>,
    ValidatedJson(req): ValidatedJson<LobookCreateRequest>,
) -> Result<SuccessApiResponse<String>> {
    let mut conn = cache_helper::get_conn(&state.redis_pool).await?;

    let params = {
        let initial_params = [
            ("valnrpMahasiswa", nrp.clone()),
            ("valTahun", req.tahun.to_string()),
            ("valSemester", req.semester.to_string()),
            ("Simpan", "1".to_string()),
            ("valMinggu", req.minggu.to_string()),
            ("tanggal", req.tanggal),
            ("jam_mulai", req.jam_mulai),
            ("jam_selesai", req.jam_selesai),
            ("kegiatan", req.kegiatan),
            (
                "sesuai_kuliah",
                if req.sesuai_kuliah {
                    "1".to_owned()
                } else {
                    "0".to_owned()
                },
            ),
            ("kp_daftar", req.kp_daftar.to_string()),
            ("mahasiswa", req.mahasiswa.to_string()),
            ("Setuju", "1".to_string()),
        ];

        match req.matakuliah {
            Some(matakuliah) => {
                let mut params = HashMap::from(initial_params);
                params.insert("matakuliah", matakuliah.to_string());
                params
            }
            None => HashMap::from(initial_params),
        }
    };

    let response = state
        .client
        .post("https://online.mis.pens.ac.id/entry_logbook_kp1.php")
        .form(&params)
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

        let message_selector = Selector::parse("table:nth-child(2) > tbody:nth-child(1) > tr:nth-child(2) > td:nth-child(1) > div:nth-child(1) > font")
            .map_err(|_| anyhow!("Error parsing selector"))?;

        let msg = doc
            .select(&message_selector)
            .next()
            .map(|e| e.inner_html())
            .ok_or_else(|| anyhow!("Failed to create logbook, message not found"))?;

        if msg != "Simpan Data Berhasil" {
            return Err(anyhow!("Failed to create logbook: {}", msg).into());
        }
    }

    let () = conn
        .del(format!(
            "logbook:{}:{}:{}:{}",
            nrp, req.tahun, req.semester, req.minggu
        ))
        .await?;

    Ok(SuccessApiResponse::new("Logbook Created".to_string()))
}
