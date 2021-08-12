import { FileContext } from "../context/fileContext";
import { LapolContext } from "../context/lapolContext";
import { LtrfNode, LtrfStr } from "../ltrf/ltrf";

export type LtrfStrOutputter = (obj: LtrfStr, ctx: OutputCtx) => Output;
export type LtrfNodeOutputter = (obj: LtrfNode, ctx: OutputCtx) => Output;

/* TODO Abstract through methods, forbid direct access! */
export interface Output {
    readonly code: string;
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
