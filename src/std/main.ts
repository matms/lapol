import { CommandArguments as Args } from "../internal/command/argument";
import { GenericHtmlTagOutputter, HtmlRootOutputter } from "../internal/output/html";
import { DetNode, Expr, Str, ModuleLoader } from "../mod";

export const mod = { loaderFn: load };

function load(l: ModuleLoader): void {
    l.declareTarget("html");

    l.exportCommand("title", title);
    l.exportCommand("section", section);
    l.exportCommand("bf", bf);
    l.exportCommand("it", it);

    const declareDefaultHtmlOutputter = ([tag, htmlTag]: string[]): void => {
        l.exportExprOutputter("html", tag, new GenericHtmlTagOutputter(tag, htmlTag));
    };

    [
        ["h1", "h1"],
        ["h2", "h2"],
        ["bold", "b"],
        ["italic", "i"],
    ].forEach(declareDefaultHtmlOutputter);
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
