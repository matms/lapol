import { ModuleLoader } from "../internal/module/loader";
import { makeLatexParaOutputter, makeLatexRootOutputter } from "./output/latexTagOutputter";

export const mod = { loaderFn: load };

function load(l: ModuleLoader): void {
    l.requireName("std::core::latex_output");

    l.declareInstantiator(() => {
        return {
            moduleName: "std::core::latex_output",
        };
    });

    l.declareTarget("latex");

    l.exportLtrfNodeOutputter("latex", "__root", makeLatexRootOutputter());
    l.exportLtrfNodeOutputter("latex", "__doc", makeLatexParaOutputter()); // TODO?
    l.exportLtrfNodeOutputter("latex", "__p", makeLatexParaOutputter());
}
