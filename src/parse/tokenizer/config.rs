pub struct TokenizerCfg {
    pub special_char: char,
    pub comment_marker_char: char,
    pub open_curly_char: char,
    pub close_curly_char: char,
    pub open_square_char: char,
    pub close_square_char: char,
    pub special_brace_char: char,
    pub command_force_end_char: char,
}

pub const DEFAULT_TOKENIZER_CFG: TokenizerCfg = TokenizerCfg {
    special_char: '@',
    open_curly_char: '{',
    close_curly_char: '}',
    open_square_char: '[',
    close_square_char: ']',
    comment_marker_char: '%',
    command_force_end_char: ';',
    special_brace_char: '|',
};
