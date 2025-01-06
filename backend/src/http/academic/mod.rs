use axum::Router;

use super::AppContext;

mod absen;
mod frs;
mod jadwal_kuliah;
mod nilai_semester;

pub fn router() -> Router<AppContext> {
    Router::new().nest(
        "/academic",
        Router::new()
            .merge(absen::router())
            .merge(frs::router())
            .merge(jadwal_kuliah::router())
            .merge(nilai_semester::router()),
    )
}
