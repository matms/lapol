import { LapolError } from "../errors";
import { isLtrfObj, LtrfObj } from "../ltrf/ltrf";
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

    public abstract call(args: CommandArguments, ctx: CommandContext): readonly LtrfObj[];
}

export class JsFnCommand extends Command {
    private readonly _fn: (a: CommandArguments, ctx: CommandContext) => readonly LtrfObj[];

    private constructor(
        name: string,
        fn: (a: CommandArguments, ctx: CommandContext) => readonly LtrfObj[]
    ) {
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
        func: (a: CommandArguments, ctx: CommandContext) => unknown,
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

        const cmdFn = (a: CommandArguments, ctx: CommandContext): readonly LtrfObj[] => {
            const out = func(a, ctx);

            // TODO: Is this check a performance nuisance?
            if (!(out instanceof Array) || !out.every((v) => isLtrfObj(v))) {
                throw new LapolError(
                    "Function defining Lapol Command returned object that appears not to be " +
                        "a LtrfObj Array" +
                        `Command name: ${cmdName}`
                );
            }

            return out as readonly LtrfObj[];
        };

        return new JsFnCommand(cmdName, cmdFn);
    }

    /** Execute the command `command`, given arguments `args`.
     *  Returns a `DetNode` or undefined to mean nothing.
     */
    public call(args: CommandArguments, ctx: CommandContext): readonly LtrfObj[] {
        // TODO: Throw if function returns undefined or single node, warn user that it is flattened
        // so they have to return a (readonly) array.
        const o: readonly LtrfObj[] = this._fn(args, ctx);
        if (!(o instanceof Array))
            throw new LapolError("Commands should return an array. This array will be flattened!");
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return o;
    }
}
