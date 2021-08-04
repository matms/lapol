import { DetNode } from "../det";
import { OutputPass } from "./output";

// Cf. `ModuleTarget`
export abstract class NodeOutputter<N extends DetNode, T> {
    abstract nodeKind: "Str" | "Expr";
    abstract nodeTag: string | undefined;
    public abstract output(ctx: OutputPass<T>, node: N): T;
}
