# Architecture

This file gives a high level overview of LaPoL's architecture.

## Compilation

The compilation of a file is split into the follwing steps:

-   Parsing --- Takes in a file, outputs an AST.
-   Evaluation (AKA "Front pass") --- Takes in an AST, outputs a DET (Document Expression Tree)
-   Processing (AKA "Middle pass") --- Modifies a DET
-   Output (AKA "Back pass") --- Takes in a DET, outputs the chosen target format (e.g. HTML).

The user is able to customize all the three passes, but is limited in their ability to customize
the parsing step.

Parsing is implemented by `lapol-rs`, which is compiled to WebAssembly.

Evaluation, Processing and Output are implemented by this repo, `lapol`, and are very customizable
by the lapol user.

## Parsing

## Evaluation

## Processing

## Output

## Goals

Performance Goals:

-   The user should be able to edit a small file in "almost" real time.
-   The user should be able to compile a medium sized book in less than 1 second.
