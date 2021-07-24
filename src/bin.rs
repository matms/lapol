use std::time::Instant;

mod parse;

/// This binary is mostly used for testing / debugging the library code.
pub fn main() {
    println!("You may want to run 'chcp 65001' before running this!");

    //parse::parse_file(
    //    "X:\\programming\\programming\\LaPoL Project\\lapol\\test_scratch\\test_parse_0 simple.lap",
    //);

    let path = "X:\\programming\\programming\\LaPoL Project\\lapol\\test_scratch\\parse2.lap";

    /*let path =
        "X:\\programming\\programming\\LaPoL Project\\lapol\\test_scratch\\stress_test_0.lap";*/

    //loop {
    let parse_start = Instant::now();
    parse::parse_file_native(path);
    let parse_dur = parse_start.elapsed();

    println!("Parsing took {:?}", parse_dur);
    //}
}
