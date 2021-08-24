# Build (Lapol-rs Only)

Note: You probably want to build LaPoL as a whole. See the parent folder `Readme.md`!

Note: Before building, make sure the folder `lapol-parse-rs` is besides this folder (`lapol-rs`).
For more info, see `Cargo.toml`.

To build, cd to this folder and run:

`wasm-pack build --target nodejs`

This will build to the folder `pkg`. See the `lapol` repo for info on how
to actually use this package.

## Note on vscode debugging

You can use the bin (not the lib) to debug the code _somewhat_ from vscode.

More info on this coming soon.

## Testing

To run tests, use `wasm-pack test --node`.
