import { DetNodeType, DetNodeKind } from "../det";
import { AstEvaluationError } from "../errors";
import { Command, CommandKind } from "./command";

/** Transform a Javascript function `func` into a command named `cmdName`.
 * Returns the command.
 *
 * If `options` is not provided, all configurations will be assumed to be default.
 *
 * Options:
 * - `varArgs` (boolean):
 *   If true, the command will accept any number of curly args.
 *   If false, the command will require a specific number of curly args (depending on `func`'s
 *   signature).
 */
export function functionToCommand(func: Function, cmdName: string, options?: any): Command {
    if (options === undefined) options = {};

    let varArgs = cfgBool(options.varArgs, false);

    return {
        kind: CommandKind.CommandKind,
        cmdName: cmdName,
        curlyArity: varArgs ? "any" : func.length,
        fn: (args: DetNodeType[][]) => {
            let out = func(...args);
            if (typeof out !== "object" || !Object.values(DetNodeKind).includes(out.kind)) {
                throw new AstEvaluationError(
                    "Function defining Lapol Command returned object that appears not to be " +
                        "of type DetNode" +
                        `Command name: ${cmdName}`
                );
            }
            return out;
        },
    };
}

function cfgBool(cfg: any, defaultCfg: boolean): boolean {
    if (cfg === undefined) return defaultCfg;
    if (typeof cfg !== "boolean") throw new TypeError("Boolean configuration required.");
    return cfg;
}
