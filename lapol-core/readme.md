# LaPoL

## What is LaPoL?

LaPoL is a document preparation system. It is a programming environment to create documents.

LaPoL allows you to define commands using `JavaScript` or `TypeScript`. These commands are what
provides structure to your document. You can think of these somewhat like a `TeX` macro.

For instance, if we define the command `bold`, you can embolden text as easily as:

```
@bold{this}
```

LaPoL's architecture is meant to be flexible. By default, we export to HTML. But you can easily
setup other output targets.

## Usage

First, you may have to build LaPoL from source. If so, see `build.md`.

Once everything is properly built, execute the runner script.

To compile an example project, navigate to this folder and run

```
node "./build/lapol/runner.js" render './samples/simple/project 0/project.ts' --all
```

This will render the project `samples\simple\project 0\project.ts` to the folder
`samples\simple\project 0\out`.

The flag `--all` indicates that it should render the entire project (not just one file).
In this case, project 0 is only comprised of one file (`hello world.lap`), so it doesn't matter.

## Limitations

LaPoL is currently in _very early_ development. It may not be adequate if stability is necessary.

Also, **LaPoL's execution model is fundamentally based on arbitrary code execution**. Currently, LaPoL does not sandbox execution. In the future, we may be able to run LaPoL on the browser and thus use the browser's sandbox. But for now, do **NOT** run untrustworthy documents or projects, and do **NOT** use untrustworthy modules.

## Inspiration & Thanks

LaPoL is inspired by TeX and LaTeX. LaPoL is also heavily inspired by another WYSIWYM document
preparation system, [Pollen](https://github.com/mbutterick/pollen). Pollen is definitely worth
checking out!

I also owe thanks to [Scribble](https://docs.racket-lang.org/scribble/)
for showing an elegant way to escape nested command characters, and for the
use of `@` as a command character.
