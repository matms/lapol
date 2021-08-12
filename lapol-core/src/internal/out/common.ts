import { FileContext } from "../context/fileContext";
import { LapolContext } from "../context/lapolContext";
import { LtrfNode, LtrfStr } from "../ltrf/ltrf";

export type LtrfStrOutputter = (obj: LtrfStr, ctx: OutputCtx) => Output;
export type LtrfNodeOutputter = (obj: LtrfNode, ctx: OutputCtx) => Output;

/* TODO Abstract through methods, forbid direct access! */
export class Output {
    private readonly _code: string;
    private readonly _requirements: readonly string[]; // TODO

    private constructor(code: string, requirements: readonly string[]) {
        this._code = code;
        this._requirements = requirements;
    }

    public _getCode(): string {
        return this._code;
    }

    /** Represent the output of some source code, with no associated requirements. */
    public static makeCode(code: string): Output {
        return new Output(code, []);
    }

    /** Compose two outputs. Order matters, but _should_ be associative. */
    public compose(other: Output): Output {
        return new Output(this._code + other._code, this._requirements.concat(other._requirements));
    }

    /** Replace the source code with newCode, but PRESERVE requirements. */
    public withCode(newCode: string): Output {
        return new Output(newCode, this._requirements);
    }

    /** Replace the source code according to function f, but PRESERVE requirements. */
    public mapCode(f: (oldCode: string) => string): Output {
        return new Output(f(this._code), this._requirements);
    }
}

export interface OutputCtx {
    lctx: LapolContext;
    fctx: FileContext;
    target: string;
    dispatcher: OutputDispatcher;
}

export interface OutputDispatcher {
    getLtrfStrOutputter: (str: LtrfStr) => LtrfStrOutputter;
    getLtrfNodeOutputter: (node: LtrfNode) => LtrfNodeOutputter;
}
