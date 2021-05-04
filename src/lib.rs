mod utils;

use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console, js_name=log)]
    fn js_console_log(s: &str);
}

#[wasm_bindgen]
pub fn init() {
    utils::set_panic_hook()
}

#[wasm_bindgen]
pub fn greet() {
    js_console_log("Hello, lapol-rs!");
}
