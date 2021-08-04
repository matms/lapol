import { Expr } from "./det";
import { LapolError } from "./errors";
import { NodeOutputter } from "./output/output";

const DEFAULTS: Map<string, boolean> = new Map();
DEFAULTS.set("isBlock", false);

type _AllowUndefinedProps<T> = {
    [Propriety in keyof T]+?: T[Propriety];
};

export type ExprMetaCfgDeclaration = _AllowUndefinedProps<ExprMetaCfg>;

export interface ExprMetaCfg {
    /** Defaults to false */
    isBlock: boolean;
}

function makeExprMetaCfg(from: ExprMetaCfgDeclaration): ExprMetaCfg {
    // See docs for ExprMetaCfg to find the default values.
    return {
        isBlock: from.isBlock ?? false,
    };
}

export class ExprMeta {
    public readonly outputters: Map<string, NodeOutputter<Expr, string>>;
    public readonly cfg: ExprMetaCfg;

    constructor(cfg: ExprMetaCfgDeclaration) {
        this.outputters = new Map();
        this.cfg = makeExprMetaCfg(cfg);
    }

    public declareOutputter(target: string, outputter: NodeOutputter<Expr, string>): void {
        if (this.outputters.has(target))
            throw new LapolError(`Outputter re-declaration not permitted (target = ${target})`);
        this.outputters.set(target, outputter);
    }
}
