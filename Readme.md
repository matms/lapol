# LaPoL

- [What Is LaPoL](#what-is-lapol)
- [Limitations & Security Warnings](#limitations--security-warnings)
- [Building](#building)
- [Running](#running)
- [Credits & Thanks](#credits--thanks)

## What Is LaPoL

LaPoL is a document preparation system. It is a programming environment to create documents.

LaPoL allows you to define commands using `JavaScript` or `TypeScript`. These commands are what
provides structure to your document. You can think of these somewhat like a `TeX` macro.

For instance, if we define the command `bold`, you can embolden text as easily as:

```
@bold{this}
```

LaPoL's architecture is meant to be flexible. Specifically, we lapol-core
is written such that it can be used as a `library` (as opposed to a `framework`).
That is, you call LaPoL, instead of LaPoL calling you :smile:

By default, we export to HTML. But you can easily
setup other output targets.

## Limitations & Security Warnings

LaPoL is currently in _very early_ development. It may not be adequate if stability is necessary.

Also, **LaPoL's execution model is fundamentally based on arbitrary code execution**. Currently, LaPoL does not sandbox execution. In the future, I plan to support running LaPoL on the browser and thus use the browser's sandbox. But for now, do **NOT** run untrustworthy documents or projects, and do **NOT** use untrustworthy modules.
## Building

To build you will need:
- Python3
- Rust toolchain
- Rust `wasm-pack`.
- NPM and NodeJs.

To build, just run `python build.py` (But make sure you are using python 3).

> If this doesn't work, please open an issue!

## Running

TODO

## Credits & Thanks

LaPoL is strongly inspired by [pollen](https://docs.racket-lang.org/pollen/).

LaPoL's escape syntax is "taken" from [scribble](https://docs.racket-lang.org/scribble/).

By default, we ship with & use the [hello-css](https://github.com/arp242/hello-css) CSS template.