use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, JsonSchema, Default)]
pub struct YearSemesterRequest {
    #[schemars(range(min = 1988))]
    pub year: u16,
    #[schemars(range(min = 1))]
    pub semester: u8,
}
