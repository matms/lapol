/** main.ts provides the "defaults". Note you are not required to use main if you do not want to.
 * However, consider it!
 */

import { ModuleLoader, CommandArguments, LtrfNode } from "../mod";
import { MainFileStore } from "./main_common";
import { mod as htmlOutputMod } from "./main_html_output";
import { mod as latexOutputMod } from "./main_latex_output";

export const mod = { loaderFn: load };

function load(l: ModuleLoader): void {
    l.requireName("std::main");

    l.declareInstantiator(() => {
        return {
            moduleName: "std::main",
            count: 0,
            title: [],
            author: [],
        };
    });

    l.exportCommand("count", (_, c) => {
        const s = c.getFileModuleStorage("std::main") as MainFileStore;
        s.count++;
        return [s.count.toString()];
    });

    l.exportCommand("title", (a, c) => {
        const s = c.getFileModuleStorage("std::main") as MainFileStore;
        s.title = a.caOrErr(0);
        return [];
    });

    l.exportCommand("author", (a, c) => {
        const s = c.getFileModuleStorage("std::main") as MainFileStore;
        s.author = a.caOrErr(0);
        return [];
    });

    const wrapInCmd = (name: string) => (a: CommandArguments) =>
        [LtrfNode.make(name, {}, a.caOrErr(0))];
    const wrapInBlockCmd = (name: string) => (a: CommandArguments) =>
        [LtrfNode.make(name, { isBlock: true }, a.caOrErr(0))];

    l.exportCommand("maketitle", () => [LtrfNode.make("maketitle", { isBlock: true }, [])]);

    l.exportCommand("sec", wrapInBlockCmd("sec"));
    l.exportCommand("subsec", wrapInBlockCmd("subsec"));
    l.exportCommand("subsubsec", wrapInBlockCmd("subsubsec"));

    l.exportCommand("bf", wrapInCmd("bold"));
    l.exportCommand("it", wrapInCmd("italic"));

    // Block quote
    l.exportCommand("bquot", wrapInBlockCmd("bquot"));

    l.exportCommand("marginnote", wrapInCmd("marginnote"));

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

    if (l.hasTarget("html")) {
        l.declareSubModule("std::main::html_output", htmlOutputMod);
    }

    if (l.hasTarget("latex")) {
        l.declareSubModule("std::main::latex_output", latexOutputMod);
    }
}
