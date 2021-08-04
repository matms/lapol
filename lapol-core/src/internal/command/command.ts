import { DetNode } from "../det";
import { LapolError } from "../errors";
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
    private readonly _fn: (a: CommandArguments, ctx: CommandContext) => DetNode;

    private constructor(name: string, fn: (a: CommandArguments, ctx: CommandContext) => DetNode) {
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
    public static fromJsFunction(
        func: (a: CommandArguments, ctx: CommandContext) => DetNode | undefined,
        cmdName: string,
        options?: Record<string, boolean>
    ): JsFnCommand {
        if (options === undefined) options = {};

        // let varArgs = cfgBool(options.varArgs, false);
        // let curlyArity: number | "any" = varArgs ? "any" : func.length;

        // TODO: Is this valid?
        if (func.length !== 1 && func.length !== 2) {
            throw new LapolError(
                "JsFnCommand should be formed from JS functions taking one or two arguments."
            );
        }

        const cmdFn = (a: CommandArguments, ctx: CommandContext): DetNode => {
            const out = func(a, ctx);

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
    public call(args: CommandArguments, ctx: CommandContext): DetNode | undefined {
        return this._fn(args, ctx);
    }
}
