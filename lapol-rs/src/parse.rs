use std::{
    error::Error,
    fs::File,
    io::{BufReader, Read},
};

use wasm_bindgen::prelude::*;

// This won't work in wasm!
pub(crate) fn load_file(full_path: &str) -> Result<String, Box<dyn Error>> {
    let file = File::open(full_path)?;
    let mut buf_reader = BufReader::new(file);
    let mut contents = String::new();
    buf_reader.read_to_string(&mut contents)?;
    Ok(contents)
}

#[allow(dead_code)]
#[wasm_bindgen]
pub fn parse_file(file_path: &str, file_content_buffer: &[u8]) -> JsValue {
    println!("Parsing {}", file_path);

    let file_content = std::str::from_utf8(file_content_buffer)
        .expect("Failed to turn file_content_buffer into str.");

    // let tok_start = Instant::now();

    let root_node = lapol_parse_rs::parse(&file_content).unwrap();

    JsValue::from_serde(&root_node).unwrap()
}

#[allow(dead_code)]
pub fn parse_file_native(file_path: &str) {
    println!("Parsing {}", file_path);

    let file_content = load_file(file_path).unwrap();

    let root_node = lapol_parse_rs::parse(&file_content).unwrap();

    // println!("root node dbg: {:#?}", root_node);
}
