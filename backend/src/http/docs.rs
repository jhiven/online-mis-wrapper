use std::sync::Arc;

use aide::{
    axum::{
        routing::{get, get_with},
        ApiRouter, IntoApiResponse,
    },
    openapi::{OpenApi, Tag},
    scalar::Scalar,
    transform::TransformOpenApi,
};
use axum::{response::IntoResponse, Extension, Json};

pub fn api_docs(api: TransformOpenApi) -> TransformOpenApi {
    api.title("Online Mis Wrapper Open API")
        .summary("Online Mis Wrapper Backend API")
        .tag(Tag {
            name: "Legain".into(),
            description: Some("Legain: Dimana Toilet".into()),
            ..Default::default()
        })
        .security_scheme(
            "CookieSessionId",
            aide::openapi::SecurityScheme::ApiKey {
                location: aide::openapi::ApiKeyLocation::Cookie,
                name: "SESSION_ID".to_string(),
                description: Some("This API uses a cookie-based authentication mechanism. The client must send the `SESSION_ID` cookie in each request.".to_string()),
                extensions: Default::default(),
            },
        )
}

pub fn docs_routes() -> ApiRouter {
    // We infer the return types for these routes
    // as an example.
    //
    // As a result, the `serve_redoc` route will
    // have the `text/html` content-type correctly set
    // with a 200 status.
    aide::generate::infer_responses(true);

    let router: ApiRouter = ApiRouter::new()
        .route(
            "/",
            get_with(
                Scalar::new("/docs/private/api.json")
                    .with_title("Online Mis Wrapper API docs")
                    .axum_handler(),
                |op| op.description("This documentation page."),
            ),
        )
        .route("/private/api.json", get(serve_docs));

    // Afterwards we disable response inference because
    // it might be incorrect for other routes.
    aide::generate::infer_responses(false);

    router
}

async fn serve_docs(Extension(api): Extension<Arc<OpenApi>>) -> impl IntoApiResponse {
    Json(&*api).into_response()
}
