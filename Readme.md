# LaPoL

- [What Is LaPoL](#what-is-lapol)
- [Example Output](#example-output)
- [Limitations](#limitations)
- [Building](#building)
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

For an example of a LaPoL project, see (TODO ADD LINK).

LaPoL offers HTML and LaTeX export out of the box. But it should not be too
difficult for an user to add support for other output targets.

## Example Output

TODO include example of a lapol-made webpage.

## Limitations

LaPoL is currently in _very early_ development. It may not currently be adequate if stability is necessary.

Also, note that, by itself, LaPoL does not sandbox module code. This allows commands to be very powerful, but means
you should **NOT** use untrustworthy modules or compile untrustworthy documents / projects.

## Building

To build you will need:

- Python3
- Rust toolchain
- Rust `wasm-pack`.
- NPM and NodeJS.

To build, just run `python build.py` (But make sure you are using python 3).

> If this doesn't work, please open an issue!

Tip: To reduce overhead, install LaPoL in a single location, then point LaPoL
projects to that location.

## Credits & Thanks

I'd like to thank the following projects for their influence in LaPoL's design and implementation:

LaPoL is strongly inspired by [pollen](https://docs.racket-lang.org/pollen/).

LaPoL's escape syntax is "taken" from [scribble](https://docs.racket-lang.org/scribble/).

By default, we ship with & use the [hello-css](https://github.com/arp242/hello-css) CSS template.
