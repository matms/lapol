use std::{error::Error, iter::Peekable, str::CharIndices};

use thiserror::Error as TError;

#[derive(Debug, TError)]
pub enum TokenizerError {
    #[error("Unexpected end of iterator (likely EOF) after special_char (likely '◊')")]
    EndAfterSpecialChar,
    #[error(
        "Carriage return ('\\r') followed by anything that isn't newline ('\\n') is an error."
    )]
    BadCarrageReturn,
}

pub struct TokenizerCfg {
    newline_char: char,
    special_char: char,
    comment_marker_char: char,
    open_curly_char: char,
    close_curly_char: char,
    open_square_char: char,
    close_square_char: char,
    special_brace_char: char,
    command_force_end_char: char,
}

const DEFAULT_TOKENIZER_CFG: TokenizerCfg = TokenizerCfg {
    newline_char: '\n',
    special_char: '◊',
    open_curly_char: '{',
    close_curly_char: '}',
    open_square_char: '[',
    close_square_char: ']',
    comment_marker_char: '%',
    command_force_end_char: ';',
    special_brace_char: '|',
};

pub struct Tokenizer<'a> {
    valid: bool,
    text: &'a str,
    char_iter: Peekable<CharIndices<'a>>,
    curr_idx: usize,
    tok_cfg: TokenizerCfg,
}

#[derive(Copy, Clone, Debug)]
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

impl<'a> Tokenizer<'a> {
    /// Create a new tokenizer with input text `input` and configuration `tokenizer_cfg`.
    ///
    /// If `tokenizer_cfg` is None,
    /// uses the default settings.
    pub fn new(input: &'a str, tokenizer_cfg: Option<TokenizerCfg>) -> Self {
        Self {
            valid: true,
            text: input,
            char_iter: input.char_indices().peekable(),
            curr_idx: 0,
            tok_cfg: if let Some(x) = tokenizer_cfg {
                x
            } else {
                DEFAULT_TOKENIZER_CFG
            },
        }
    }

    /// Takes in the idx of the current character (as returned by char_indices), returns the
    /// EXCLUSIVE ending index corresponding to it (i.e., the start of the next character or
    /// the length of self.text, if there is no next character).
    ///
    /// CAUTION: Do not pass in an idx not corresponding to the current char, i.e. you MUST pass
    /// in the idx returned by the most recent invocation of self.char_iter.next();
    fn curr_char_end(&mut self, idx: usize) -> usize {
        debug_assert!(self.text.is_char_boundary(idx));

        if let Some((x, _)) = self.char_iter.peek() {
            x.clone()
        } else {
            self.text.len()
        }
    }

    fn is_interesting_char(&self, c: char) -> bool {
        return c == '\r'
            || c == self.tok_cfg.newline_char
            || c == self.tok_cfg.special_char
            || c == self.tok_cfg.comment_marker_char
            || c == self.tok_cfg.open_curly_char
            || c == self.tok_cfg.close_curly_char
            || c == self.tok_cfg.special_brace_char
            || c == self.tok_cfg.open_square_char
            || c == self.tok_cfg.close_square_char
            || c == self.tok_cfg.command_force_end_char;
    }
}

impl<'a> Iterator for Tokenizer<'a> {
    type Item = Result<Token<'a>, TokenizerError>;

    fn next(&mut self) -> Option<Self::Item> {
        // After error, return None always.
        if !self.valid {
            return None;
        }

        let curr_char_or_none = self.char_iter.next();
        let out = if let Some((idx, c)) = curr_char_or_none {
            if self.is_interesting_char(c) {
                let char_str_slice = self.text.get(idx..self.curr_char_end(idx))?;

                if c == '\r' {
                    if let Some((next_idx, next_char)) = self.char_iter.next() {
                        if next_char == self.tok_cfg.newline_char {
                            Token::Newline(self.text.get(next_idx..self.curr_char_end(next_idx))?)
                        } else {
                            return Some(Err(TokenizerError::BadCarrageReturn));
                        }
                    } else {
                        return Some(Err(TokenizerError::BadCarrageReturn));
                    }
                } else if c == self.tok_cfg.newline_char {
                    Token::Newline(char_str_slice)
                } else if c == self.tok_cfg.special_char {
                    if let Some((next_idx, next_char)) = self.char_iter.next() {
                        if next_char == self.tok_cfg.comment_marker_char {
                            // TODO: Handle line comment vs block comment
                            // TODO: Also, later, allow block comments to work with brace escape syntax.
                            todo!()
                        } else {
                            Token::CommandStartMarker(char_str_slice)
                        }
                    } else {
                        return Some(Err(TokenizerError::EndAfterSpecialChar));
                    }
                } else if c == self.tok_cfg.special_brace_char {
                    // TODO: Special Brace handling.
                    todo!()
                } else if c == self.tok_cfg.open_curly_char {
                    Token::OpenCurly(char_str_slice)
                } else if c == self.tok_cfg.close_curly_char {
                    Token::CloseCurly(char_str_slice)
                } else if c == self.tok_cfg.open_square_char {
                    Token::OpenSquare(char_str_slice)
                } else if c == self.tok_cfg.close_square_char {
                    Token::CloseSquare(char_str_slice)
                } else if c == self.tok_cfg.command_force_end_char {
                    Token::CommandForceEndMarker(char_str_slice)
                } else {
                    unreachable!()
                }
            } else {
                loop {
                    let p = self.char_iter.peek();
                    match p {
                        None => break,
                        Some(&(_, c)) => {
                            if self.is_interesting_char(c) {
                                break;
                            }
                        }
                    }
                    self.char_iter.next();
                }
                let char_str_slice = self.text.get(idx..self.curr_char_end(idx))?;
                Token::Text(char_str_slice)
            }
        } else {
            return None;
        };

        Some(Ok(out))
    }
}
