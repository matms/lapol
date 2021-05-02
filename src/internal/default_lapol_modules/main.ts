import { DetNode, Expr, Str, ModuleLoader } from "../../mod";

export function load(loader: ModuleLoader) {
    loader.exportCommands(commands);
}

const commands = {
    title: title,
    section: section,
    bf: bf,
    it: it,
};

function title(arg1: DetNode[]): DetNode {
    return new Expr("h1", arg1);
}

function section(arg1: DetNode[]): DetNode {
    return new Expr("h2", arg1);
}

function bf(arg1: DetNode[]): DetNode {
    return new Expr("b", arg1);
}

function it(arg1: DetNode[]): DetNode {
    return new Expr("i", arg1);
}
