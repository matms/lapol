use crate::ast::AstNodeMeta;

use super::Span;

pub(super) fn ast_meta_from_span(i: Span) -> AstNodeMeta {
    AstNodeMeta {
        start_offset: i.location_offset(),
        start_line: i.location_line() as usize,
        start_col: i.get_utf8_column(), // TODO: Performance?
    }
}
