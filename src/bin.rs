use std::{
    error::Error,
    fs::File,
    io::{BufReader, Read},
    time::Instant,
};

use lapol_parse_rs::parse;

fn load_file(full_path: &str) -> Result<String, Box<dyn Error>> {
    let file = File::open(full_path)?;
    let mut buf_reader = BufReader::new(file);
    let mut contents = String::new();
    buf_reader.read_to_string(&mut contents)?;
    Ok(contents)
}

fn parse_file_native(file_path: &str) {
    println!("Parsing {}", file_path);
    let file_content = load_file(file_path).unwrap();

    let parse_start = Instant::now();
    let parsed = parse(&file_content);
    let parse_dur = parse_start.elapsed();

    println!("Parsed --- output:\n{:#?}", parsed);

    println!("\n----------\nParsing took: {:?}", parse_dur);
}

pub fn main() {
    println!("Hello!");

    let path =
        "X:\\programming\\programming\\LaPoL Project\\lapol-parse-rs\\parse_tests\\parse3.lap";

    //let path = "X:\\programming\\programming\\LaPoL Project\\lapol-parse-rs\\parse_tests\\stress_test_0.lap";

    parse_file_native(path);
}
