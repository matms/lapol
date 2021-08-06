# Architecture

This file gives a high level overview of LaPoL's architecture.

## Compilation

The compilation of a file is split into the follwing steps:

-   Parsing --- Takes in a file, outputs an AST.
-   Evaluation (AKA "Front pass") --- Takes in an AST, outputs a ~~DET (Document Expression Tree)~~ LTRF Tree (LaPoL Text Representation Format)
-   Processing (AKA "Middle pass") --- Modifies a ~~DET~~ LTRF (immutably)
-   Output (AKA "Back pass") --- Takes in a ~~ DET~~ LTRF, outputs the chosen target format (e.g. HTML).

The user is able to customize all the three passes, but is limited in their ability to customize
the parsing step.

Parsing is implemented by `lapol-parse-rs`, which
is used by `lapol-rs`. `lapol-rs` calls the parser
(from `lapol-parse-rs`), then serializes the data
(using `Serde`) into JSON, which is sent over to
`lapol`.

Evaluation, Processing and Output are implemented by `lapol-core`, and are meant to be
very easily customizable by the lapol user.

## Parsing

TODO

## Evaluation

TODO

## Processing

TODO

## Output

TODO

## Modules

A LaPoL module is fundamentally a `Javascript` module, which exports an object satisfying the interface `ModuleDeclaration`.

The main component of this interface is the loader function. This is a function that receives a `ModuleLoader` object. By calling methods on this object, a module can programmatically declare itself.

See the folder `src/std` for example modules. (However, don't start with `std/core`. That one is pretty complicated!)

## Performance Goals

-   The user should be able to edit a small file in "almost" real time.
-   The user should be able to compile a medium sized book in less than 1 second.
