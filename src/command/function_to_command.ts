import { DetNode, DetNodeKind } from "../det";
import { AstEvaluationError } from "../errors";
import { Command } from "./command";

/** Transform a Javascript function `func` into a command named `cmdName`.
 *  Returns the command.
 */
export function functionToCommand(func: Function, cmdName: string): Command {
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
