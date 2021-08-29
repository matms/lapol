import { ModuleLoader } from "../internal/module/loader";

export const mod = { loaderFn: load };

function load(l: ModuleLoader): void {
    l.requireName("std::core::latex_output");

    l.declareInstantiator(() => {
        return {
            moduleName: "std::core::latex_output",
        };
    });

    l.declareTarget("latex");

    /*
    l.exportLtrfNodeOutputter("html", "__root", makeHtmlRootOutputter());
    l.exportLtrfNodeOutputter("html", "__doc", makeHtmlTagOutputter("div"));
    l.exportLtrfNodeOutputter("html", "__p", makeHtmlTagOutputter("p"));
    */

    throw new Error("LaTeX Output not yet supported.");
}
