use nom::{
    branch::alt,
    bytes::complete::{is_a, is_not, tag},
    character::complete::{alpha1, alphanumeric1, anychar, multispace1, none_of},
    combinator::{opt, peek, recognize, value},
    error::ParseError,
    multi::many0,
    sequence::{pair, preceded, tuple},
    IResult,
};

use std::borrow::{Borrow, Cow};

#[derive(Debug)]
pub enum AstNode<'a> {
    AstRootNode {
        sub_nodes: Vec<AstNode<'a>>,
    },
    AstCommandNode {
        command_name: &'a str,
        square_arg: Option<Vec<AstNode<'a>>>,
        curly_args: Vec<Vec<AstNode<'a>>>,
    },
    AstTextNode {
        content: Cow<'a, str>,
        //source_start_col: usize,
        //source_start_line: usize,
    },
}

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

fn text<'a, E: ParseError<&'a str>>(
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
                |i| command(em, i),
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

fn curly_argument<'a, E: ParseError<&'a str>>(i: &'a str) -> IResult<&'a str, Vec<AstNode<'a>>, E> {
    let (rest, (_, em)) = generic_open_curly(i)?;
    let (rest, nodes) = text(false, &em, rest)?;
    let (rest, _) = tag(em.close.borrow())(rest)?;

    Ok((rest, nodes))
}

// From https://docs.rs/nom/6.1.2/nom/recipes/index.html#rust-style-identifiers
fn identifier<'a, E: ParseError<&'a str>>(i: &'a str) -> IResult<&'a str, &'a str, E> {
    recognize(pair(
        alt((alpha1, tag("_"))),
        many0(alt((alphanumeric1, tag("_")))),
    ))(i)
}

fn command<'a, E: ParseError<&'a str>>(
    em: &EscapeMatch,
    i: &'a str,
) -> IResult<&'a str, Option<AstNode<'a>>, E> {
    let o = tuple((
        //
        tag(em.escape.borrow()),
        tag("@"),
        // Make sure this isn't a comment or a malformed @{} form.
        peek(none_of("%|{")),
        // Command Name
        identifier,
        // TODO: Square args
        // One or more {}, ending in ;.
        // TODO: Accept interspersed comments.
        many0(preceded(
            // Whitespace with potential comments
            many0(alt((
                |i| value((), multispace1)(i),
                |i| value((), |i| comment(&DEFAULT_ESCAPE_MATCH, i))(i),
            ))),
            curly_argument,
        )),
        opt(preceded(
            // Whitespace with potential comments
            many0(alt((
                |i| value((), multispace1)(i),
                |i| value((), |i| comment(&DEFAULT_ESCAPE_MATCH, i))(i),
            ))),
            tag(";"),
        )),
    ))(i)?;

    // println!("{:?}:", o);

    let (rest, (_, _, _, command_name, curly_args, _)) = o;

    Ok((
        rest,
        Some(AstNode::AstCommandNode {
            command_name,
            square_arg: None,
            curly_args,
        }),
    ))
}

pub fn parse_root<'a, E: ParseError<&'a str>>(i: &'a str) -> IResult<&'a str, AstNode<'a>, E> {
    let (r, nodes) = text(true, &DEFAULT_ESCAPE_MATCH, i)?;
    assert!(r == ""); // We are at EOF.
    Ok((r, AstNode::AstRootNode { sub_nodes: nodes }))
}

pub fn parse<'a>(i: &'a str) -> Result<AstNode<'a>, ()> {
    /*
    println!("{}", get_matching_close_curly("{"));
    println!("{}", get_matching_close_curly("|{"));
    println!("{}", get_matching_close_curly("|<<[[((<{"));

    println!("{}", get_matching_escape("{"));
    println!("{}", get_matching_escape("|{"));
    println!("{}", get_matching_escape("|<<[[((<{"));
    */

    let out = parse_root::<nom::error::Error<&str>>(i);

    match out {
        Ok((_, root)) => Ok(root),
        Err(e) => {
            println!("Error: {:#?}", e);
            Err(())
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
