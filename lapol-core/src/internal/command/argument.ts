import { LapolError } from "../errors";
import { LtrfObj } from "../ltrf/ltrf";

export type ArgumentEvaluationStrategy = "eager" | "lazy";

export type CmdSquareArg = number | string | boolean | LtrfObj;
export type CmdCurlyArg = readonly LtrfObj[];

export abstract class CommandArguments {
    abstract readonly evaluation: ArgumentEvaluationStrategy;

    /** (Get) array of Curly Arguments */
    public abstract cas(): readonly CmdCurlyArg[];
    /** (Get) array of Square Arguments */
    public abstract sas(): readonly CmdSquareArg[];
    /** (Get) map of KeyWord Arguments */
    public abstract kwas(): ReadonlyMap<string, CmdSquareArg>;

    /** (Get) Curly Argument by index */
    public abstract ca(idx: number, _default?: undefined): CmdCurlyArg | undefined;
    public abstract ca(idx: number, _default: CmdCurlyArg): CmdCurlyArg;

    /** (Get) Square Argument by index */
    public abstract sa(idx: number, _default?: undefined): CmdSquareArg | undefined;
    public abstract sa(idx: number, _default: CmdSquareArg): CmdSquareArg;

    /** (Get) KeyWord Argument by index */
    public abstract kwa(idx: string, _default?: undefined): CmdSquareArg | undefined;
    public abstract kwa(idx: string, _default: CmdSquareArg): CmdSquareArg;

    /** (Get) Curly Argument by index. Throws an error if the given argument does not exist. */
    public caOrErr(idx: number): CmdCurlyArg {
        const o = this.ca(idx);
        if (o === undefined)
            throw new LapolError(
                `caOrErr(${idx}) -> Curly argument undefined (Likely not provided).`
            );
        return o;
    }

    /** (Get) Square Argument by index. Throws an error if the given argument does not exist. */
    public saOrErr(idx: number): CmdSquareArg {
        const o = this.sa(idx);
        if (o === undefined)
            throw new LapolError(
                `saOrErr(${idx}) -> Square argument undefined (Likely not provided).`
            );
        return o;
    }

    /** (Get) KeyWord Argument by index. Throws an error if the given argument does not exist. */
    public kwaOrErr(idx: string): CmdSquareArg {
        const o = this.kwa(idx);
        if (o === undefined)
            throw new LapolError(
                `kwaOrErr(${idx}) -> Keyword argument undefined (Likely not provided).`
            );
        return o;
    }
}

export class EagerCommandArguments extends CommandArguments {
    readonly evaluation: ArgumentEvaluationStrategy = "eager";
    readonly _curlyArgs: readonly CmdCurlyArg[];
    readonly _squareArgs: readonly CmdSquareArg[];
    readonly _keywordArgs: ReadonlyMap<string, CmdSquareArg>;

    constructor(
        keywordArgs: ReadonlyMap<string, CmdSquareArg>,
        squareArgs: readonly CmdSquareArg[],
        curlyArgs: readonly CmdCurlyArg[]
    ) {
        super();
        this._keywordArgs = keywordArgs;
        this._squareArgs = squareArgs;
        this._curlyArgs = curlyArgs;
    }

    public ca(idx: number, _default?: undefined): CmdCurlyArg | undefined;
    public ca(idx: number, _default: CmdCurlyArg): CmdCurlyArg;

    public ca(idx: number, _default?: CmdCurlyArg): CmdCurlyArg | undefined {
        const arg = this._curlyArgs[idx];
        if (arg === undefined) return _default;
        return arg;
    }

    public sa(idx: number, _default?: undefined): CmdSquareArg | undefined;
    public sa(idx: number, _default: CmdSquareArg): CmdSquareArg;

    public sa(idx: number, _default?: CmdSquareArg): CmdSquareArg | undefined {
        const arg = this._squareArgs[idx];
        if (arg === undefined) return _default;
        return arg;
    }

    public kwa(idx: string, _default?: undefined): CmdSquareArg | undefined;
    public kwa(idx: string, _default: CmdSquareArg): CmdSquareArg;

    public kwa(idx: string, _default?: CmdSquareArg): CmdSquareArg | undefined {
        const arg = this._keywordArgs.get(idx);
        if (arg === undefined) return _default;
        return arg;
    }

    public cas(): readonly CmdCurlyArg[] {
        return this._curlyArgs;
    }

    public sas(): readonly CmdSquareArg[] {
        return this._squareArgs;
    }

    public kwas(): ReadonlyMap<string, CmdSquareArg> {
        return this._keywordArgs;
    }
}

// TODO: LazyCommandArgs -> Evaluate arg only upon request.
// export class LazyCommandArgs extends CommandArguments {}
