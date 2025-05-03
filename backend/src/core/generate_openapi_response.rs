use aide::{
    axum::AxumOperationHandler, transform::TransformOperation, OperationInput, OperationOutput,
};
use axum::Json;
use schemars::JsonSchema;
use serde::Serialize;

use super::api_response::{ApiResponseTrait, ErrorApiResponseBody, ErrorValidationApiResponseBody};

pub fn generate_response<H, I, O, T, S, R>(
    _handler: H,
    tag: &str,
    with_security: bool,
) -> impl FnOnce(TransformOperation) -> TransformOperation
where
    H: AxumOperationHandler<I, O, T, S>,
    I: OperationInput,
    O: OperationOutput,
    O::Inner: JsonSchema + Serialize + ApiResponseTrait<R>,
    <O::Inner as ApiResponseTrait<R>>::Body: JsonSchema + Default + Serialize,
    S: Send + Sync + 'static,
    T: 'static,
    R: Serialize,
{
    let owned_tag = tag.to_owned();

    move |op: TransformOperation| {
        let doc = op
            .response_with::<200, Json<<O::Inner as ApiResponseTrait<R>>::Body>, _>(|res| {
                res.example(<<O::Inner as ApiResponseTrait<R>>::Body>::default())
                    .description("Success Response")
            })
            .response_with::<404, Json<ErrorApiResponseBody>, _>(|res| {
                res.example(ErrorApiResponseBody {
                    success: false,
                    message: "Not Found".to_owned(),
                })
                .description("Not Found")
            })
            .response_with::<400, Json<ErrorValidationApiResponseBody>, _>(|res| {
                res.example(ErrorValidationApiResponseBody {
                    success: false,
                    message: "Validation Error".to_owned(),
                    cause: vec![],
                })
                .description("Validation Error")
            })
            .tag(&owned_tag);

        if with_security {
            return doc.security_requirement("CookieSessionId");
        }

        doc
    }
}
