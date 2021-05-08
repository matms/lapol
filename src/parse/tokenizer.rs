// TODO: Maybe do away with PeekNth and instead use chars.as_str() from the character iterator?
// https://doc.rust-lang.org/std/str/struct.CharIndices.html
//
// Then, of course, we'd use str.starts_with
// https://doc.rust-lang.org/std/primitive.str.html#method.starts_with

use crate::parse::matching::default_matching;

use super::matching::{MatchInProgress, MatchingCtx};
use itertools::zip_eq;
use serde::{Deserialize, Serialize};
use std::{error::Error, iter::Peekable, str::CharIndices, vec};

use thiserror::Error as TError;

#[derive(Debug, TError)]
pub enum TokenizerError {
    #[error("Unexpected end of iterator (likely EOF) after special_char (likely '@')")]
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
    special_char: '@',
    open_curly_char: '{',
    close_curly_char: '}',
    open_square_char: '[',
    close_square_char: ']',
    comment_marker_char: '%',
    command_force_end_char: ';',
    special_brace_char: '|',
};

#[derive(Copy, Clone, Debug)]
pub enum TokenizerContext {
    // TODO: special brace support.
    Text,
    LineComment,
    BlockComment,
    GenericCurlyStart,
    // CommandName,
    // CommandSquareArg,
    // Note that curly args are just text.
}

impl TokenizerContext {
    fn is_interesting_char(&self, c: char, tok_cfg: &TokenizerCfg) -> bool {
        match self {
            TokenizerContext::Text => {
                return c == '\r'
                    || c == '\n'
                    || c == tok_cfg.special_char
                    || c == tok_cfg.comment_marker_char
                    || c == tok_cfg.open_curly_char
                    || c == tok_cfg.close_curly_char
                    || c == tok_cfg.special_brace_char; // TODO maybe remove this last one
            }
            TokenizerContext::LineComment => {
                return c == '\r' || c == '\n';
            }
            TokenizerContext::BlockComment => {
                return c == '\r'
                    || c == '\n'
                    || c == tok_cfg.open_curly_char
                    || c == tok_cfg.close_curly_char
                    || c == tok_cfg.special_brace_char; // TODO maybe remove this last one
            }
            TokenizerContext::GenericCurlyStart => {
                return c == '\r'
                    || c == '\n'
                    || c == tok_cfg.special_brace_char
                    || c == tok_cfg.open_curly_char
            }
        }
        return c == '\r'
            || c == '\n'
            || c == tok_cfg.special_char
            || c == tok_cfg.comment_marker_char
            || c == tok_cfg.open_curly_char
            || c == tok_cfg.close_curly_char
            || c == tok_cfg.special_brace_char
            || c == tok_cfg.open_square_char
            || c == tok_cfg.close_square_char
            || c == tok_cfg.command_force_end_char;
    }

    fn should_match_crlf(&self) -> bool {
        true
    }
    fn should_match_newline(&self) -> bool {
        true
    }
    fn should_match_comments(&self) -> bool {
        match self {
            TokenizerContext::Text => true,
            TokenizerContext::LineComment => false,
            TokenizerContext::BlockComment => false,
            TokenizerContext::GenericCurlyStart => true, // TODO: Should this last one be false or true?
        }
    }

    fn should_match_generic_open_curly(&self) -> bool {
        match self {
            TokenizerContext::Text => false,
            TokenizerContext::LineComment => false,
            TokenizerContext::BlockComment => false,
            TokenizerContext::GenericCurlyStart => true,
        }
    }

    fn should_match_open_curly(&self) -> bool {
        match self {
            TokenizerContext::Text => true,
            TokenizerContext::LineComment => false,
            TokenizerContext::BlockComment => true,
            TokenizerContext::GenericCurlyStart => false,
        }
    }

    fn should_match_close_curly(&self) -> bool {
        match self {
            TokenizerContext::Text => true,
            TokenizerContext::LineComment => false,
            TokenizerContext::BlockComment => true,
            TokenizerContext::GenericCurlyStart => false,
        }
    }
}

pub struct Tokenizer<'a> {
    ctx_stack: Vec<TokenizerContext>,
    esc_stack: Vec<MatchingCtx>,
    valid: bool,
    text: &'a str,
    char_iter: CharIndices<'a>,
    curr_line: usize,
    curr_col: usize,
    tok_cfg: TokenizerCfg,
    curr_str_idx: usize,
    curr_char_len: usize,
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
            esc_stack: Vec::new(),
            valid: true,
            text: input,
            char_iter: input.char_indices(),
            curr_line: 1,
            curr_col: 1,
            curr_str_idx: 0,
            curr_char_len: 0,
            tok_cfg: if let Some(x) = tokenizer_cfg {
                x
            } else {
                DEFAULT_TOKENIZER_CFG
            },
        }
    }

    pub(super) fn push_context(&mut self, ctx: TokenizerContext, ec: MatchingCtx) {
        self.ctx_stack.push(ctx);
        self.esc_stack.push(ec);
    }

    pub(super) fn pop_context(&mut self) -> Option<(TokenizerContext, MatchingCtx)> {
        Some((self.ctx_stack.pop()?, self.esc_stack.pop()?))
    }

    /// Returns the beginning index corresponding to the char that
    /// was _last_ returned by char_it_next();
    ///
    /// If char_it_next() hasn't been called yet, this will return 0.
    ///
    /// WARNING: Calling char_iter.next() directly will NOT update the index, so this will
    /// return the incorrect value.
    fn prev_char_idx(&mut self) -> usize {
        self.curr_str_idx
    }

    /// Returns the beginning index corresponding to the char that
    /// will be returned by char_it_next() the next time it is called;
    ///
    /// In other words, this is the endind index (EXCLUSIVE) for the prev char.
    ///
    /// Note: Should return the length of the text in bytes if at the end.
    ///
    /// WARNING: Calling char_iter.next() directly will NOT update the index, so this will
    /// return the incorrect value.
    fn next_char_idx(&self) -> usize {
        self.curr_str_idx + self.curr_char_len
    }

    /// Return true if `s` matches from the current char forward
    /// (as returned by char_iter.as_str()).
    fn peek_match(&mut self, s: &str) -> bool {
        self.char_iter.as_str().starts_with(s)
    }

    fn start_match(&self) -> MatchInProgress<'a> {
        return MatchInProgress::new(self.char_iter.as_str(), self.next_char_idx());
    }

    /// You should call this instead of char_iter.next(), as this also updates the current column
    /// and line numbers. If you call char_iter.next() directly, the line / col numbers will
    /// become incorrect.
    fn char_it_next(&mut self) -> Option<(usize, char)> {
        let opt = self.char_iter.next();
        if let Some((i, c)) = opt {
            if c == '\n' {
                self.curr_col = 1;
                self.curr_line += 1;
            } else {
                self.curr_col += 1
            }
            self.curr_str_idx = i;
            self.curr_char_len = c.len_utf8();
        } else {
            // TODO: Does this make sense?
            self.curr_str_idx = self.text.len();
            self.curr_char_len = 0;
        }
        opt
    }

    /// qty == 1 corresponds to char_it_next.
    fn char_it_next_many(&mut self, qty: usize) -> Option<(usize, char)> {
        let mut out = None;
        for _ in 0..qty {
            out = self.char_it_next();
        }
        out
    }

    /// Return the line (starting the count at 1) and column numbers, respectively,
    /// of the start of the token that will be returned next (not the last returned token!).
    pub fn cursor_pos(&self) -> (usize, usize) {
        (self.curr_line, self.curr_col)
    }

    pub(super) fn get_escape_match(&self, brace: Option<Token>) -> MatchingCtx {
        if brace.is_none() {
            return default_matching();
        }
        if let Some(Token::OpenCurly(x)) = brace {
            if x.chars().next() == Some(self.tok_cfg.open_curly_char) {
                return default_matching();
            }
            todo!("TODO: Escaped Matches");
        }
        panic!("get_escape_match: brace should be an OpenCurly");
    }

    fn curr_escape_match(&self) -> &MatchingCtx {
        self.esc_stack
            .last()
            .expect("Escape match shouldn't be empty")
    }

    /// Attempt to match a CRLF (i.e. "\r\n"). Return Some(result) if match is successful or if
    /// error occurs, return None if no match occurs.
    fn match_crlf(&mut self) -> Option<Result<Token<'a>, TokenizerError>> {
        if self.peek_match("\r\n") {
            self.char_it_next(); // '\r'
            let (newline_idx, _) = self.char_it_next().unwrap(); // '\n'
            return Some(Ok(Token::Newline(
                self.text.get(newline_idx..self.next_char_idx())?,
            )));
        }
        if self.peek_match("\r") {
            return Some(Err(TokenizerError::BadCarrageReturn));
        }
        return None;
    }

    fn match_newline(&mut self) -> Option<Result<Token<'a>, TokenizerError>> {
        if self.peek_match("\n") {
            let (newline_idx, _) = self.char_it_next().unwrap(); // '\n'
            return Some(Ok(Token::Newline(
                self.text.get(newline_idx..self.next_char_idx())?,
            )));
        }
        return None;
    }

    fn match_start_comment(
        &mut self,
        ec: &MatchingCtx,
    ) -> Option<Result<Token<'a>, TokenizerError>> {
        let start_idx = self.next_char_idx();

        let mut m = self.start_match();
        if m.perform_match(&ec.special) {
            if m.perform_match_char(&self.tok_cfg.comment_marker_char) {
                if m.can_match_char(&self.tok_cfg.special_brace_char)
                    || m.can_match_char(&self.tok_cfg.open_curly_char)
                {
                    self.char_it_next_many(m.num_chars_matched());
                    return Some(Ok(Token::BlockCommentStartMarker(
                        self.text.get(start_idx..self.next_char_idx())?,
                    )));
                } else {
                    self.char_it_next_many(m.num_chars_matched());
                    return Some(Ok(Token::LineCommentStartMarker(
                        self.text.get(start_idx..self.next_char_idx())?,
                    )));
                }
            } else {
                return None;
            }
        } else {
            return None;
        }
    }

    fn match_generic_open_curly(&mut self) -> Option<Result<Token<'a>, TokenizerError>> {
        let start_idx = self.next_char_idx();

        let mut m = self.start_match();

        if m.perform_match_char(&self.tok_cfg.special_brace_char) {
            todo!("Escaped Curly!")
        } else if m.perform_match_char(&self.tok_cfg.open_curly_char) {
            debug_assert!(m.num_chars_matched() == 1);
            self.char_it_next();
            Some(Ok(Token::OpenCurly(
                self.text.get(start_idx..self.next_char_idx())?,
            )))
        } else {
            None
        }
    }

    fn match_open_curly(&mut self, ec: &MatchingCtx) -> Option<Result<Token<'a>, TokenizerError>> {
        let start_idx = self.next_char_idx();

        let mut m = self.start_match();

        if m.perform_match(&ec.open_curly) {
            self.char_it_next_many(m.num_chars_matched());
            return Some(Ok(Token::OpenCurly(
                self.text.get(start_idx..self.next_char_idx())?,
            )));
        }

        None
    }

    fn match_close_curly(&mut self, ec: &MatchingCtx) -> Option<Result<Token<'a>, TokenizerError>> {
        let start_idx = self.next_char_idx();

        let mut m = self.start_match();

        if m.perform_match(&ec.close_curly) {
            self.char_it_next_many(m.num_chars_matched());
            return Some(Ok(Token::CloseCurly(
                self.text.get(start_idx..self.next_char_idx())?,
            )));
        }

        None
    }
}

impl<'a> Iterator for Tokenizer<'a> {
    type Item = Result<Token<'a>, TokenizerError>;

    fn next(&mut self) -> Option<Self::Item> {
        // After error, return None always.
        if !self.valid {
            return None;
        }

        // '\r' followed by '\n'.
        if self.ctx_stack.last().unwrap().should_match_crlf() {
            let m = self.match_crlf();
            if m.is_some() {
                return m;
            }
        }

        // Just '\n'
        if self.ctx_stack.last().unwrap().should_match_newline() {
            let m = self.match_newline();
            if m.is_some() {
                return m;
            }
        }

        // Line or Block Comment Start
        // "@%{" or "@%<ANYTHING ELSE>"
        if self.ctx_stack.last().unwrap().should_match_comments() {
            let cem = self.esc_stack.pop().expect("esc_stack should not be empty");
            let m = self.match_start_comment(&cem);
            self.esc_stack.push(cem);

            if m.is_some() {
                return m;
            }
        }

        // GENERIC open curly
        if self
            .ctx_stack
            .last()
            .unwrap()
            .should_match_generic_open_curly()
        {
            let m = self.match_generic_open_curly();

            if m.is_some() {
                return m;
            }
        }

        // Regular Open curly
        if self.ctx_stack.last().unwrap().should_match_open_curly() {
            let cem = self.esc_stack.pop().expect("esc_stack should not be empty");
            let m = self.match_open_curly(&cem);
            self.esc_stack.push(cem);

            if m.is_some() {
                return m;
            }
        }

        // Close curly
        if self.ctx_stack.last().unwrap().should_match_close_curly() {
            let cem = self.esc_stack.pop().expect("esc_stack should not be empty");
            let m = self.match_close_curly(&cem);
            self.esc_stack.push(cem);

            if m.is_some() {
                return m;
            }
        }

        if let Some((start_idx, _)) = self.char_it_next() {
            let tok_context = *self.ctx_stack.last().unwrap();

            loop {
                let p = self.char_iter.as_str().chars().next();
                match p {
                    None => break,
                    Some(c) => {
                        if tok_context.is_interesting_char(c, &self.tok_cfg) {
                            break;
                        }
                    }
                }
                self.char_it_next();
            }
            let char_str_slice = self.text.get(start_idx..self.next_char_idx())?;

            return Some(Ok(Token::Text(char_str_slice)));
        }

        // Ran out of the end.
        return None;

        // TODO: Match everything else using this approach!

        /*

        let curr_char_or_none = self.char_it_next();
        let out = if let Some((idx, c)) = curr_char_or_none {
            //if self.is_interesting_char(c) {
            let curr_escape_match = self.curr_escape_match();
            let char_str_slice = self.text.get(idx..self.curr_char_end())?;

            if c == self.tok_cfg.special_char {
                // @
                if let Some((n1_idx, n1_char)) = self.char_it_next() {
                    // @%
                    if n1_char == self.tok_cfg.comment_marker_char {
                        if let Some(&(n2_idx, n2_char)) = self.char_iter.peek() {
                            // @%{ -> Start block comment
                            if n2_char == self.tok_cfg.open_curly_char {
                                // Note we don't actually match the brace yet!
                                Token::BlockCommentStartMarker(
                                    self.text.get(idx..self.curr_char_end())?,
                                )
                            }
                            // @%| -> Potential start block comment with escaped brace.
                            else if n2_char == self.tok_cfg.special_brace_char {
                                // Note we don't actually match the brace yet!
                                Token::BlockCommentStartMarker(
                                    self.text.get(idx..self.curr_char_end())?,
                                )
                            }
                            // @% + anything else -> Line comment
                            else {
                                Token::LineCommentStartMarker(
                                    self.text.get(idx..self.curr_char_end())?,
                                )
                            }
                        }
                        // @%<EOF> -> Treat as line comment.
                        else {
                            Token::LineCommentStartMarker(self.text.get(idx..self.curr_char_end())?)
                        }
                    }
                    // @ + anything else
                    else {
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
            // } else {
            loop {
                let p = self.char_iter.peek();
                match p {
                    None => break,
                    Some(&(_, c)) => {
                        //if self.is_interesting_char(c) {
                        break;
                        //}
                    }
                }
                self.char_it_next();
            }
            let char_str_slice = self.text.get(idx..self.curr_char_end())?;
            Token::Text(char_str_slice)
            //}
        } else {
            return None;
        };
        */
    }
}
