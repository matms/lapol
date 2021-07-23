import { DetNode } from "../det";
import { OutputCtx } from "./output";

export abstract class NodeOutputter<N extends DetNode, T> {
    abstract nodeKind: "Str" | "Expr";
    abstract nodeTag: string | undefined;
    public abstract output(ctx: OutputCtx<T>, node: N): T;
}
