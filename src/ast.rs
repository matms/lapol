use serde::{Deserialize, Serialize};
use std::borrow::Cow;

/// Represents a single argument withing square braces in a command invocation
/// For instance, if you do `@cmd[a, b, c=true]`, then each of "a", "b" and
/// "c=1" are one argument.
///
/// This enum has two variants. `Val` represents a single value passed in (e.g.
/// "a"), `KeyVal` represents a keyword argument (e.g. "c=true")
#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "t", content = "c")]
pub enum SquareArg<'a> {
    Val(SquareEntry<'a>),
    KeyVal(#[serde(borrow)] SquareEntry<'a>, SquareEntry<'a>),
}

/// Represents a single component in a square argument (see `SquareArg`). This
/// could be a key or a value.
///
/// Can be a number (encoded as a string), an identifier,
/// or a command (represented as an AstNode).
///
/// TODO: Introduce numerical arguments (distinguish from ident).
#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "t", content = "c")]
pub enum SquareEntry<'a> {
    Num(f64),
    Ident(&'a str),
    Bool(bool),
    QuotedStr(String),
    AstNode(AstNode<'a>),
}

/// Represents an AST node.
/// Three node types are used:
/// - `AstRootNode` -> Represents the root of the AST.
/// - `AstCommandNode` -> Represents a command invocation (at-syntax)
/// - `AstTextNode` -> Represents arbitrary text.
#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "t")]
pub enum AstNode<'a> {
    AstRootNode {
        #[serde(rename = "subNodes")]
        sub_nodes: Vec<AstNode<'a>>,
    },
    AstCommandNode {
        #[serde(rename = "commandName")]
        command_name: &'a str,
        #[serde(rename = "squareArgs")]
        square_args: Option<Vec<SquareArg<'a>>>,
        #[serde(rename = "curlyArgs")]
        curly_args: Vec<Vec<AstNode<'a>>>,
    },
    AstTextNode {
        content: Cow<'a, str>,
        //source_start_col: usize,
        //source_start_line: usize,
    },
}
