use aide::axum::ApiRouter;

use super::AppContext;

mod absen;
mod frs;
mod jadwal_kuliah;
mod logbook_create;
mod logbook_delete;
mod logbook_detail;
mod nilai_semester;

const OPENAPI_TAG: &str = "Academic";

pub fn router() -> ApiRouter<AppContext> {
    ApiRouter::new().nest(
        "/academic",
        ApiRouter::new()
            .merge(absen::endpoint())
            .merge(frs::endpoint())
            .merge(jadwal_kuliah::endpoint())
            .merge(nilai_semester::endpoint())
            .merge(logbook_create::endpoint())
            .merge(logbook_delete::endpoint())
            .merge(logbook_detail::endpoint()),
    )
}
