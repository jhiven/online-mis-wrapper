use aide::axum::ApiRouter;

use super::AppContext;

mod academic;
mod auth;
mod others;
mod shared;

pub fn router() -> ApiRouter<AppContext> {
    ApiRouter::new()
        .merge(auth::router())
        .merge(academic::router())
        .merge(others::router())
}
