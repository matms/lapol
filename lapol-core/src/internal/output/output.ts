/** Outputting, AKA the "Back Pass" */

import { InternalFileContext, InternalLapolContext } from "../context";
import { DetNode, Expr, Str } from "../det";
import { LapolError } from "../errors";

// TODO: Inject
import { DefaultHtmlStrOutputter } from "./html";
import { NodeOutputter } from "./nodeOutputter";

export interface OutputTargetCfg {
    canonicalName: string;
    strOutputter: NodeOutputter<Str, OutputType>;
    exprOutputterMap: Map<string, NodeOutputter<Expr, OutputType>>;
}

export type OutputType = string;

export async function outputDet(
    lctx: InternalLapolContext,
    fctx: InternalFileContext,
    detRootNode: DetNode,
    target: string
): Promise<OutputType> {
    switch (target) {
        case "html": {
            return _outputDetHelper(detRootNode, makeHtmlOutputTargetCfg(lctx));
        }
        default:
            throw new LapolError(`Cannot currently output ${target}. TODO`);
    }
}

export function _outputDetHelper(processedRoot: DetNode, cfg: OutputTargetCfg): OutputType {
    const outputPass = new OutputPass<string>(cfg.strOutputter, cfg.exprOutputterMap);
    return outputPass.output(processedRoot);
}

export class OutputPass<T> {
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

// TODO: Allow other targets, abstract
function makeHtmlOutputTargetCfg(lctx: InternalLapolContext): OutputTargetCfg {
    const exprOutputterMap: Map<string, NodeOutputter<Expr, string>> = new Map();

    lctx.registry.exprMetas._storage.forEach((v, k) => {
        const outputter = v.outputters.get("html");
        if (outputter !== undefined) exprOutputterMap.set(k, outputter);
    });

    return {
        canonicalName: "html",
        strOutputter: new DefaultHtmlStrOutputter(),
        exprOutputterMap: exprOutputterMap,
    };
}
