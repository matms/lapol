import { strict as assert } from "assert";
import { DetNode, DetNodeKind } from "./det";
import { AstEvaluationError } from "./errors";

export interface Command {
    kind: "Command";
    cmdName: string;
    curlyArity: number | "any";
    fn: (args: DetNode[][]) => DetNode;
}

export function callCommand(command: Command, args: DetNode[][]): DetNode {
    // This check is important since typescript type information may be lost when
    // saving commands into the environment.
    assert(command.kind === "Command");

    if (command.curlyArity !== "any" && args.length !== command.curlyArity) {
        throw new AstEvaluationError(`Command (name: ${command.cmdName}) arity mismatch.`);
    }

    return command.fn(args);
}

export function fnToCommand(func: Function, cmdName: string): Command {
    return {
        kind: "Command",
        cmdName: cmdName,
        curlyArity: func.length,
        fn: (args: DetNode[][]) => {
            let out = func(...args);
            if (typeof out !== "object" || !(out.kind in DetNodeKind)) {
                throw new AstEvaluationError(
                    "Function defining Lapol Command returned object that appears not to be " +
                        "of type DetNode"
                );
            }
            return out;
        },
    };
}
