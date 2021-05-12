//! # LaPoL parse
//!
//! `lapol-parse-rs` implements the parsing of LaPoL code into an AST,
//! which can then be serialized and sent to JavaScript.

mod ast;
mod error;
mod parse;

pub use ast::AstNode;
pub use error::ParserError;
pub use parse::parse;
