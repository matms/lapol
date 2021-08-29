import { ModuleLoader } from "../internal/module/loader";
import { makeHtmlRootOutputter, makeHtmlTagOutputter } from "./output/htmlTagOutputter";

export const mod = { loaderFn: load };

function load(l: ModuleLoader): void {
    l.requireName("std::core::html_output");

    l.declareInstantiator(() => {
        return {
            moduleName: "std::core::html_output",
        };
    });

    l.declareTarget("html");

    l.exportLtrfNodeOutputter("html", "__root", makeHtmlRootOutputter());
    l.exportLtrfNodeOutputter("html", "__doc", makeHtmlTagOutputter("div"));
    l.exportLtrfNodeOutputter("html", "__p", makeHtmlTagOutputter("p"));
}
