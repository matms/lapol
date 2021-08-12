/** main.ts provides the "defaults". Note you are not required to use main if you do not want to.
 * However, consider it!
 */

import { ModuleLoader, FileModuleStorage, CommandArguments, LtrfNode } from "../mod";
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
        return [s.count.toString()];
    });

    const wrapInCmd = (name: string) => (a: CommandArguments) =>
        [LtrfNode.make(name, {}, a.caOrErr(0))];
    const wrapInBlockCmd = (name: string) => (a: CommandArguments) =>
        [LtrfNode.make(name, { isBlock: true }, a.caOrErr(0))];

    l.exportCommand("title", wrapInBlockCmd("title"));
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
