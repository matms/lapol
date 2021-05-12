use nom::{
    branch::alt,
    bytes::complete::{is_a, is_not, tag, tag_no_case},
    character::complete::{alpha1, alphanumeric1, anychar, multispace1, none_of},
    combinator::{map, opt, peek, recognize, value, verify},
    error::ParseError,
    multi::{many0, separated_list0},
    number::complete::double,
    sequence::{delimited, pair, preceded, separated_pair, terminated, tuple},
    IResult,
};

use std::borrow::{Borrow, Cow};

use std::fmt::Debug;

use self::string::parse_string;

use super::ast::{AstNode, SquareArg, SquareEntry};

mod string;

struct EscapeMatch<'a> {
    open: Cow<'a, str>,
    close: Cow<'a, str>,
    escape: Cow<'a, str>,
}

const DEFAULT_ESCAPE_MATCH: EscapeMatch = EscapeMatch {
    open: Cow::Borrowed("{"),
    close: Cow::Borrowed("}"),
    escape: Cow::Borrowed(""),
};

const ALLOWED_ESCAPE_SYMBOLS: &'static str = "<([";

fn generic_open_curly<'a, E: ParseError<&'a str>>(
    i: &'a str,
) -> IResult<&'a str, (&'a str, EscapeMatch), E> {
    let (r, m) = recognize(pair(
        opt(pair(tag("|"), opt(is_a(ALLOWED_ESCAPE_SYMBOLS)))),
        tag("{"),
    ))(i)?;

    let em = EscapeMatch {
        open: Cow::Borrowed(m),
        close: get_matching_close_curly(m),
        escape: Cow::Borrowed(get_matching_escape(m)),
    };

    Ok((r, (m, em)))
}

fn escape_matching_char(open_char: char) -> char {
    match open_char {
        '<' => '>',
        '(' => ')',
        '[' => ']',
        _ => panic!("Bad escape matching char: {}", open_char),
    }
}

fn get_matching_close_curly(open_curly_form: &str) -> Cow<str> {
    let mut ocf = open_curly_form.chars();
    let n = ocf
        .next()
        .expect("get_matching_close_curly --- open_curly_form mustn't be empty");
    if n == '|' {
        let mut s = String::with_capacity(open_curly_form.len());
        assert!(
            ocf.next_back()
                .expect("get_matching_close_curly --- open_curly_form must end in open curly")
                == '{'
        );
        s.push('}');

        for c in ocf.rev() {
            s.push(escape_matching_char(c))
        }

        s.push('|');
        Cow::Owned(s)
    } else if n == '{' {
        Cow::Borrowed("}")
    } else {
        unreachable!("Bad open_curly_form start")
    }
}

fn get_matching_escape(open_curly_form: &str) -> &str {
    let (i, l) = open_curly_form
        .char_indices()
        .next_back()
        .expect(&format!("Bad open_curly_form {}", open_curly_form));
    debug_assert!(l == '{');
    open_curly_form.split_at(i).0
}

/// Optimization: Instead of taking chars one by one, forming Text nodes with
/// a single char, and merging them afterwards, we instead try to form the
/// longest possible text node that we can ensure is DEFINITELY not something
/// else.
fn generic_text<'a, E: ParseError<&'a str>>(
    i: &'a str,
) -> IResult<&'a str, Option<AstNode<'a>>, E> {
    let (rest, (_c, _s)) = pair(
        // Take any character, then take as many as you can after that
        anychar,
        // This opt is very important!
        opt(is_not("\r\n@%|{}")),
    )(i)?;

    let split = unsafe { rest.as_ptr().offset_from(i.as_ptr()) };
    let (matched, remaining) = i.split_at(split as usize);

    debug_assert_eq!(remaining, rest);

    Ok((
        rest,
        Some(AstNode::AstTextNode {
            content: Cow::Borrowed(matched),
        }),
    ))
}

fn text<'a, E: ParseError<&'a str> + Debug>(
    root_context: bool,
    em: &EscapeMatch,
    i: &'a str,
) -> IResult<&'a str, Vec<AstNode<'a>>, E> {
    let open_brace = em.open.borrow();
    let close_brace = em.close.borrow();

    let rec_open = tag::<&str, &str, ()>(open_brace);
    let rec_close = tag::<&str, &str, ()>(close_brace);

    // Start at one because of preceding
    // open brace that this doesn't match.
    // At root context, this is a 'pretend' open brace.
    let mut brace_balance = 1;

    let mut rest = i;

    let mut contents = Vec::new();

    // Merge Adjacent Text Nodes (except if either is a newline node).
    let mut add_to_contents = |node| match contents.last_mut() {
        Some(AstNode::AstTextNode {
            content: last_content,
            ..
        }) if last_content != "\n" => match node {
            AstNode::AstTextNode {
                content: new_content,
                ..
            } if new_content != "\n" => last_content.to_mut().push_str(&new_content),
            _ => contents.push(node),
        },
        _ => contents.push(node),
    };

    loop {
        if let Ok((r, t)) = rec_open(rest) {
            brace_balance += 1;
            rest = r;
            add_to_contents(AstNode::AstTextNode {
                content: Cow::Borrowed(t),
            });
        } else if let Ok((r, t)) = rec_close(rest) {
            brace_balance -= 1;
            if brace_balance <= 0 {
                break;
            } else {
                rest = r;
                add_to_contents(AstNode::AstTextNode {
                    content: Cow::Borrowed(t),
                });
            }
        } else {
            // Handle EOF
            if rest == "" {
                break;
            }

            let (r, o) = alt((
                // Order matters!
                one_newline,
                |i| comment(em, i),
                map(|i| command(em, i), |v| Some(v)),
                generic_text,
            ))(rest)?;

            rest = r;
            if let Some(n) = o {
                add_to_contents(n);
            }
        }
    }

    debug_assert!(
        // If not root, we broke due to brace balance becoming 0.
        !root_context && brace_balance == 0
        // If root, we should parse until EOF, and ensure braces are balanced.
            || root_context && brace_balance == 1 && rest.len() == 0
    );

    Ok((rest, contents))
}

fn block_comment_text<'a, E: ParseError<&'a str>>(
    em: &EscapeMatch,
    i: &'a str,
) -> IResult<&'a str, (), E> {
    let open_brace = em.open.borrow();
    let close_brace = em.close.borrow();

    let rec_open = tag::<&str, &str, ()>(open_brace);
    let rec_close = tag::<&str, &str, ()>(close_brace);

    // Start at one because of preceding
    // open brace that this doesn't match.
    let mut brace_balance = 1;

    let mut rest = i;

    loop {
        if let Ok((r, _)) = rec_open(rest) {
            brace_balance += 1;
            rest = r;
        } else if let Ok((r, _)) = rec_close(rest) {
            brace_balance -= 1;
            if brace_balance <= 0 {
                break;
            } else {
                rest = r;
            }
        } else {
            rest = anychar(rest)?.0;
            // EOF should be propagated as error.
        }
    }

    debug_assert!(brace_balance == 0);

    Ok((rest, ()))
}

fn block_comment<'a, E: ParseError<&'a str>>(
    em: &EscapeMatch,
    i: &'a str,
) -> IResult<&'a str, Option<AstNode<'a>>, E> {
    let (rest, _) = tag(em.escape.borrow())(i)?;
    let (rest, _) = tag("@%")(rest)?;
    let (rest, (_, em)) = generic_open_curly(rest)?;
    let (rest, _) = block_comment_text(&em, rest)?;
    let (rest, _) = tag(em.close.borrow())(rest)?;

    Ok((rest, None))
}

/// Assuming block comment didn't match.
fn line_comment<'a, E: ParseError<&'a str>>(
    em: &EscapeMatch,
    i: &'a str,
) -> IResult<&'a str, Option<AstNode<'a>>, E> {
    let (r, _) = tuple((
        //
        tag(em.escape.borrow()),
        tag("@%"),
        peek(none_of("|{")),
        is_not("\n"),
        tag("\n"), // TODO: Does this break eof?
    ))(i)?;

    Ok((r, None))
}

fn comment<'a, E: ParseError<&'a str>>(
    em: &EscapeMatch,
    i: &'a str,
) -> IResult<&'a str, Option<AstNode<'a>>, E> {
    alt((|i| block_comment(em, i), |i| line_comment(em, i)))(i)
}

fn one_newline<'a, E: ParseError<&'a str>>(i: &'a str) -> IResult<&'a str, Option<AstNode>, E> {
    let (r, m) = alt((preceded(tag("\r"), tag("\n")), tag("\n")))(i)?;
    Ok((
        r,
        Some(AstNode::AstTextNode {
            content: Cow::Borrowed(m),
        }),
    ))
}

fn comma_sep<'a, E: ParseError<&'a str>>(i: &'a str) -> IResult<&'a str, (), E> {
    value((), delimited(opt(multispace1), tag(","), opt(multispace1)))(i)
}

fn square_entry<'a, E: ParseError<&'a str> + Debug>(
    i: &'a str,
) -> IResult<&'a str, SquareEntry, E> {
    delimited(
        opt(multispace1),
        alt((
            map(bool, |b| SquareEntry::Bool(b)),
            map(double, |n| SquareEntry::Num(n)),
            map(identifier, |s| SquareEntry::IdentStr(s)),
            map(parse_string, |s| SquareEntry::QuotedStr(s)),
            map(
                |i| command(&DEFAULT_ESCAPE_MATCH, i),
                |c| SquareEntry::AstNode(c),
            ),
        )),
        opt(multispace1),
    )(i)
}

fn square_arg<'a, E: ParseError<&'a str> + Debug>(i: &'a str) -> IResult<&'a str, SquareArg, E> {
    alt((
        //
        map(
            separated_pair(
                //
                square_entry,
                delimited(opt(multispace1), tag("="), opt(multispace1)),
                square_entry,
            ),
            |p| SquareArg::KeyVal(p.0, p.1),
        ),
        map(square_entry, |e| SquareArg::Val(e)),
    ))(i)
}

fn square_args<'a, E: ParseError<&'a str> + Debug>(
    i: &'a str,
) -> IResult<&'a str, Vec<SquareArg<'a>>, E> {
    terminated(separated_list0(comma_sep, square_arg), opt(comma_sep))(i)
}

fn curly_argument<'a, E: ParseError<&'a str> + Debug>(
    i: &'a str,
) -> IResult<&'a str, Vec<AstNode<'a>>, E> {
    let (rest, (_, em)) = generic_open_curly(i)?;
    let (rest, nodes) = text(false, &em, rest)?;
    let (rest, _) = tag(em.close.borrow())(rest)?;

    Ok((rest, nodes))
}

/// TODO: Reserve what is needed!
fn is_reserved_identifier(candidate: &str) -> bool {
    candidate.eq_ignore_ascii_case("true")
        || candidate.eq_ignore_ascii_case("false")
        || candidate.eq_ignore_ascii_case("undefined") // TODO: handle
        || candidate.eq_ignore_ascii_case("null") // TODO: handle
}

// TODO: Allow . and :: syntax where appropriate.
// Adapted From https://docs.rs/nom/6.1.2/nom/recipes/index.html#rust-style-identifiers
fn identifier<'a, E: ParseError<&'a str>>(i: &'a str) -> IResult<&'a str, &'a str, E> {
    verify(
        recognize(pair(
            alt((alpha1, tag("_"))),
            many0(alt((alphanumeric1, tag("_")))),
        )),
        |s: &str| s.is_ascii() && !is_reserved_identifier(s),
    )(i)
    /*take_while1(|c: char| {
        // TODO: Expand?
        c.is_ascii_alphanumeric() || c == '_'
    })(i)*/
}

fn bool<'a, E: ParseError<&'a str>>(i: &'a str) -> IResult<&'a str, bool, E> {
    alt((
        value(true, tag_no_case("true")),
        value(false, tag_no_case("false")),
    ))(i)
}

fn command<'a, E: ParseError<&'a str> + Debug>(
    em: &EscapeMatch,
    i: &'a str,
) -> IResult<&'a str, AstNode<'a>, E> {
    let (rest, _) = tag(em.escape.borrow())(i)?;
    let (rest, _) = tag("@")(rest)?;
    let (rest, _) = peek(none_of("%|{"))(rest)?;
    // We can't just use ? because if a command fails to match, we don't
    // want the command getting treated as some arbitrary text, we WANT a panic.
    let (rest, o) = command_contents::<E>(rest).expect(
        "Malformed command --- once the command syntax @ matches, a command being malformed is an error."
    );
    return Ok((rest, o));
}

fn command_contents<'a, E: ParseError<&'a str> + Debug>(
    i: &'a str,
) -> IResult<&'a str, AstNode<'a>, E> {
    let (rest, command_name) = identifier(i)?;

    let (rest, end_here_opt) = opt(preceded(
        // Whitespace with potential comments
        many0(alt((
            |i| value((), multispace1)(i),
            |i| value((), |i| comment(&DEFAULT_ESCAPE_MATCH, i))(i),
        ))),
        tag(";"),
    ))(rest)?;

    if end_here_opt.is_some() {
        return Ok((
            rest,
            AstNode::AstCommandNode {
                command_name,
                square_args: None,
                curly_args: Vec::new(),
            },
        ));
    }

    let (rest, attempted_square_arg) = opt(preceded(
        // Whitespace w/ potential comments
        many0(alt((
            |i| value((), multispace1)(i),
            |i| value((), |i| comment(&DEFAULT_ESCAPE_MATCH, i))(i),
        ))),
        tag("["),
    ))(rest)?;

    let (rest, square_args) = if attempted_square_arg.is_some() {
        let (rest, square_args) = square_args(rest)?;
        let (rest, _) = tag("]")(rest)?;
        (rest, Some(square_args))
    } else {
        (rest, None)
    };

    let (rest, end_here_opt) = opt(preceded(
        // Whitespace with potential comments
        many0(alt((
            |i| value((), multispace1)(i),
            |i| value((), |i| comment(&DEFAULT_ESCAPE_MATCH, i))(i),
        ))),
        tag(";"),
    ))(rest)?;

    if end_here_opt.is_some() {
        return Ok((
            rest,
            AstNode::AstCommandNode {
                command_name,
                square_args,
                curly_args: Vec::new(),
            },
        ));
    }

    let (rest, curly_args) = many0(preceded(
        // Whitespace with potential comments
        many0(alt((
            |i| value((), multispace1)(i),
            |i| value((), |i| comment(&DEFAULT_ESCAPE_MATCH, i))(i),
        ))),
        curly_argument,
    ))(rest)?;

    let (rest, _) = opt(preceded(
        // Whitespace with potential comments
        many0(alt((
            |i| value((), multispace1)(i),
            |i| value((), |i| comment(&DEFAULT_ESCAPE_MATCH, i))(i),
        ))),
        tag(";"),
    ))(rest)?;

    Ok((
        rest,
        AstNode::AstCommandNode {
            command_name,
            square_args,
            curly_args,
        },
    ))

    // println!("{:?}:", o);

    //let (rest, (_, _, _, command_name, square_args, curly_args, _)) = o;
    /*
    Ok((
        rest,
        AstNode::AstCommandNode {
            command_name,
            square_args,
            curly_args,
        },
    )) */
}

fn parse_root<'a, E: ParseError<&'a str> + Debug>(i: &'a str) -> IResult<&'a str, AstNode<'a>, E> {
    let (r, nodes) = text(true, &DEFAULT_ESCAPE_MATCH, i)?;
    assert!(r == ""); // We are at EOF.
    Ok((r, AstNode::AstRootNode { sub_nodes: nodes }))
}

/// Takes in a reference to a string containing the input LaPoL code,
/// returns an AST (See `AstNode`).
///
/// TODO: Support configurable use of Nom VerboseError (by default it is
/// too slow)
pub fn parse<'a>(i: &'a str) -> Result<AstNode<'a>, super::error::ParserError> {
    let out = parse_root::<nom::error::Error<&str>>(i);

    match out {
        Ok((_, root)) => Ok(root),
        Err(e) => {
            println!("Nom Error: {:#?}", e);
            Err(super::error::ParserError::NomError(format!(
                "Nom error: {:#?}",
                e
            )))
        }
    }

    // Unfortunately, verbose error has significant performance downside!

    /*
    let out = parse_root::<VerboseError<&str>>(i);

    match out {
        Ok((_, root)) => Ok(root),
        Err(nom::Err::Error(e)) | Err(nom::Err::Failure(e)) => {
            println!("Error:\n{}", convert_error(i, e));
            Err(()) // TODO: Custom error?
        }
        _ => unreachable!("???"),
    }
    */
}
