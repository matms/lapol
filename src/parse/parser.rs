use super::{
    ast::AstNode,
    tokenizer::{Tokenizer, TokenizerContext, TokenizerError},
};
use thiserror::Error as TError;

#[derive(Debug, TError)]
pub enum ParserError {
    #[error("Tokenizer error occurred, could not continue parsing.")]
    TokenizerError(#[from] TokenizerError),
    #[error("Unexpected Token. Probably an issue with the Tokenizer context stack.")]
    UnexpectedToken,
}

pub struct Parser<'a> {
    tokenizer: Tokenizer<'a>,
}

impl<'a> Parser<'a> {
    /// NOTE: tokenizer should be a new tokenizer, i.e. one that hasn't been used yet.
    pub fn new(tokenizer: Tokenizer<'a>) -> Self {
        Parser {
            tokenizer: tokenizer,
        }
    }

    pub fn parse(&mut self) -> Result<AstNode, ParserError> {
        Ok(AstNode::AstRootNode {
            sub_nodes: self.parse_text(true)?,
        })
    }

    fn parse_text(&mut self, root_context: bool) -> Result<Vec<AstNode<'a>>, ParserError> {
        let mut contents = Vec::<AstNode>::new();
        let mut curlyBal = 0;

        self.tokenizer.push_context(TokenizerContext::Text);

        loop {
            let (curr_line, curr_col) = self.tokenizer.cursor_pos();
            let tok = self.tokenizer.next();
            match tok {
                None => break,
                Some(Err(e)) => return Err(ParserError::TokenizerError(e)),
                Some(Ok(tok)) => match tok {
                    super::tokenizer::Token::Newline(n) => contents.push(AstNode::AstTextNode {
                        content: n,
                        source_start_line: curr_line,
                        source_start_col: curr_col,
                    }),
                    super::tokenizer::Token::Text(n) => contents.push(AstNode::AstTextNode {
                        content: n,
                        source_start_line: curr_line,
                        source_start_col: curr_col,
                    }),
                    super::tokenizer::Token::CommandStartMarker(_) => {
                        todo!()
                    }
                    super::tokenizer::Token::BlockCommentStartMarker(_) => {
                        todo!()
                    }
                    super::tokenizer::Token::LineCommentStartMarker(_) => {
                        todo!()
                    }
                    super::tokenizer::Token::OpenCurly(_) => {
                        curlyBal += 1;
                        todo!() // TODO emit text
                    }
                    super::tokenizer::Token::CloseCurly(_) => {
                        curlyBal -= 1;
                        // Use root_context here.
                        todo!() // TODO emit text if relevant, else close this text.
                    }
                    // These should not be emitted in Text context, instead normal Text(_) should
                    // tokens should be emitted in their place.
                    super::tokenizer::Token::CommandForceEndMarker(_)
                    | super::tokenizer::Token::OpenSquare(_)
                    | super::tokenizer::Token::CloseSquare(_) => {
                        return Err(ParserError::UnexpectedToken)
                    }
                },
            }
        }

        let _ctx = self.tokenizer.pop_context();
        debug_assert!(matches!(_ctx, Some(TokenizerContext::Text)));

        Ok(contents)
    }
}
