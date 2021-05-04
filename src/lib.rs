mod panic_hook;

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
