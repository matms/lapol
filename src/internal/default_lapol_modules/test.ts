import { DetNode, Expr, Str, ModuleLoader } from "../../mod";

export async function load(loader: ModuleLoader) {
    loader.declareRequire("std:main");
    loader.exportCommands(commands);
    loader.exportAllCommandsFrom("std:main");
}

const commands = {
    hey: hey,
    hey_varargs: [hey_varargs, { varArgs: true }],
};

function hey(arg1: DetNode[]): DetNode {
    let a = arg1[0];
    if (a instanceof Str) return new Str(`Hello, ${a.text}`);
    throw new Error(":(");
}

function hey_varargs(arg1: DetNode[], ..._rest: DetNode[]): DetNode {
    let a = arg1[0];
    if (a instanceof Str) return new Str(`Hello, ${a.text}`);
    throw new Error(":(");
}
