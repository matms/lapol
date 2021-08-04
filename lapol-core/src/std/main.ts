/** main.ts provides the "defaults". Note you are not required to use main if you do not want to.
 * However, consider it!
 */

import { Str, Expr, ModuleLoader, FileModuleStorage } from "../mod";
import { mod as htmlOutputMod } from "./main_html_output";
import { mod as latexOutputMod } from "./main_latex_output";

export const mod = { loaderFn: load };

interface MainFileStore extends FileModuleStorage {
    count: number;
}

function load(l: ModuleLoader): void {
    l.requireName("std::main");

    l.declareInstantiator(() => {
        return {
            moduleName: "std::main",
            count: 0,
        };
    });

    l.exportCommand("count", (_, c) => {
        const s = c.getFileModuleStorage("std::main") as MainFileStore;
        s.count++;
        return new Str(s.count.toString());
    });

    l.exportCommand("title", (a) => new Expr("title", a.ca(0)));
    l.exportCommand("sec", (a) => new Expr("sec", a.ca(0)));
    l.exportCommand("subsec", (a) => new Expr("subsec", a.ca(0)));
    l.exportCommand("subsubsec", (a) => new Expr("subsubsec", a.ca(0)));

    l.exportCommand("bf", (a) => new Expr("bold", a.ca(0)));
    l.exportCommand("it", (a) => new Expr("italic", a.ca(0)));

    // Block quote
    l.exportCommand("bquot", (a) => new Expr("bquot", a.ca(0)));

    l.exportCommand("marginnote", (a) => new Expr("marginnote", a.ca(0)));

    // TODO:
    //  - Tables
    //  - Code blocks w/ syntax high. (Inline & block)
    //  - Verbatim
    //  - Block quotes & Nested Block Quotes
    //  - Lists (ordered, unordered, etc.
    //  - Horizontal Rule
    //  - Links (Including references)
    //  - Footnotes (including hover & in-text)
    //  - LaTeX math support
    //  - Section Numbering

    l.declareExprMeta("title", { isBlock: true });
    l.declareExprMeta("sec", { isBlock: true });
    l.declareExprMeta("subsec", { isBlock: true });
    l.declareExprMeta("subsubsec", { isBlock: true });

    l.declareExprMeta("bold", {});
    l.declareExprMeta("italic", {});

    l.declareExprMeta("bquot", { isBlock: true });
    l.declareExprMeta("marginnote", {});

    if (l.hasTarget("html")) {
        l.declareSubModule("std::main::html_output", htmlOutputMod);
    }

    if (l.hasTarget("latex")) {
        l.declareSubModule("std::main::latex_output", latexOutputMod);
    }
}
