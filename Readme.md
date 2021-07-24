# LaPoL

- [What Is LaPoL](#what-is-lapol)
- [Example Output](#example-output)
- [Limitations & Security Warnings](#limitations--security-warnings)
- [Building](#building)
- [Using lapol-core (LaPoL as a library)](#using-lapol-core-lapol-as-a-library)
- [Projects with lapol-project](#projects-with-lapol-project)
- [Credits & Thanks](#credits--thanks)

## What Is LaPoL

LaPoL is a document preparation system. In other words, it is a programming environment to create documents (and more). 


By default, LaPoL can compile to static webpages, but you can also create your own output targets (e.g., generating a PDF file through LaTeX).

LaPoL allows you to define commands using `JavaScript` or `TypeScript`. These commands are what
provides structure to your document. You can think of these somewhat like a `TeX` macro (but easier to code).

Then, once we define for example the command `bold`, we can embolden text as easily as:

```
@bold{Some text}
```

LaPoL's architecture is meant to be flexible. Specifically, we lapol-core
is written such that it can be used as a library (as opposed to as framework).
That is, you call LaPoL, instead of LaPoL calling you :smile:

However, if you prefer the "LaPoL calls you" model, see lapol-project (Currently not done - TODO).

By default, we export to HTML. But you can easily
setup other output targets.

## Example Output

TODO include example of a lapol-made webpage.

## Limitations & Security Warnings

LaPoL is currently in _very early_ development. It may not be adequate if stability is necessary.

Also, **LaPoL's execution model is fundamentally based on arbitrary code execution**. Currently, LaPoL does not sandbox execution. In the future, I plan to support running LaPoL on the browser and thus use the browser's sandbox. But for now, do **NOT** run untrustworthy documents or projects, and do **NOT** use untrustworthy modules.
## Building

To build you will need:
- Python3
- Rust toolchain
- Rust `wasm-pack`.
- NPM and NodeJS.

To build, just run `python build.py` (But make sure you are using python 3).

> If this doesn't work, please open an issue!

## Using lapol-core (LaPoL as a library)

See the `lapol-samples` repo.

TODO: More info.

## Projects with lapol-project

TODO

## Credits & Thanks

LaPoL is strongly inspired by [pollen](https://docs.racket-lang.org/pollen/).

LaPoL's escape syntax is "taken" from [scribble](https://docs.racket-lang.org/scribble/).

By default, we ship with & use the [hello-css](https://github.com/arp242/hello-css) CSS template.