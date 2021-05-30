import { CommandArguments as Args } from "../internal/command/argument";
import { DetNode, Expr, Str, ModuleLoader } from "../mod";

export function load(loader: ModuleLoader): void {
    loader.exportCommands(commands);
}

const commands = {
    title: title,
    section: section,
    bf: bf,
    it: it,
};

function title(a: Args): DetNode {
    const [arg1] = a.cas();
    return new Expr("h1", arg1);
}

function section(a: Args): DetNode {
    return new Expr("h2", a.ca(0));
}

function bf(a: Args): DetNode {
    return new Expr("b", a.ca(0));
}

function it(a: Args): DetNode {
    return new Expr("i", a.ca(0));
}
