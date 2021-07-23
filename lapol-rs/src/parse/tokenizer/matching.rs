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
        self.source.starts_with(s)
    }

    #[allow(dead_code)]
    pub fn curr_relative_idx(&mut self) -> usize {
        self.curr_idx
    }

    #[allow(dead_code)]
    pub fn curr_text_idx(&mut self) -> usize {
        self.curr_idx + self.start_idx
    }

    pub fn perform_match(&mut self, s: &str) -> bool {
        if self.can_match(s) {
            let (m, rest) = self.source.split_at(s.len());
            self.curr_idx += m.len();
            self.chars_matched += m.chars().count();
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
            self.chars_matched += m.chars().count();
            self.source = rest;
            true
        } else {
            false
        }
    }

    pub fn can_match_char(&mut self, c: &char) -> bool {
        let s = c.encode_utf8(&mut self._encoding_buf);
        let s = &*s;
        self.source.starts_with(s)
    }

    pub fn num_chars_matched(&self) -> usize {
        return self.chars_matched;
    }

    /// Match 0 or more whitespace, return number of whitespace characters matched.
    pub fn match_whitespace(&mut self) -> usize {
        let trimmed = self.source.trim_start();

        let before_start = self.source.as_ptr();
        let after_start = trimmed.as_ptr();
        let diff = unsafe {after_start.offset_from(before_start) };

        let (m, rest) = self.source.split_at(diff as usize);

        self.curr_idx += m.len();

        let whitespace_chars_matched = m.chars().count();
        self.chars_matched += whitespace_chars_matched;
        
        self.source = rest;

        whitespace_chars_matched
    }
}
