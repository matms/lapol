//! TODO: String parsing.

use nom::{
    character::complete::char, combinator::peek, error::ParseError, sequence::preceded, IResult,
};

use super::Span;

mod parse_str {
    //! From Nom [Examples](https://github.com/Geal/nom/blob/master/examples/string.rs)
    include!("../../deps/nom_string.rs");
}

fn parse_string_unwrapped<'a, E: ParseError<Span<'a>>>(
    i: Span<'a>,
) -> IResult<Span<'a>, String, E> {
    Ok(parse_str::parse_string::<nom::error::Error<Span>>(i).expect("String Parsing Error"))
}

pub fn parse_string<'a, E: ParseError<Span<'a>>>(i: Span<'a>) -> IResult<Span<'a>, String, E> {
    preceded(peek(char('"')), parse_string_unwrapped)(i)
}
