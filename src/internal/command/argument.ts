import { DetNode } from "../det";

export type ArgumentEvaluationStrategy = "eager" | "lazy";

export type CmdSquareArg = number | string | boolean | DetNode;
export type CmdCurlyArg = DetNode[];

export interface CommandArguments {
    evaluation: ArgumentEvaluationStrategy;

    /** (Get) array of Curly Arguments */
    cas: () => CmdCurlyArg[];
    /** (Get) array of Square Arguments */
    sas: () => CmdSquareArg[];
    /** (Get) map of KeyWord Arguments */
    kwas: () => Map<string, CmdSquareArg>;

    /** (Get) Curly Argument by index */
    ca: ((idx: number, _default?: undefined) => CmdCurlyArg | undefined) &
        ((idx: number, _default: CmdCurlyArg) => CmdCurlyArg);

    /** (Get) Square Argument by index */
    sa: ((idx: number, _default?: undefined) => CmdSquareArg | undefined) &
        ((idx: number, _default: CmdSquareArg) => CmdSquareArg);

    /** (Get) KeyWord Argument by index */
    kwa: ((idx: string, _default?: undefined) => CmdSquareArg | undefined) &
        ((idx: string, _default: CmdSquareArg) => CmdSquareArg);
}

export class EagerCommandArguments implements CommandArguments {
    readonly evaluation: ArgumentEvaluationStrategy = "eager";
    readonly _curlyArgs: CmdCurlyArg[];
    readonly _squareArgs: CmdSquareArg[];
    readonly _keywordArgs: Map<string, CmdSquareArg>;

    constructor(
        keywordArgs: Map<string, CmdSquareArg>,
        squareArgs: CmdSquareArg[],
        curlyArgs: CmdCurlyArg[]
    ) {
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

    public cas(): CmdCurlyArg[] {
        return this._curlyArgs;
    }

    public sas(): CmdSquareArg[] {
        return this._squareArgs;
    }

    public kwas(): Map<string, CmdSquareArg> {
        return this._keywordArgs;
    }
}

// TODO: LazyCommandArgs -> Evaluate arg only upon request.
// export class LazyCommandArgs implements CommandArguments {}
