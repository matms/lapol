import { strict as assert } from "assert";
import { DetNode } from "../det";
import { AstEvaluationError } from "../errors";

export enum CommandKind {
    CommandKind = "CommandKind",
}

/** A Lapol Command definition.
 *
 * A Lapol Command is a function that takes in zero or more arguments and returns a `DetNode`.
 * Each argument is an array of `DetNode`s.
 *
 * To generate a command, see `functionToCommand` (in the similarly-named module).
 *
 * Not to be confused with an `AstCommandNode` which represents an _invocation_ of a Command. */
export interface Command {
    kind: CommandKind.CommandKind;
    cmdName: string;
    curlyArity: number | "any";
    fn: (args: DetNode[][]) => DetNode;
}

/** Execute the command `command`, given arguments `args`.
 *  Returns a `DetNode`.
 */
export function callCommand(command: Command, args: DetNode[][]): DetNode {
    // This check is important since typescript type information may be lost when
    // saving commands into the environment.
    assert(command.kind === CommandKind.CommandKind);

    if (command.curlyArity !== "any" && args.length !== command.curlyArity) {
        throw new AstEvaluationError(`Command (name: ${command.cmdName}) arity mismatch.`);
    }

    return command.fn(args);
}
