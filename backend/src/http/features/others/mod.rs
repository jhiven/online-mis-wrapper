mod check_ip;
mod invalidate_cache;

use aide::axum::ApiRouter;

use super::AppContext;

const OPENAPI_TAG: &str = "Others";

pub fn router() -> ApiRouter<AppContext> {
    ApiRouter::new().merge(invalidate_cache::endpoint())
}
