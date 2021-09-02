import { strict as assert } from "assert";

// Workaround!
// Once https://github.com/microsoft/TypeScript/issues/33079 is supported,
// this should import from "lapol/mod", instead of this...
import { isLapolGloballyInitialized } from "lapol/build/lapol/main";
import {
  LaPath,
  LapolCompiler,
  LapolCompilerBuilder,
} from "lapol/build/lapol/mod";

// Import a module from the LaPoL standard library.
// In the future will be just "lapol/std/main"
import { mod as mainMod } from "lapol/build/lapol/std/main";

assert(isLapolGloballyInitialized());

async function main() {
  const rootFolder = `${__dirname}/..`;
  const pagesFolder = `${rootFolder}/pages`;
  const filesToCompile = [
    { s: new LaPath(`${pagesFolder}/a.lap`), t: "a" },
    { s: new LaPath(`${pagesFolder}/b.lap`), t: "b" },
  ];

  const t0 = Date.now();

  const lc: LapolCompiler = await new LapolCompilerBuilder()
    .withModule("std::main", mainMod)
    .withTargets("html", "latex")
    .toFolder(new LaPath(`${rootFolder}/out`))
    .build();

  await Promise.all(
    filesToCompile.map(({ s, t }) => lc.compile(s, t + ".html", "html"))
  );

  const t1 = Date.now();
  console.log(`<<< Finished rendering HTML after ${t1 - t0} ms. >>>`);

  await Promise.all(
    filesToCompile.map(({ s, t }) => lc.compile(s, t + ".tex", "latex"))
  );

  const t2 = Date.now();
  console.log(`<<< Finished rendering LaTeX after ${t2 - t1} ms. >>>`);
}

main();
