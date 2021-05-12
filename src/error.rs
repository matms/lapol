use thiserror::Error as TError;

#[derive(Debug, TError)]
pub enum ParserError {
    #[error(
        "LaPoL parser error --- Probably an issue with your LaPoL code --- Nom returned an error."
    )]
    NomError(String),
}
