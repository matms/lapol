use serde::{Deserialize, Serialize};

#[derive(Copy, Clone, Debug, Serialize, Deserialize)]
#[serde(tag = "tok_t", content = "c")]
pub enum Token<'a> {
    Newline(&'a str),
    Text(&'a str),
    CommandStartMarker(&'a str),
    BlockCommentStartMarker(&'a str),
    LineCommentStartMarker(&'a str),
    CommandForceEndMarker(&'a str),
    OpenCurly(&'a str),
    CloseCurly(&'a str),
    OpenSquare(&'a str),
    CloseSquare(&'a str),
}
