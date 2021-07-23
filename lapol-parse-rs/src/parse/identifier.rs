use std::borrow::Borrow;

use nom::{
    branch::alt,
    bytes::complete::tag,
    character::complete::{alpha1, alphanumeric1},
    combinator::{recognize, verify},
    error::ParseError,
    multi::many0,
    sequence::pair,
    IResult,
};

use super::Span;

/// TODO: Reserve what is needed!
fn is_reserved_identifier(candidate: &str) -> bool {
    candidate.eq_ignore_ascii_case("true")
        || candidate.eq_ignore_ascii_case("false")
        || candidate.eq_ignore_ascii_case("undefined") // TODO: handle
        || candidate.eq_ignore_ascii_case("null") // TODO: handle
}

// TODO: Allow . and :: syntax where appropriate.
// Adapted From https://docs.rs/nom/6.1.2/nom/recipes/index.html#rust-style-identifiers
pub(super) fn identifier<'a, E: ParseError<Span<'a>>>(
    i: Span<'a>,
) -> IResult<Span<'a>, Span<'a>, E> {
    verify(
        recognize(pair(
            alt((alpha1, tag("_"))),
            many0(alt((alphanumeric1, tag("_")))),
        )),
        |s: &Span| s.is_ascii() && !is_reserved_identifier(s.borrow()),
    )(i)
    /*take_while1(|c: char| {
        // TODO: Expand?
        c.is_ascii_alphanumeric() || c == '_'
    })(i)*/
}
