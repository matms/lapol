import {
    LapolCompilerBuilder,
    LapolCompiler,
    LaPath,
    ModuleLoader,
    CommandArguments as Args,
    Expr,
    ProjectMainArgs,
} from "lapol/mod";
import { mod as moduleMain } from "lapol/std/main";

export async function main(args: ProjectMainArgs) {
    if (args.filesToRender !== "all") {
        // TODO: Handle one-file-renders.
    }

    // TODO: Introduce better mechanism for getting local directory.
    const here = `${__dirname}/../..`;
    const file = new LaPath(`${here}/hello world.lap`);

    console.log(`<<< Rendering '${file.fullPath}'. >>>`);

    const lc: LapolCompiler = await new LapolCompilerBuilder()
        .withModule("__proj__", dunderProjMod)
        .withModule("std::main", moduleMain)
        .build();

    await lc.render(file, "html");

    console.log(`<<< Finished rendering '${file.parsed.base}'. >>>`);
}

const dunderProjMod = {
    loaderFn: (l: ModuleLoader) => {
        l.exportCommands({
            h1: (f: Args) => new Expr("h1", f.ca(0)),
            h2: (f: Args) => new Expr("h2", f.ca(0)),
            h3: (f: Args) => new Expr("h3", f.ca(0)),
            h4: (f: Args) => new Expr("h4", f.ca(0)),
            h5: (f: Args) => new Expr("h5", f.ca(0)),
            h6: (f: Args) => new Expr("h6", f.ca(0)),
            textit: (f: Args) => new Expr("i", f.ca(0)),
        });
    },
};
