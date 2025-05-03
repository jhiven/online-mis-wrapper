use aide::axum::{routing::post_with, ApiRouter};
use anyhow::anyhow;
use axum::{extract::State, http::header, response::AppendHeaders};
use base64::Engine;
use redis::AsyncCommands;
use reqwest::{cookie::CookieStore, Url};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use std::{str::FromStr, sync::Arc, u8};

use crate::{
    core::{
        api_response::{ApiResponseTrait, SuccessApiResponse},
        axum_extractor::{ValidatedCookieJar, ValidatedJson},
        error::Error,
        generate_openapi_response::generate_response,
        helper::cache_helper::{self},
    },
    http::{AppContext, Result},
};

pub fn router() -> ApiRouter<AppContext> {
    ApiRouter::new()
        .api_route(
            "/login",
            post_with(
                login_handler,
                generate_response(login_handler, "Auth", false),
            ),
        )
        .api_route(
            "/logout",
            post_with(
                logout_handler,
                generate_response(logout_handler, "Auth", true),
            ),
        )
}

#[axum::debug_handler]
async fn logout_handler(
    ValidatedCookieJar { nrp, .. }: ValidatedCookieJar,
    State(state): State<AppContext>,
) -> Result<SuccessApiResponse<String>> {
    let mut conn = cache_helper::get_conn(&state.redis_pool).await?;
    let headers = AppendHeaders(vec![
        (
            header::SET_COOKIE,
            "SESSION_ID=; HttpOnly; SameSite=Lax; Erpires=Thu, Jan 01 1970 00:00:00 UTC; Path=/"
                .to_owned(),
        ),
        (
            header::SET_COOKIE,
            "SESSION_DATA=; SameSite=Lax; Expires=Thu, Jan 01 1970 00:00:00 UTC; Path=/".to_owned(),
        ),
    ]);

    let keys = {
        let mut iter = conn
            .scan_match::<String, String>(format!("*{}*", nrp))
            .await?;

        let mut keys = Vec::new();
        while let Some(key) = iter.next_item().await {
            keys.push(key);
        }
        keys
    };

    for key in keys {
        let () = conn.del(key).await?;
    }

    Ok(SuccessApiResponse::new("Logout Success".to_owned()).with_headers(headers))
}

#[axum::debug_handler]
async fn login_handler(
    State(state): State<AppContext>,
    ValidatedJson(input): ValidatedJson<LoginRequest>,
) -> Result<SuccessApiResponse<LoginResponse>> {
    let res = login_cas(input, state.proxy_url).await?;

    let session_id = base64::engine::general_purpose::STANDARD.encode(
        serde_json::to_string(&ValidatedCookieJar {
            nrp: res.nrp.clone(),
            session_id: res.session_id.clone(),
        })
        .map_err(|e| anyhow!(e.to_string()))?,
    );

    let session_data = base64::engine::general_purpose::STANDARD.encode(
        serde_json::to_string(&SesssionData {
            year: res.year,
            semester: res.semester,
            week: res.week,
            user: res.user.clone(),
        })
        .map_err(|e| anyhow!(e.to_string()))?,
    );

    let headers = AppendHeaders(vec![
        (
            header::SET_COOKIE,
            format!("SESSION_ID={}; HttpOnly; SameSite=Lax; Path=/", session_id),
        ),
        (
            header::SET_COOKIE,
            format!("SESSION_DATA={}; SameSite=Lax; Path=/", session_data),
        ),
    ]);

    Ok(SuccessApiResponse::new(res).with_headers(headers))
}

async fn login_cas(
    LoginRequest { email, password }: LoginRequest,
    proxy_url: Option<String>,
) -> Result<LoginResponse> {
    let jar = Arc::new(reqwest::cookie::Jar::default());
    let custom_redirect = reqwest::redirect::Policy::custom(|attempt| {
        tracing::debug!("Redirecting to: {:?}", attempt.url().as_str());
        if attempt.previous().len() >= 3 {
            return attempt.stop();
        }
        attempt.follow()
    });
    let reqwest_builder = reqwest::ClientBuilder::new()
        .cookie_provider(Arc::clone(&jar))
        .redirect(custom_redirect);
    let client = match proxy_url {
        Some(url) => {
            tracing::debug!("Using proxy for login request: '{url}'");
            reqwest_builder.proxy(reqwest::Proxy::all(url)?).build()?
        }
        None => {
            tracing::debug!("Not using proxy for login request");
            reqwest_builder.build()?
        }
    };

    let res = client.get("https://login.pens.ac.id/cas/login?service=https%3A%2F%2Fonline.mis.pens.ac.id%2Findex.php%3FLogin%3D1%26halAwal%3D1").send().await?;

    let jsession_id = res
        .cookies()
        .find(|c| c.name() == "JSESSIONID")
        .ok_or_else(|| anyhow!("Cookie JSESSIONID not found"))?
        .value()
        .to_owned();

    let body = res.text().await?;

    let lt = {
        let doc = scraper::Html::parse_document(&body);
        let selector = scraper::Selector::parse("[name=lt]").map_err(|e| anyhow!(e.to_string()))?;

        doc.select(&selector)
            .next()
            .ok_or_else(|| anyhow!("Element lt not found"))?
            .value()
            .attr("value")
            .ok_or_else(|| anyhow!("Element lt not found"))?
            .to_owned()
    };

    let login = {
        let params = [
            ("username", email),
            ("password", password),
            ("_eventId", "submit".to_owned()),
            ("submit", "LOGIN".to_owned()),
            ("lt", lt),
        ];

        client.post("https://login.pens.ac.id/cas/login?service=https%3A%2F%2Fonline.mis.pens.ac.id%2Findex.php%3FLogin%3D1%26halAwal%3D1")
        .form(&params)
        .header("Cookie", format!("JSESSIONID={}", jsession_id))
        .send().await?
    };

    {
        let login_body = login.text().await?;
        let login_doc = scraper::Html::parse_document(&login_body);
        let selector = scraper::Selector::parse(".errors").map_err(|e| anyhow!(e.to_string()))?;

        match login_doc.select(&selector).next() {
            Some(e) => match e.inner_html().is_empty() {
                false => {
                    tracing::debug!(
                        "Bad Request from online mis with message: '{}'",
                        e.inner_html()
                    );
                    return Err(Error::BadRequest(e.inner_html().to_owned()));
                }
                _ => (),
            },
            _ => (),
        }
    };

    let session_id = {
        jar.cookies(
            &Url::from_str("https://online.mis.pens.ac.id")
                .map_err(|_| anyhow!("Failed to parse url"))?,
        )
        .ok_or_else(|| anyhow!("Failed to get cookies for `session_id`"))?
    };

    let home_doc = {
        let res = client
            .get("https://online.mis.pens.ac.id/mEntry_Logbook_KP1.php")
            .header("Cookie", session_id.clone())
            .send()
            .await?
            .text()
            .await?;

        scraper::Html::parse_document(&res)
    };

    let (year, semester, week): (u16, u8, u8) = {
        let re = regex::Regex::new(r"showEntry_Logbook_KP1\((.*?), (.*?), (.*?)\)")
            .map_err(|e| anyhow!(e))?;
        let selector = scraper::Selector::parse("body").map_err(|e| anyhow!(e.to_string()))?;
        let data = home_doc
            .select(&selector)
            .next()
            .ok_or_else(|| anyhow!("Body not found"))?
            .attr("onload")
            .ok_or_else(|| anyhow!("Body onload not found"))?;

        let regex_data = re
            .captures(data)
            .ok_or_else(|| anyhow!("Failed to capture year and semester data"))?;
        let year = regex_data
            .get(1)
            .ok_or_else(|| anyhow!("Failed to get year"))?
            .as_str();
        let semester = regex_data
            .get(2)
            .ok_or_else(|| anyhow!("Failed to get semester"))?
            .as_str();
        let week = regex_data
            .get(3)
            .ok_or_else(|| anyhow!("Failed to get week"))?
            .as_str();

        (
            year.parse().unwrap_or_default(),
            semester.parse().unwrap_or_default(),
            week.parse().unwrap_or_default(),
        )
    };

    let user_text = {
        let selector = scraper::Selector::parse(".userout:last-child a")
            .map_err(|e| anyhow!(e.to_string()))?;
        home_doc
            .select(&selector)
            .next()
            .ok_or_else(|| anyhow!("User not found"))?
            .text()
            .next()
            .ok_or_else(|| anyhow!("User text not found"))?
    };

    let nrp = {
        let re = regex::Regex::new(r"\(([^)]+)\)").map_err(|e| anyhow!(e))?;
        re.captures(user_text)
            .ok_or_else(|| anyhow!("Failed to get NRP"))?
            .get(1)
            .ok_or_else(|| anyhow!("Failed to get NRP"))?
            .as_str()
            .to_owned()
    };

    let user = {
        let re = regex::Regex::new(r"USER : (.*?)\s*\(").map_err(|e| anyhow!(e.to_string()))?;
        re.captures(user_text)
            .ok_or_else(|| anyhow!("Failed to get user"))?
            .get(1)
            .ok_or_else(|| anyhow!("Failed to get user"))?
            .as_str()
            .to_owned()
    };

    Ok(LoginResponse {
        nrp,
        year,
        week,
        semester,
        user,
        session_id: session_id
            .to_str()
            .unwrap_or_default()
            .split('=')
            .last()
            .unwrap_or_default()
            .to_owned(),
    })
}

#[derive(Debug, Serialize, JsonSchema, Default)]
#[serde(rename_all = "camelCase")]
struct LoginResponse {
    pub user: String,
    pub nrp: String,
    pub session_id: String,
    pub year: u16,
    pub semester: u8,
    pub week: u8,
}

#[derive(Debug, Serialize, JsonSchema, Default)]
#[serde(rename_all = "camelCase")]
struct SesssionData {
    pub year: u16,
    pub semester: u8,
    pub week: u8,
    pub user: String,
}

#[derive(Debug, Serialize, Deserialize, JsonSchema, Default)]
struct LoginRequest {
    #[schemars(
        email(message = "Invalid email"),
        required(message = "Email is required")
    )]
    pub email: String,
    #[schemars(length(min = 1), required(message = "Password is required"))]
    pub password: String,
}
