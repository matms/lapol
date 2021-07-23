/** Outputting, AKA the "Back Pass" */

import { InternalLapolContext } from "../context";
import { DetNode, Expr, Str } from "../det";
import { LapolError } from "../errors";
import { DefaultHtmlStrOutputter } from "./html";
import { NodeOutputter } from "./node_outputter";

// Cf. `ModuleTarget`
export interface OutputTarget {
    exprOutputters: Map<string, NodeOutputter<Expr, unknown>>;
}

export interface OutputData {
    str: string;
}

export async function outputDet(
    lctx: InternalLapolContext,
    detRootNode: DetNode,
    target: string
): Promise<OutputData> {
    // TODO: Allow user configuration of the string outputter.
    let strOutputter;
    switch (target) {
        case "html": {
            strOutputter = new DefaultHtmlStrOutputter();
            break;
        }
        default:
            throw new LapolError(`Need to setup string outputter for ${target}. TODO`);
    }

    // TODO: Is this approach too inefficient?
    const exprOutputterMap = new Map();

    lctx.registry.exprMetas._storage.forEach((v, k) => {
        const outputter = v.outputters.get(target);
        if (outputter !== undefined) exprOutputterMap.set(k, outputter);
    });

    const outputter = new OutputCtx<string>(strOutputter, exprOutputterMap);
    return { str: outputter.output(detRootNode) };
}

export class OutputCtx<T> {
    readonly strOutputter: NodeOutputter<Str, T>;
    readonly exprOutputterMap: Map<string, NodeOutputter<Expr, T>>; // TODO: Type.

    constructor(
        strOutputter: NodeOutputter<Str, T>,
        exprOutputterMap: Map<string, NodeOutputter<Expr, T>>
    ) {
        this.strOutputter = strOutputter;
        this.exprOutputterMap = exprOutputterMap;
    }

    public output(node: DetNode): T {
        switch (node.kind) {
            case "Str":
                return this.strOutputter.output(this, node as Str);
            case "Expr": {
                const nodeAsExpr = node as Expr;
                const nodeOutputter = this.exprOutputterMap.get(nodeAsExpr.tag);
                if (nodeOutputter === undefined)
                    throw new LapolError(
                        `No outputter registered for Expr of tag ${nodeAsExpr.tag}`
                    );
                return nodeOutputter.output(this, nodeAsExpr);
            }
            case "Data":
                throw new LapolError(`DET Node of type Data cannot be outputted.`);
        }
    }
}
