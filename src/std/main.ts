import { CommandArguments as Args } from "../internal/command/argument";
import { DetNode, Expr, Str, ModuleLoader } from "../mod";

export const mod = { loaderFn: load };

function load(l: ModuleLoader): void {
    l.exportCommand("title", title);
    l.exportCommand("section", section);
    l.exportCommand("bf", bf);
    l.exportCommand("it", it);

    l.declareExprMeta("title", { isBlock: true });
    l.declareExprMeta("title", { isBlock: true });
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
