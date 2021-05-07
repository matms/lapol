use std::borrow::Cow;

use super::{
    ast::AstNode,
    tokenizer::{Token, Tokenizer, TokenizerContext, TokenizerError},
};
use thiserror::Error as TError;

#[derive(Debug, TError)]
pub enum ParserError {
    #[error("Tokenizer error occurred, could not continue parsing.")]
    TokenizerError(#[from] TokenizerError),
    #[error("Unexpected Token. Probably an issue with the Tokenizer context stack.")]
    UnexpectedToken(String),
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

    // TODO: Merge adjacent AstTextNodes
    // Consider: Should I use CopyOnWrite str?

    pub fn parse(&mut self) -> Result<AstNode, ParserError> {
        Ok(AstNode::AstRootNode {
            sub_nodes: self.parse_text(true)?,
        })
    }

    fn parse_text(&mut self, root_context: bool) -> Result<Vec<AstNode<'a>>, ParserError> {
        let mut contents = Vec::<AstNode>::new();

        if !root_context {
            self.tokenizer.push_context(
                TokenizerContext::GenericCurlyStart,
                self.tokenizer.get_escape_match(None),
            );
            let brace = self.tokenizer.next().unwrap()?;
            self.tokenizer.pop_context();

            debug_assert!(matches!(brace, Token::OpenCurly(_)));

            self.tokenizer.push_context(
                TokenizerContext::Text,
                self.tokenizer.get_escape_match(Some(brace)),
            );
        } else {
            self.tokenizer.push_context(
                TokenizerContext::Text,
                self.tokenizer.get_escape_match(None),
            );
        }

        // Merge Adjacent Text Nodes (except if either is a newline node).
        let mut add_to_contents = |node| match contents.last_mut() {
            Some(AstNode::AstTextNode {
                content: last_content,
                ..
            }) if last_content != "\n" => match node {
                AstNode::AstTextNode {
                    content: new_content,
                    ..
                } if new_content != "\n" => last_content.to_mut().push_str(&new_content),
                _ => contents.push(node),
            },
            _ => contents.push(node),
        };

        let mut curlyBal = 1; // Either we matched a open curly, or otherwise we pretend that
                              // there is a fictitious open curly before the start of the file.

        loop {
            let (curr_line, curr_col) = self.tokenizer.cursor_pos();
            let tok = self.tokenizer.next();
            match tok {
                None => break,
                Some(Err(e)) => return Err(ParserError::TokenizerError(e)),
                Some(Ok(tok)) => match tok {
                    Token::Newline(n) => add_to_contents(AstNode::AstTextNode {
                        content: Cow::from(n),
                        source_start_line: curr_line,
                        source_start_col: curr_col,
                    }),
                    Token::Text(n) => add_to_contents(AstNode::AstTextNode {
                        content: Cow::from(n),
                        source_start_line: curr_line,
                        source_start_col: curr_col,
                    }),
                    Token::CommandStartMarker(_) => {
                        todo!()
                    }
                    Token::BlockCommentStartMarker(_) => {
                        self.parse_block_comment();
                    }
                    Token::LineCommentStartMarker(_) => {
                        self.parse_line_comment()?;
                    }
                    Token::OpenCurly(n) => {
                        curlyBal += 1;
                        add_to_contents(AstNode::AstTextNode {
                            content: Cow::from(n),
                            source_start_line: curr_line,
                            source_start_col: curr_col,
                        })
                    }
                    Token::CloseCurly(n) => {
                        curlyBal -= 1;

                        debug_assert!(curlyBal >= 0);

                        if curlyBal == 0 {
                            if root_context {
                                return Err(ParserError::UnexpectedToken(
                                    "Unexpected CloseCurly in root context (likely curly brace
                                    mismatch."
                                        .to_string(),
                                ));
                            } else {
                                break;
                            }
                        } else {
                            add_to_contents(AstNode::AstTextNode {
                                content: Cow::from(n),
                                source_start_line: curr_line,
                                source_start_col: curr_col,
                            })
                        }
                    }
                    // These should not be emitted in Text context, instead normal Text(_) should
                    // tokens should be emitted in their place.
                    other => {
                        return Err(ParserError::UnexpectedToken(format!(
                            "parse_text: Unexpected token {:?}",
                            other
                        )))
                    }
                },
            }
        }

        let _ctx = self.tokenizer.pop_context();
        debug_assert!(matches!(_ctx, Some((TokenizerContext::Text, _))));

        Ok(contents)
    }

    fn parse_line_comment(&mut self) -> Result<(), ParserError> {
        self.tokenizer.push_context(
            TokenizerContext::LineComment,
            self.tokenizer.get_escape_match(None),
        );

        loop {
            let tok = self.tokenizer.next();
            match tok {
                None => break,
                Some(Err(e)) => return Err(ParserError::TokenizerError(e)),
                Some(Ok(tok)) => match tok {
                    Token::Newline(_) => break,
                    Token::Text(_) => continue,
                    other => {
                        return Err(ParserError::UnexpectedToken(format!(
                            "parse_line_comment: Unexpected token {:?}",
                            other
                        )))
                    }
                },
            }
        }

        let _ctx = self.tokenizer.pop_context();
        debug_assert!(matches!(_ctx, Some((TokenizerContext::LineComment, _))));

        Ok(())
    }

    fn parse_block_comment(&mut self) -> Result<(), ParserError> {
        self.tokenizer.push_context(
            TokenizerContext::GenericCurlyStart,
            self.tokenizer.get_escape_match(None),
        );
        let brace = self.tokenizer.next().unwrap()?;
        self.tokenizer.pop_context();

        debug_assert!(matches!(brace, Token::OpenCurly(_)));

        self.tokenizer.push_context(
            TokenizerContext::BlockComment,
            self.tokenizer.get_escape_match(Some(brace)),
        );

        let mut curlyBal = 1; // Starts at 1 because we already matched an opening curly brace.

        loop {
            let tok = self.tokenizer.next();
            match tok {
                None => {
                    return Err(ParserError::UnexpectedToken(
                        "Unexpected EOF in parse_block_comment".to_string(),
                    ))
                }
                Some(Err(e)) => return Err(ParserError::TokenizerError(e)),
                Some(Ok(tok)) => match tok {
                    Token::Newline(_) | Token::Text(_) => continue,
                    Token::OpenCurly(_) => {
                        curlyBal += 1;
                    }
                    Token::CloseCurly(_) => {
                        curlyBal -= 1;
                        debug_assert!(curlyBal >= 0);
                        if curlyBal == 0 {
                            break;
                        }
                    }
                    other => {
                        return Err(ParserError::UnexpectedToken(format!(
                            "parse_line_comment: Unexpected token {:?}",
                            other
                        )))
                    }
                },
            }
        }

        let _ctx = self.tokenizer.pop_context();
        debug_assert!(matches!(_ctx, Some((TokenizerContext::BlockComment, _))));

        Ok(())
    }
}
