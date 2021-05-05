use std::{
    error::Error,
    fs::File,
    io::{BufReader, Read},
    time::Instant,
};

use wasm_bindgen::prelude::*;

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
pub fn parse_file(file_path: &str, file_content_buffer: &[u8]) {
    println!("Parsing {}", file_path);

    let file_content = std::str::from_utf8(file_content_buffer)
        .expect("Failed to turn file_content_buffer into str.");

    let tok_start = Instant::now();
    let mut tokenizer = Tokenizer::new(&file_content, None);

    let mut pos = tokenizer.cursor_pos();

    println!("Start pos: {:?}", pos);

    //while let Some(x) = tokenizer.next() {
    //    pos = tokenizer.cursor_pos();
    //    tok = Some(x);
    //}

    println!("End pos: {:?}", pos);
    //let o: Vec<Token> = tokenizer.map(|x| x.unwrap()).collect();
    let last = tokenizer.last().unwrap().unwrap();

    let tok_dur = tok_start.elapsed();

    println!("Took time {:?}", tok_dur);

    println!("Tokenizer last tok {:?}", last);
    // js_console_log(&format!("First token is {:?}", o[0]));

    println!("Finished tokenizing {}", file_path);
}
