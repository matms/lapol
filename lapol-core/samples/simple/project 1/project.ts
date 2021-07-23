import {
    LapolCompilerBuilder,
    LapolCompiler,
    LaPath,
    ModuleLoader,
    CommandArguments as Args,
    Expr,
    ProjectMainArgs,
    Str,
} from "lapol/mod";
import { mod as moduleMain } from "lapol/std/main";

export async function main(args: ProjectMainArgs) {
    const t0 = Date.now();

    if (args.filesToRender !== "all") {
        // TODO: Handle one-file-renders.
    }

    // TODO: Introduce better mechanism for getting local directory.
    const here = `${__dirname}/../..`;
    const file = new LaPath(`${here}/tmain.lap`);

    console.log(`<<< Rendering '${file.fullPath}'. >>>`);

    const lc: LapolCompiler = await new LapolCompilerBuilder()
        .withModule("std::main", moduleMain)
        .withTargets("html")
        .build();

    await lc.render(file, "html");

    await lc.outputDependencies(file);

    const tEnd = Date.now();

    console.log(`<<< Finished rendering '${file.parsed.base}'. >>>`);
    console.log(`<<< Total time (project.ts): ${tEnd - t0} millis. >>>`);
}
