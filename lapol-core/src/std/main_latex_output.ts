import { ModuleLoader } from "../mod";
import {
    makeLatexBlockOutputter,
    makeLatexNoCurlyCommandOutputter,
    makeLatexSingleCurlyCommandOutputter,
} from "./output/latexTagOutputter";

export const mod = { loaderFn: load };

function load(l: ModuleLoader): void {
    l.requireName("std::main::latex_output");

    l.declareInstantiator(() => {
        return {
            moduleName: "std::main::latex_output",
        };
    });

    l.declareTarget("latex");

    l.exportLtrfNodeOutputter("latex", "maketitle", makeLatexNoCurlyCommandOutputter("maketitle"));

    l.exportLtrfNodeOutputter("latex", "sec", makeLatexSingleCurlyCommandOutputter("section"));
    l.exportLtrfNodeOutputter(
        "latex",
        "subsec",
        makeLatexSingleCurlyCommandOutputter("subsection")
    );
    l.exportLtrfNodeOutputter(
        "latex",
        "subsubsec",
        makeLatexSingleCurlyCommandOutputter("subsubsection")
    );

    l.exportLtrfNodeOutputter("latex", "bold", makeLatexSingleCurlyCommandOutputter("textbf"));
    l.exportLtrfNodeOutputter("latex", "italic", makeLatexSingleCurlyCommandOutputter("textit"));

    l.exportLtrfNodeOutputter("latex", "bquot", makeLatexBlockOutputter("lapoldefaultblockquote"));
    l.exportLtrfNodeOutputter(
        "latex",
        "marginnote",
        makeLatexSingleCurlyCommandOutputter("lapoldefaultaside")
    );
}
