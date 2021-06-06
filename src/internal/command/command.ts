import { strict as assert } from "assert";
import { DetNode } from "../det";
import { LapolError } from "../errors";
import { Environment } from "../evaluate/environment";
import { ArgumentEvaluationStrategy, CommandArguments } from "./argument";
import { CommandContext } from "./context";

type CommandKind = "JsFnCommand" | "Other";

export abstract class Command {
    // TODO: Allow lazy commands.
    public readonly argumentEvaluation: ArgumentEvaluationStrategy = "eager";
    protected readonly _kind: CommandKind;
    protected _name: string;

    protected constructor(kind: CommandKind, name: string) {
        this._kind = kind;
        this._name = name;
    }

    public abstract call(args: CommandArguments, ctx: CommandContext): DetNode | undefined;
}

export class JsFnCommand extends Command {
    private readonly _fn: (a: CommandArguments) => DetNode;

    private constructor(name: string, fn: (a: CommandArguments) => DetNode) {
        super("JsFnCommand", name);
        this._fn = fn;
    }

    /** Transform a Javascript function `func` into a command named `cmdName`.
     * Returns the command.
     *
     * If `options` is not provided, all configurations will be assumed to be default.
     *
     * Options:
     *  none, currently.
     */
    public static fromJsFunction(func: Function, cmdName: string, options?: any): JsFnCommand {
        if (options === undefined) options = {};

        // let varArgs = cfgBool(options.varArgs, false);
        // let curlyArity: number | "any" = varArgs ? "any" : func.length;

        if (func.length !== 1) {
            throw new LapolError(
                "JsFnCommand should be formed from JS functions taking a single argument."
            );
        }

        const cmdFn = (a: CommandArguments): DetNode => {
            const out = func(a);

            if (!(out instanceof DetNode)) {
                throw new LapolError(
                    "Function defining Lapol Command returned object that appears not to be " +
                        "of type DetNode" +
                        `Command name: ${cmdName}`
                );
            }

            return out;
        };

        return new JsFnCommand(cmdName, cmdFn);
    }

    /** Execute the command `command`, given arguments `args`.
     *  Returns a `DetNode` or undefined to mean nothing.
     */
    public call(args: CommandArguments): DetNode | undefined {
        return this._fn(args);
    }
}

/*
function cfgBool(cfg: any, defaultCfg: boolean): boolean {
    if (cfg === undefined) return defaultCfg;
    if (typeof cfg !== "boolean") throw new TypeError("Boolean configuration required.");
    return cfg;
}
*/
