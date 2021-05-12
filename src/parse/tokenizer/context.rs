use super::config::TokenizerCfg;

/// TokenizerContext represents the Parsing Context, insofar as that affects the Tokenizer
/// behavior.
#[derive(Copy, Clone, Debug)]
pub(crate) enum TokenizerContext {
    // TODO: special brace support.
    Text,
    LineComment,
    BlockComment,
    GenericCurlyStart,
    // Like GenericCurlyStart, but also matches command force end (probably ;)
    GenericCurlyStartCommand,
    CommandName,
    // CommandSquareArg,
    // Note that curly args are just text.
}

impl TokenizerContext {
    /// Returns true if this is a character that may cause the tokenizer to emit a non-Text
    /// token. Fundamentally speaking, this is just an optimization.
    ///
    /// For more details, see the Tokenizer::next() method's implementation.
    pub(crate) fn is_interesting_char(&self, c: char, tok_cfg: &TokenizerCfg) -> bool {
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
            TokenizerContext::GenericCurlyStartCommand => {
                return c == '\r'
                    || c == '\n'
                    || c == tok_cfg.special_brace_char
                    || c == tok_cfg.open_curly_char
                    || c == tok_cfg.command_force_end_char
            }
            TokenizerContext::CommandName => {
                return c == '\r'
                    || c == '\n'
                    || c == tok_cfg.special_char
                    || c == tok_cfg.comment_marker_char // Comments aren't allowed in a command
                    || c == tok_cfg.open_curly_char
                    || c == tok_cfg.close_curly_char
                    || c == tok_cfg.open_square_char
                    || c == tok_cfg.close_square_char
                    || c == tok_cfg.special_brace_char
                    || c.is_whitespace(); // Whitespace ends a command.
            }
        }
        /*
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
        */
    }

    pub(crate) fn should_match_crlf(&self) -> bool {
        true
    }

    pub(crate) fn should_match_newline(&self) -> bool {
        true
    }

    /// Refers to both line and block comments.
    /// All contexts match comments, except for comments themselves.
    pub(crate) fn should_match_comments(&self) -> bool {
        match self {
            TokenizerContext::Text => true,
            TokenizerContext::LineComment => false,
            TokenizerContext::BlockComment => false,
            TokenizerContext::GenericCurlyStart => true, // TODO: Should this one be false or true?
            TokenizerContext::GenericCurlyStartCommand => true,
            TokenizerContext::CommandName => false, // No comments inside command name.
        }
    }

    /// Returns false for all contexts except for GenericCurlyStart.
    ///
    /// Basically,
    /// an open curly only matters if it has the same escape pattern as the enclosing context,
    /// except in cases where a new curly context will be defined (e.g. in a lapol command).
    pub(crate) fn should_match_generic_open_curly(&self) -> bool {
        match self {
            TokenizerContext::Text => false,
            TokenizerContext::LineComment => false,
            TokenizerContext::BlockComment => false,
            TokenizerContext::GenericCurlyStart => true,
            TokenizerContext::GenericCurlyStartCommand => true,
            TokenizerContext::CommandName => false,
        }
    }

    /// Note this refers to an open curly inside of a curly context, i.e. one with the same
    /// escape pattern as the context. Contrast with should_match_generic_open_curly.
    pub(crate) fn should_match_open_curly(&self) -> bool {
        match self {
            TokenizerContext::Text => true,
            TokenizerContext::LineComment => false,
            TokenizerContext::BlockComment => true,
            TokenizerContext::GenericCurlyStart => false,
            TokenizerContext::GenericCurlyStartCommand => false,
            TokenizerContext::CommandName => false,
        }
    }

    pub(crate) fn should_match_close_curly(&self) -> bool {
        match self {
            TokenizerContext::Text => true,
            TokenizerContext::LineComment => false,
            TokenizerContext::BlockComment => true,
            TokenizerContext::GenericCurlyStart => false,
            TokenizerContext::GenericCurlyStartCommand => false,
            TokenizerContext::CommandName => false,
        }
    }

    pub(crate) fn should_match_command_start(&self) -> bool {
        match self {
            TokenizerContext::Text => true,
            TokenizerContext::LineComment => false,
            TokenizerContext::BlockComment => false,
            TokenizerContext::GenericCurlyStart => false, // TODO?
            TokenizerContext::GenericCurlyStartCommand => false,
            TokenizerContext::CommandName => false,
        }
    }

    pub(crate) fn should_match_command_force_end(&self) -> bool {
        match self {
            TokenizerContext::Text => false,
            TokenizerContext::LineComment => false,
            TokenizerContext::BlockComment => false,
            TokenizerContext::GenericCurlyStart => false, // TODO?
            TokenizerContext::GenericCurlyStartCommand => true,
            TokenizerContext::CommandName => false,
        }
    }
}

pub(crate) struct EscapeCtx {
    pub open_curly: String,
    pub close_curly: String,
    pub special: String,
}

// TODO: Lazy static.
// TODO: Consider Tokenizer Cfg.
pub(crate) fn default_escape_ctx() -> EscapeCtx {
    EscapeCtx {
        open_curly: "{".to_string(),
        close_curly: "}".to_string(),
        special: "@".to_string(),
    }
}
