# Build

## Setup Dependecies

To be able to use `lapol-rs` properly, as it is set up out of the box, you should place both
the `lapol-rs` folder and the `lapol-parse-rs` folder BESIDES the `lapol` folder
(see `package.json`'s dependencies).

You will want to build `lapol-rs` first, so see its `build.md` file.

## Build LaPoL

To build the typescript code, just run `tsc` in this directory. (To enter continuous build (watch)
mode, use `tsc -w`.)

To run, use `npm start`

Alternative:

`node ".\build\main.js"`

(include `--inspect` flag if desired)

## Tests

To run tests, simply run
`npm test`

## Profile

To profile:

`node --inspect ".\build\main.js" profile ".\test_scratch\stress_test_0.lap"`

then use the debugger profiler (in the call stack tab).

## Using Chrome to profile (Line by Line profiling)

Check out:

https://nodejs.org/en/docs/guides/debugging-getting-started/

You will probably want to execute `node --inspect-brk ".\build\main.js"` to break before the start
of your code.

## Node JS Profiler

`node --prof ".\build\main.js"` can be used to profile
(see https://nodejs.org/en/docs/guides/simple-profiling/)

Then you will have to process this data using (where you replace `isolate-0xnnnnnnnnnnnn-v8.log` by
the generated file's name):

`node --prof-process isolate-0xnnnnnnnnnnnn-v8.log > processed.txt`.
