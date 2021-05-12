//! TODO: String parsing.

use nom::{
    character::complete::char, combinator::peek, error::ParseError, sequence::preceded, IResult,
};

mod parse_str {
    //! From Nom [Examples](https://github.com/Geal/nom/blob/master/examples/string.rs)
    include!("../../deps/nom_string.rs");
}

fn parse_string_unwrapped<'a, E: ParseError<&'a str>>(i: &'a str) -> IResult<&'a str, String, E> {
    Ok(parse_str::parse_string::<nom::error::Error<&str>>(i).expect("String Parsing Error"))
}

pub fn parse_string<'a, E: ParseError<&'a str>>(i: &'a str) -> IResult<&'a str, String, E> {
    preceded(peek(char('"')), parse_string_unwrapped)(i)
}
