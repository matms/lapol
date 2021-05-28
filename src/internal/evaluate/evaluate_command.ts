import { strict as assert } from "assert";
import { AstCommandNode, AstNodeKind } from "../ast";
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

    const out = command.call(commandArguments);

    if (out === undefined) {
        // Splicing in an empty array means adding nothing to the DET.
        return new Expr(SPLICE_EXPR, []);
    } else return out;
}

function evaluateEagerCommandArguments(
    commandNode: AstCommandNode,
    env: Environment
): EagerCommandArguments {
    // TODO: Square Args
    const evalKeywordArgs = new Map();

    // TODO: Keyword Args
    const evalSquareArgs: CmdSquareArg[] = [];

    const evalCurlyArgs: DetNode[][] = [];
    for (const curlyArg of commandNode.curlyArgs) {
        evalCurlyArgs.push(evaluateNodeArray(curlyArg, env));
    }

    return new EagerCommandArguments(evalKeywordArgs, evalSquareArgs, evalCurlyArgs);
}
