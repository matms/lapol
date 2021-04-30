export const commands = {
    hey: hey,
    hey_varargs: [hey_varargs, { varArgs: true }],
    title: title,
    section: section,
};

import { DetNode, Expr, Str } from "../det";

function title(arg1: DetNode[]): DetNode {
    return new Expr("h1", arg1);
}

function section(arg1: DetNode[]): DetNode {
    return new Expr("h2", arg1);
}

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
