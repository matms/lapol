mod panic_hook;

mod parse;
pub use parse::parse_file;

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console, js_name=log)]
    fn js_console_log(s: &str);

}

#[wasm_bindgen]
/// Before using any functions, it is important to initialize lapol-rs.
pub fn init() {
    panic_hook::set_panic_hook()
}

#[wasm_bindgen]
pub fn greet() {
    js_console_log("Hello, lapol-rs!");
}

#[derive(Serialize, Deserialize, Debug)]
pub struct FileReadContent {
    pub fileContent: String,
}

#[wasm_bindgen(js_name = receiveStr)]
pub fn receive_str(str: &str) {
    js_console_log(&format!("Received string"));
    js_console_log(&format!("First char {}", str.chars().nth(0).unwrap()));
}

#[wasm_bindgen(js_name = receiveVal)]
pub fn receive_val(val: &JsValue) {
    let e: FileReadContent = val.into_serde().unwrap();
    js_console_log(&format!("Received {:?}", e));
}

#[wasm_bindgen(js_name = receiveBuffer)]
pub fn receive_buffer(buff: &[u8]) {
    js_console_log(&format!("Received Buffer"));
    js_console_log(&format!("First elem {}", buff[0]));
    let my_str = std::str::from_utf8(buff).unwrap();
    js_console_log(&format!("First char {}", my_str.chars().nth(0).unwrap()));
}
