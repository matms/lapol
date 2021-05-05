use std::{process::Command, time::Instant};

mod parse;

/// This binary is mostly used for testing / debugging the library code.
pub fn main() {
    println!("You may want to run 'chcp 65001' before running this!");

    //parse::parse_file(
    //    "X:\\programming\\programming\\LaPoL Project\\lapol\\test_scratch\\test_parse_0 simple.lap",
    //);

    let path =
        "X:\\programming\\programming\\LaPoL Project\\lapol\\test_scratch\\stress_test_0.lap";

    //let read_start = Instant::now();
    let contents = parse::load_file(path).expect(&format!("Failed to read file {}", path));
    //let read_dur = read_start.elapsed();

    while (true) {
        let parse_start = Instant::now();
        parse::parse_file(path, contents.as_bytes());
        let parse_dur = parse_start.elapsed();

        println!("Parsing took {:?}", parse_dur)
    }
}
