import { strict as assert } from "assert";
import { AstCommandNode, AstNodeKind, SquareEntry } from "../ast";
import { CmdSquareArg, EagerCommandArguments } from "../command/argument";
import { Command } from "../command/command";
import { CommandContext } from "../command/context";
import { InternalFileContext, InternalLapolContext } from "../context";
import { DetNode, Expr } from "../det";
import { LapolError } from "../errors";
import { Environment } from "./environment";
import { evaluateNodeArray, SPLICE_EXPR } from "./evaluate";

export function evaluateCommand(
    commandNode: AstCommandNode,
    lctx: InternalLapolContext,
    fctx: InternalFileContext,
    env: Environment
): DetNode {
    assert(commandNode.t === AstNodeKind.AstCommandNode);

    const command = env.lookupCommand(commandNode.commandName);

    if (command === undefined) {
        throw new LapolError(`Command (name: ${commandNode.commandName}) not in environment.`);
    } else if (!(command instanceof Command)) {
        throw new LapolError(`Value (command name: ${commandNode.commandName}) is not a Command.`);
    }

    // TODO: Allow lazy commands!
    assert(command.argumentEvaluation === "eager");

    const commandArguments = evaluateEagerCommandArguments(commandNode, lctx, fctx, env);

    const out = command.call(
        commandArguments,
        new CommandContext(lctx, fctx, env, env.rootNamespace)
    );

    if (out === undefined) {
        // Splicing in an empty array means adding nothing to the DET.
        return new Expr(SPLICE_EXPR, []);
    } else return out;
}

function evaluateEagerCommandArguments(
    commandNode: AstCommandNode,
    lctx: InternalLapolContext,
    fctx: InternalFileContext,
    env: Environment
): EagerCommandArguments {
    const evalKeywordArgs: Map<string, CmdSquareArg> = new Map();
    const evalSquareArgs: CmdSquareArg[] = [];

    if (commandNode.squareArgs !== null) {
        for (const sq of commandNode.squareArgs) {
            switch (sq.t) {
                case "Val": {
                    evalSquareArgs.push(evaluateSquareEntry(sq.c, lctx, fctx, env));
                    break;
                }
                case "KeyVal": {
                    const [key, val] = sq.c;
                    const keyEval = evaluateSquareEntry(key, lctx, fctx, env);
                    if (typeof keyEval !== "string")
                        throw new LapolError(`Key for Keyword argument must evaluate to string.`);
                    evalKeywordArgs.set(keyEval, evaluateSquareEntry(val, lctx, fctx, env));
                    break;
                }
            }
        }
    }

    const evalCurlyArgs: DetNode[][] = [];
    for (const curlyArg of commandNode.curlyArgs) {
        evalCurlyArgs.push(evaluateNodeArray(curlyArg, lctx, fctx, env));
    }

    return new EagerCommandArguments(evalKeywordArgs, evalSquareArgs, evalCurlyArgs);
}

function evaluateSquareEntry(
    v: SquareEntry,
    lctx: InternalLapolContext,
    fctx: InternalFileContext,
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
            return evaluateCommand(v.c, lctx, fctx, env);
        }
    }
}
