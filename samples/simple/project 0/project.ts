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

// TODO: Remove this dependency on internal stuff!
import { GenericHtmlTagOutputter } from "lapol/internal/output/html";

export async function main(args: ProjectMainArgs) {
    const t0 = Date.now();

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
        .withTargets(["html"])
        .build();

    await lc.render(file, "html");

    const tEnd = Date.now();

    console.log(`<<< Finished rendering '${file.parsed.base}'. >>>`);
    console.log(`<<< Total time (project.ts): ${tEnd - t0} millis. >>>`);
}

const dunderProjMod = {
    loaderFn: (l: ModuleLoader) => {
        l.declareTarget("html");

        l.exportCommand("h1", (f: Args) => new Expr("my_h1", f.ca(0)));
        l.exportCommand("h2", (f: Args) => new Expr("my_h2", f.ca(0)));
        l.exportCommand("h3", (f: Args) => new Expr("my_h3", f.ca(0)));
        l.exportCommand("h4", (f: Args) => new Expr("my_h4", f.ca(0)));
        l.exportCommand("h5", (f: Args) => new Expr("my_h5", f.ca(0)));
        l.exportCommand("h6", (f: Args) => new Expr("my_h6", f.ca(0)));
        l.exportCommand("textit", (f: Args) => new Expr("my_i", f.ca(0)));

        // Indicate that my_h1 is a "block" (as understood in HTML).
        // This prevents LaPoL's auto paragraph mechanism from adding a paragraph tag, like so:
        // Wrong, would be done without this line: <p><h1>...</h1></p>
        // Right: <h1>...</h1> -> no paragraph around title!
        l.declareExprMeta("my_h1", { isBlock: true });
        l.declareExprMeta("my_h2", { isBlock: true });
        l.declareExprMeta("my_h3", { isBlock: true });
        l.declareExprMeta("my_h4", { isBlock: true });
        l.declareExprMeta("my_h5", { isBlock: true });
        l.declareExprMeta("my_h6", { isBlock: true });
        l.declareExprMeta("my_i", {}); // Note that isBlock defaults to false.

        l.exportExprOutputter("html", "my_h1", new GenericHtmlTagOutputter("my_h1", "h1"));
        l.exportExprOutputter("html", "my_h2", new GenericHtmlTagOutputter("my_h2", "h2"));
        l.exportExprOutputter("html", "my_h3", new GenericHtmlTagOutputter("my_h3", "h3"));
        l.exportExprOutputter("html", "my_h4", new GenericHtmlTagOutputter("my_h4", "h4"));
        l.exportExprOutputter("html", "my_h5", new GenericHtmlTagOutputter("my_h5", "h5"));
        l.exportExprOutputter("html", "my_h6", new GenericHtmlTagOutputter("my_h6", "h6"));
        l.exportExprOutputter("html", "my_i", new GenericHtmlTagOutputter("my_i", "i"));
    },
};
