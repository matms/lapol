use serde::{Deserialize, Serialize};
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
    special_char: '◊',
    open_curly_char: '{',
    close_curly_char: '}',
    open_square_char: '[',
    close_square_char: ']',
    comment_marker_char: '%',
    command_force_end_char: ';',
    special_brace_char: '|',
};

pub enum TokenizerContext {
    // TODO: special brace support.
    Text,
    // LineComment,
    // BlockComment,
    // CommandName,
    // CommandSquareArg,
    // Note that curly args are just text.
}

pub struct Tokenizer<'a> {
    ctx_stack: Vec<TokenizerContext>,
    valid: bool,
    text: &'a str,
    char_iter: Peekable<CharIndices<'a>>,
    curr_line: usize,
    curr_col: usize,
    tok_cfg: TokenizerCfg,
}

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

impl<'a> Tokenizer<'a> {
    /// Create a new tokenizer with input text `input` and configuration `tokenizer_cfg`.
    ///
    /// If `tokenizer_cfg` is None,
    /// uses the default settings.
    pub fn new(input: &'a str, tokenizer_cfg: Option<TokenizerCfg>) -> Self {
        Self {
            ctx_stack: Vec::new(),
            valid: true,
            text: input,
            char_iter: input.char_indices().peekable(),
            curr_line: 1,
            curr_col: 1,
            tok_cfg: if let Some(x) = tokenizer_cfg {
                x
            } else {
                DEFAULT_TOKENIZER_CFG
            },
        }
    }

    pub fn push_context(&mut self, ctx: TokenizerContext) {
        self.ctx_stack.push(ctx);
    }

    pub fn pop_context(&mut self) -> Option<TokenizerContext> {
        self.ctx_stack.pop()
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
        match self.ctx_stack.last() {
            None => panic!("Empty Tokenizer Context Stack --- likely an issue with the parser"),
            Some(TokenizerContext::Text) => {
                return c == '\r'
                    || c == '\n'
                    || c == self.tok_cfg.special_char
                    || c == self.tok_cfg.comment_marker_char
                    || c == self.tok_cfg.open_curly_char
                    || c == self.tok_cfg.close_curly_char
                    || c == self.tok_cfg.special_brace_char; // TODO maybe remove this last one
            }
        }
        return c == '\r'
            || c == '\n'
            || c == self.tok_cfg.special_char
            || c == self.tok_cfg.comment_marker_char
            || c == self.tok_cfg.open_curly_char
            || c == self.tok_cfg.close_curly_char
            || c == self.tok_cfg.special_brace_char
            || c == self.tok_cfg.open_square_char
            || c == self.tok_cfg.close_square_char
            || c == self.tok_cfg.command_force_end_char;
    }

    /// You should call this instead of char_iter.next(), as this also updates the current column
    /// and line numbers. If you call char_iter.next() directly, the line / col numbers will
    /// become incorrect.
    fn char_it_next(&mut self) -> Option<(usize, char)> {
        let opt = self.char_iter.next();
        if let Some((_, c)) = opt {
            if c == '\n' {
                self.curr_col = 1;
                self.curr_line += 1;
            } else {
                self.curr_col += 1
            }
        }
        opt
    }

    /// Return the line (starting the count at 1) and column numbers, respectively,
    /// of the start of the token that will be returned next (not the last returned token!).
    pub fn cursor_pos(&self) -> (usize, usize) {
        (self.curr_line, self.curr_col)
    }
}

impl<'a> Iterator for Tokenizer<'a> {
    type Item = Result<Token<'a>, TokenizerError>;

    fn next(&mut self) -> Option<Self::Item> {
        // After error, return None always.
        if !self.valid {
            return None;
        }

        let curr_char_or_none = self.char_it_next();
        let out = if let Some((idx, c)) = curr_char_or_none {
            if self.is_interesting_char(c) {
                let char_str_slice = self.text.get(idx..self.curr_char_end(idx))?;

                if c == '\r' {
                    if let Some((next_idx, next_char)) = self.char_it_next() {
                        if next_char == '\n' {
                            Token::Newline(self.text.get(next_idx..self.curr_char_end(next_idx))?)
                        } else {
                            return Some(Err(TokenizerError::BadCarrageReturn));
                        }
                    } else {
                        return Some(Err(TokenizerError::BadCarrageReturn));
                    }
                } else if c == '\n' {
                    Token::Newline(char_str_slice)
                } else if c == self.tok_cfg.special_char {
                    if let Some((next_idx, next_char)) = self.char_it_next() {
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
                    self.char_it_next();
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
