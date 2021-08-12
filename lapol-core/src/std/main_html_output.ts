import { GenericHtmlTagOutputter } from "../internal/output/html";
import { ModuleLoader } from "../mod";
import { makeHtmlTagOutputter } from "./output/htmlTagOutputter";

export const mod = { loaderFn: load };

function load(l: ModuleLoader): void {
    l.requireName("std::main::html_output");

    l.declareInstantiator(() => {
        return {
            moduleName: "std::main::html_output",
        };
    });

    l.declareTarget("html");

    l.exportLtrfNodeOutputter(
        "html",
        "title",
        makeHtmlTagOutputter("h1", [{ attr: "class", val: "title" }])
    );
    l.exportLtrfNodeOutputter("html", "sec", makeHtmlTagOutputter("h2"));
    l.exportLtrfNodeOutputter("html", "subsec", makeHtmlTagOutputter("h3"));
    l.exportLtrfNodeOutputter("html", "subsubsec", makeHtmlTagOutputter("h4"));

    l.exportLtrfNodeOutputter("html", "bold", makeHtmlTagOutputter("b"));
    l.exportLtrfNodeOutputter("html", "italic", makeHtmlTagOutputter("i"));

    l.exportLtrfNodeOutputter("html", "bquot", makeHtmlTagOutputter("blockquote"));
    l.exportLtrfNodeOutputter("html", "marginnote", makeHtmlTagOutputter("aside"));
}
