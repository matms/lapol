use std::{
    error::Error,
    fs::File,
    io::{BufReader, Read},
    time::Instant,
};

use wasm_bindgen::prelude::*;

pub mod ast;
mod parser;
mod tokenizer;

use parser::Parser;

use crate::parse::tokenizer::{Token, Tokenizer};

// This won't work in wasm!
pub(crate) fn load_file(full_path: &str) -> Result<String, Box<dyn Error>> {
    let file = File::open(full_path)?;
    let mut buf_reader = BufReader::new(file);
    let mut contents = String::new();
    buf_reader.read_to_string(&mut contents)?;
    Ok(contents)
}

#[wasm_bindgen]
pub fn parse_file(file_path: &str, file_content_buffer: &[u8]) -> JsValue {
    println!("Parsing {}", file_path);

    let file_content = std::str::from_utf8(file_content_buffer)
        .expect("Failed to turn file_content_buffer into str.");

    // let tok_start = Instant::now();

    let mut tokenizer = Tokenizer::new(&file_content, None);

    let mut parser = Parser::new(tokenizer);

    let root_node = parser.parse().unwrap();

    JsValue::from_serde(&root_node).unwrap()
}
