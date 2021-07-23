use std::borrow::Cow;

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "kind")]
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
        source_start_col: usize,
        source_start_line: usize,
    },
}
