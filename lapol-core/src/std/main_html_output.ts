import { composeOutput, outputLtrfObj } from "../internal/out/out"; // TODO: Import better

import { ModuleLoader } from "../mod";
import { MainFileStore } from "./main_common";
import { HtmlStringOutputter } from "./output/htmlStringOutputter";
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

    l.exportStringOutputterProvider("html", new HtmlStringOutputter());

    l.exportLtrfNodeOutputter("html", "maketitle", (obj, ctx) => {
        const s = ctx.getFileModuleStorage("std::main") as MainFileStore;
        const title = s.title;
        const author = s.author;

        const titleOut = composeOutput(...title.map((v) => outputLtrfObj(ctx, v)));

        if (author === []) {
            return { code: `<h1 class="title">${titleOut.code}</h1>` };
        }

        const authorOut = composeOutput(...author.map((v) => outputLtrfObj(ctx, v)));

        return {
            code:
                `<header>` +
                `<h1 class="title">${titleOut.code}</h1>` +
                `<p class="subtitle">${authorOut.code}</p>` +
                `</header>`,
        };
    });

    l.exportLtrfNodeOutputter("html", "sec", makeHtmlTagOutputter("h2"));
    l.exportLtrfNodeOutputter("html", "subsec", makeHtmlTagOutputter("h3"));
    l.exportLtrfNodeOutputter("html", "subsubsec", makeHtmlTagOutputter("h4"));

    l.exportLtrfNodeOutputter("html", "bold", makeHtmlTagOutputter("b"));
    l.exportLtrfNodeOutputter("html", "italic", makeHtmlTagOutputter("i"));

    l.exportLtrfNodeOutputter("html", "bquot", makeHtmlTagOutputter("blockquote"));
    l.exportLtrfNodeOutputter("html", "marginnote", makeHtmlTagOutputter("aside"));
}
