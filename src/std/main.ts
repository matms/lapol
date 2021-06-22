import { CommandArguments as Args } from "../internal/command/argument";
import { DetNode, Expr, Str, ModuleLoader } from "../mod";
import { mod as htmlOutputMod } from "./main_html_output";
import { mod as latexOutputMod } from "./main_latex_output";

export const mod = { loaderFn: load };

function load(l: ModuleLoader): void {
    l.exportCommand("title", title);
    l.exportCommand("section", section);
    l.exportCommand("bf", bf);
    l.exportCommand("it", it);

    l.declareExprMeta("h1", { isBlock: true });
    l.declareExprMeta("h2", { isBlock: true });
    l.declareExprMeta("bold", { isBlock: false });
    l.declareExprMeta("italic", { isBlock: false });

    if (l.hasTarget("html")) {
        l.declareSubModule("std::main::html_output", htmlOutputMod);
    }

    if (l.hasTarget("latex")) {
        l.declareSubModule("std::main::latex_output", latexOutputMod);
    }
}

function title(a: Args): DetNode {
    const [arg1] = a.cas();
    return new Expr("h1", arg1);
}

function section(a: Args): DetNode {
    return new Expr("h2", a.ca(0));
}

function bf(a: Args): DetNode {
    return new Expr("bold", a.ca(0));
}

function it(a: Args): DetNode {
    return new Expr("italic", a.ca(0));
}
