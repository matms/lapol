import { strict as assert } from "assert";
import { DetNode } from "../det";
import { LapolError } from "../errors";

export class Command {
    private readonly _kind = "Command";
    private _name: string;
    private _curlyArity: number | "any";
    private _fn: (args: DetNode[][]) => DetNode | undefined;

    private constructor(
        name: string,
        curlyArity: number | "any",
        fn: (args: DetNode[][]) => DetNode | undefined
    ) {
        this._name = name;
        this._curlyArity = curlyArity;
        this._fn = fn;
    }

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
    public static fromJsFunction(func: Function, cmdName: string, options?: any): Command {
        if (options === undefined) options = {};

        let varArgs = cfgBool(options.varArgs, false);
        let curlyArity: number | "any" = varArgs ? "any" : func.length;
        let cmdFn = (args: DetNode[][]) => {
            let out = func(...args);
            if (!(out instanceof DetNode)) {
                throw new LapolError(
                    "Function defining Lapol Command returned object that appears not to be " +
                        "of type DetNode" +
                        `Command name: ${cmdName}`
                );
            }
            return out;
        };

        return new Command(cmdName, curlyArity, cmdFn);
    }

    /** Execute the command `command`, given arguments `args`.
     *  Returns a `DetNode` or undefined to mean nothing.
     */
    public call(args: DetNode[][]): DetNode | undefined {
        if (this._curlyArity !== "any" && args.length !== this._curlyArity) {
            throw new LapolError(`Command (name: ${this._name}) arity mismatch.`);
        }

        return this._fn(args);
    }
}

function cfgBool(cfg: any, defaultCfg: boolean): boolean {
    if (cfg === undefined) return defaultCfg;
    if (typeof cfg !== "boolean") throw new TypeError("Boolean configuration required.");
    return cfg;
}
