import { FileContext } from "../context/fileContext";
import { LapolContext } from "../context/lapolContext";
import { LapolError } from "../errors";
import { LtrfNode, LtrfStr } from "../ltrf/ltrf";
import { FileModuleStorage } from "../module/module";
import { OutputRequirementReceiver } from "./outRequirements/outRequirements";

export type LtrfStrOutputter = (obj: LtrfStr, ctx: OutputCtx) => Output;
export type LtrfNodeOutputter = (obj: LtrfNode, ctx: OutputCtx) => Output;

/* TODO Abstract through methods, forbid direct access! */
export interface Output {
    readonly code: string;
}

export class OutputCtx {
    private readonly _lctx: LapolContext;
    private readonly _fctx: FileContext;
    private readonly _target: string;
    private readonly _dispatcher: OutputDispatcher;
    private readonly _reqReceiver: OutputRequirementReceiver;

    constructor(
        lctx: LapolContext,
        fctx: FileContext,
        target: string,
        dispatcher: OutputDispatcher,
        reqReceiver: OutputRequirementReceiver
    ) {
        this._lctx = lctx;
        this._fctx = fctx;
        this._target = target;
        this._dispatcher = dispatcher;
        this._reqReceiver = reqReceiver;
    }

    get lctx(): LapolContext {
        return this._lctx;
    }

    get fctx(): FileContext {
        return this._fctx;
    }

    get target(): string {
        return this._target;
    }

    get dispatcher(): OutputDispatcher {
        return this._dispatcher;
    }

    get reqReceiver(): OutputRequirementReceiver {
        return this._reqReceiver;
    }

    /** WARNING: In general, you should NOT access the File Module Storage for other modules,
     * only for your own! However, this capability is still provided for the rare cases where
     * you may want to do that.
     */
    public getFileModuleStorage(modName: string): FileModuleStorage {
        const out = this._fctx.moduleStorage.get(modName);
        if (out === undefined) throw new LapolError(`FileModuleStorage for ${modName} not found.`);
        return out;
    }
}

export interface OutputDispatcher {
    getLtrfStrOutputter: (str: LtrfStr) => LtrfStrOutputter;
    getLtrfNodeOutputter: (node: LtrfNode) => LtrfNodeOutputter;
}
