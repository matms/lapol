pub(super) struct MatchingCtx {
    pub open_curly: String,
    pub close_curly: String,
    pub special: String,
}

// TODO: Lazy static.
// TODO: Consider Tokenizer Cfg.
pub(super) fn default_matching() -> MatchingCtx {
    MatchingCtx {
        open_curly: "{".to_string(),
        close_curly: "}".to_string(),
        special: "@".to_string(),
    }
}

pub(super) struct MatchInProgress<'a> {
    source: &'a str,
    chars_matched: usize,
    curr_idx: usize,
    start_idx: usize,
    _encoding_buf: [u8; 4],
}

impl<'a> MatchInProgress<'a> {
    pub fn new(source_text: &'a str, start_idx: usize) -> Self {
        Self {
            source: source_text,
            chars_matched: 0,
            curr_idx: 0,
            start_idx,
            _encoding_buf: [0; 4],
        }
    }

    pub fn can_match(&self, s: &str) -> bool {
        return self.source.starts_with(s);
    }

    fn curr_relative_idx(&mut self) -> usize {
        self.curr_idx
    }

    pub fn curr_text_idx(&mut self) -> usize {
        self.curr_idx + self.start_idx
    }

    pub fn perform_match(&mut self, s: &str) -> bool {
        if self.can_match(s) {
            let (m, rest) = self.source.split_at(s.len());
            self.curr_idx += m.len();
            self.chars_matched = m.chars().count();
            self.source = rest;
            true
        } else {
            false
        }
    }

    pub fn perform_match_char(&mut self, c: &char) -> bool {
        let s = c.encode_utf8(&mut self._encoding_buf);
        let s = &*s;
        if self.source.starts_with(s) {
            let (m, rest) = self.source.split_at(s.len());
            self.curr_idx += m.len();
            self.chars_matched = m.chars().count();
            self.source = rest;
            true
        } else {
            false
        }
    }

    pub fn num_chars_matched(&self) -> usize {
        return self.chars_matched;
    }
}
