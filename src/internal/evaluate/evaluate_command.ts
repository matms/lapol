import { strict as assert } from "assert";
import { AstCommandNode, AstNodeKind, SquareEntry } from "../ast";
import { CmdSquareArg, EagerCommandArguments } from "../command/argument";
import { Command } from "../command/command";
import { DetNode, Expr } from "../det";
import { LapolError } from "../errors";
import { Environment } from "./environment";
import { evaluateNodeArray, SPLICE_EXPR } from "./evaluate";

export function evaluateCommand(commandNode: AstCommandNode, env: Environment): DetNode {
    assert(commandNode.t === AstNodeKind.AstCommandNode);

    const command = env.lookupCommand(commandNode.commandName);

    if (command === undefined) {
        throw new LapolError(`Command (name: ${commandNode.commandName}) not in environment.`);
    } else if (!(command instanceof Command)) {
        throw new LapolError(`Value (command name: ${commandNode.commandName}) is not a Command.`);
    }

    assert(command.argumentEvaluation === "eager"); // TODO: Allow lazy commands!

    const commandArguments = evaluateEagerCommandArguments(commandNode, env);

    const out = command.call(commandArguments, { currNamespace: env.rootNamespace });

    if (out === undefined) {
        // Splicing in an empty array means adding nothing to the DET.
        return new Expr(SPLICE_EXPR, []);
    } else return out;
}

function evaluateEagerCommandArguments(
    commandNode: AstCommandNode,
    env: Environment
): EagerCommandArguments {
    const evalKeywordArgs: Map<string, CmdSquareArg> = new Map();
    const evalSquareArgs: CmdSquareArg[] = [];

    // TODO
    if (commandNode.squareArgs !== null) {
        for (const sq of commandNode.squareArgs) {
            switch (sq.t) {
                case "Val": {
                    evalSquareArgs.push(evaluateSquareEntry(sq.c, env));
                    break;
                }
                case "KeyVal": {
                    const [key, val] = sq.c;
                    const keyEval = evaluateSquareEntry(key, env);
                    if (typeof keyEval !== "string")
                        throw new LapolError(`Key for Keyword argument must evaluate to string.`);
                    evalKeywordArgs.set(keyEval, evaluateSquareEntry(val, env));
                    break;
                }
            }
        }
    }

    const evalCurlyArgs: DetNode[][] = [];
    for (const curlyArg of commandNode.curlyArgs) {
        evalCurlyArgs.push(evaluateNodeArray(curlyArg, env));
    }

    return new EagerCommandArguments(evalKeywordArgs, evalSquareArgs, evalCurlyArgs);
}

function evaluateSquareEntry(
    v: SquareEntry,
    env: Environment
): string | boolean | number | DetNode {
    switch (v.t) {
        case "Bool":
        case "Ident":
        case "Num":
        case "QuotedStr": {
            return v.c;
        }
        case "AstNode": {
            assert(v.c.t === "AstCommandNode");
            return evaluateCommand(v.c, env);
        }
    }
}
