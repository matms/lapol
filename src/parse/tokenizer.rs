// TODO: Maybe do away with PeekNth and instead use chars.as_str() from the character iterator?
// https://doc.rust-lang.org/std/str/struct.CharIndices.html
//
// Then, of course, we'd use str.starts_with
// https://doc.rust-lang.org/std/primitive.str.html#method.starts_with

use self::{
    config::{TokenizerCfg, DEFAULT_TOKENIZER_CFG},
    context::{default_escape_ctx, EscapeCtx, TokenizerContext},
    matching::MatchInProgress,
    token::Token,
};

use std::str::CharIndices;

use thiserror::Error as TError;

pub(super) mod config;
pub(super) mod context;
pub(super) mod matching;
pub(super) mod token;

#[derive(Debug, TError)]
pub enum TokenizerError {
    #[error(
        "Carriage return ('\\r') followed by anything that isn't newline ('\\n') is an error."
    )]
    BadCarrageReturn,
}

pub struct Tokenizer<'a> {
    ctx_stack: Vec<TokenizerContext>,
    esc_stack: Vec<EscapeCtx>,
    valid: bool,
    text: &'a str,
    char_iter: CharIndices<'a>,
    curr_line: usize,
    curr_col: usize,
    tok_cfg: TokenizerCfg,
    curr_str_idx: usize,
    curr_char_len: usize,
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

    pub(super) fn push_context(&mut self, ctx: TokenizerContext, ec: EscapeCtx) {
        self.ctx_stack.push(ctx);
        self.esc_stack.push(ec);
    }

    pub(super) fn pop_context(&mut self) -> Option<(TokenizerContext, EscapeCtx)> {
        Some((self.ctx_stack.pop()?, self.esc_stack.pop()?))
    }

    /// Returns the beginning index corresponding to the char that
    /// was _last_ returned by char_it_next();
    ///
    /// If char_it_next() hasn't been called yet, this will return 0.
    ///
    /// WARNING: Calling char_iter.next() directly will NOT update the index, so this will
    /// return the incorrect value.
    #[allow(dead_code)]
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
            self.curr_str_idx += self.curr_char_len;
            debug_assert!(self.curr_str_idx == i);
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

    pub(super) fn get_escape_match(&self, brace: Option<Token>) -> EscapeCtx {
        if brace.is_none() {
            return default_escape_ctx();
        }
        if let Some(Token::OpenCurly(x)) = brace {
            if x.chars().next() == Some(self.tok_cfg.open_curly_char) {
                return default_escape_ctx();
            }
            todo!("TODO: Escaped Matches");
        }
        panic!("get_escape_match: brace should be an OpenCurly");
    }

    fn curr_escape_ctx(&self) -> &EscapeCtx {
        self.esc_stack
            .last()
            .expect("Escape Context Stack Empty -- but Escape Context Needed!")
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

    fn match_start_comment(&mut self) -> Option<Result<Token<'a>, TokenizerError>> {
        let ec = self.curr_escape_ctx();
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

    fn match_open_curly(&mut self) -> Option<Result<Token<'a>, TokenizerError>> {
        let ec = self.curr_escape_ctx();
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

    fn match_close_curly(&mut self) -> Option<Result<Token<'a>, TokenizerError>> {
        let ec = self.curr_escape_ctx();
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

        let curr_tok_ctx = *self.ctx_stack.last().unwrap();

        // '\r' followed by '\n'.
        if curr_tok_ctx.should_match_crlf() {
            let m = self.match_crlf();
            if m.is_some() {
                return m;
            }
        }

        // Just '\n'
        if curr_tok_ctx.should_match_newline() {
            let m = self.match_newline();
            if m.is_some() {
                return m;
            }
        }

        // Line or Block Comment Start
        // "@%{" or "@%<ANYTHING ELSE>"
        if curr_tok_ctx.should_match_comments() {
            let m = self.match_start_comment();

            if m.is_some() {
                return m;
            }
        }

        // GENERIC open curly
        if curr_tok_ctx.should_match_generic_open_curly() {
            let m = self.match_generic_open_curly();

            if m.is_some() {
                return m;
            }
        }

        // Regular Open curly
        if curr_tok_ctx.should_match_open_curly() {
            let m = self.match_open_curly();

            if m.is_some() {
                return m;
            }
        }

        // Close curly
        if curr_tok_ctx.should_match_close_curly() {
            let m = self.match_close_curly();

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
