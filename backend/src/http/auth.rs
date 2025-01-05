use anyhow::anyhow;
use axum::{
    extract::State,
    http::{header, StatusCode},
    response::{AppendHeaders, IntoResponse, Response},
    routing::post,
    Router,
};
use axum_extra::extract::CookieJar;
use redis::AsyncCommands;
use reqwest::{cookie::CookieStore, Url};
use std::{str::FromStr, sync::Arc, u8};
use validator::Validate;

use crate::http::{
    error::Error,
    helper::cache_helper::{self, cache_set},
    success::SuccessResponse,
    validator::{validate_cookies, ValidatedJson},
    AppContext, Result,
};

pub fn router() -> Router<AppContext> {
    Router::new()
        .route("/login", post(login_handler))
        .route("/logout", post(logout_handler))
}

#[axum::debug_handler]
async fn logout_handler(jar: CookieJar, State(state): State<AppContext>) -> Result<Response> {
    let (_, nrp) = validate_cookies(&jar)?;
    let mut conn = cache_helper::get_conn(&state.redis_pool).await?;
    let headers = AppendHeaders([
        (
            header::SET_COOKIE,
            "PHPSESSID=; HttpOnly; Expires=Thu, Jan 01 1970 00:00:00 UTC",
        ),
        (
            header::SET_COOKIE,
            "nrp=; HttpOnly; Expires=Thu, Jan 01 1970 00:00:00 UTC",
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

    Ok((headers, StatusCode::NO_CONTENT).into_response())
}

#[axum::debug_handler]
async fn login_handler(
    State(state): State<AppContext>,
    ValidatedJson(input): ValidatedJson<LoginRequest>,
) -> Result<Response> {
    let res = login_cas(input).await?;
    let headers = AppendHeaders([
        (
            header::SET_COOKIE,
            format!("PHPSESSID={}; HttpOnly", res.session_id),
        ),
        (header::SET_COOKIE, format!("nrp={}; HttpOnly", res.nrp)),
    ]);
    let mut conn = state
        .redis_pool
        .get()
        .await
        .map_err(|e| anyhow!(e.to_string()))?;

    cache_set(format!("session:{}", res.nrp), true, &mut *conn).await?;

    Ok((
        headers,
        SuccessResponse {
            data: res,
            status: StatusCode::OK,
        },
    )
        .into_response())
}

async fn login_cas(LoginRequest { email, password }: LoginRequest) -> Result<LoginResponse> {
    let jar = Arc::new(reqwest::cookie::Jar::default());
    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::custom(|attempt| {
            tracing::debug!("Redirecting to: {:?}", attempt.url().as_str());
            if attempt.previous().len() >= 3 {
                return attempt.stop();
            }
            attempt.follow()
        }))
        .cookie_provider(Arc::clone(&jar))
        .build()?;

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
            ("username", email.unwrap_or_default()),
            ("password", password.unwrap_or_default()),
            ("_eventId", "submit".to_owned()),
            ("submit", "LOGIN".to_owned()),
            ("lt", lt),
        ];

        client.post("https://login.pens.ac.id/cas/login?service=https%3A%2F%2Fonline.mis.pens.ac.id%2Findex.php%3FLogin%3D1%26halAwal%3D1")
        .form(&params)
        .header("Cookie", format!("JSESSIONID={}", jsession_id))
        .send().await?
    };

    let session_id = {
        jar.cookies(
            &Url::from_str("https://online.mis.pens.ac.id")
                .map_err(|_| anyhow!("Failed to parse url"))?,
        )
        .ok_or_else(|| anyhow!("Failed to get cookies"))?
    };

    {
        let login_body = login.text().await?;
        let login_doc = scraper::Html::parse_document(&login_body);
        let selector = scraper::Selector::parse(".errors").map_err(|e| anyhow!(e.to_string()))?;

        match login_doc.select(&selector).next() {
            Some(e) => match e.inner_html().is_empty() {
                false => {
                    tracing::debug!("Failed to authorized: {}", e.inner_html());
                    return Err(Error::Unauthorized(e.inner_html().to_owned()));
                }
                _ => (),
            },
            _ => (),
        }
    };

    let home_doc = {
        let res = client
            .get("https://online.mis.pens.ac.id/mFRS_mbkm.php")
            .header("Cookie", session_id.clone())
            .send()
            .await?
            .text()
            .await?;

        scraper::Html::parse_document(&res)
    };

    let (year, semester): (u16, u8) = {
        let re = regex::Regex::new(r"showDataFRS_mbkm\((.*?), (.*?)\)").map_err(|e| anyhow!(e))?;
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
            .as_str()
            .to_owned();
        let semester = regex_data
            .get(2)
            .ok_or_else(|| anyhow!("Failed to get semester"))?
            .as_str()
            .to_owned();

        (
            year.parse().unwrap_or_default(),
            semester.parse().unwrap_or_default(),
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

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct LoginResponse {
    pub user: String,
    pub nrp: String,
    pub session_id: String,
    pub year: u16,
    pub semester: u8,
}

#[derive(Debug, serde::Deserialize, Validate)]
struct LoginRequest {
    #[validate(
        email(message = "Invalid email"),
        required(message = "Email is required")
    )]
    pub email: Option<String>,
    #[validate(
        length(min = 1, message = "Password can not be empty"),
        required(message = "Password is required")
    )]
    pub password: Option<String>,
}
