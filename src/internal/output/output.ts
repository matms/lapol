/** Outputting, AKA the "Back Pass" */

import { DetNode, Expr, Str } from "../det";
import { LapolError } from "../errors";
import { DefaultHtmlStrOutputter, GenericHtmlTagOutputter, HtmlRootOutputter } from "./html";
import { NodeOutputter } from "./node_outputter";

export interface OutputData {
    str: string;
}

export async function outputDet(detRootNode: DetNode, target: string): Promise<OutputData> {
    switch (target) {
        case "html": {
            const defaultHtmlStringOutputter = new DefaultHtmlStrOutputter();
            // TODO: Take in the appropriate map for the current target.
            const exprOutputterMap = new Map();
            exprOutputterMap.set("root", new HtmlRootOutputter());
            exprOutputterMap.set("h1", new GenericHtmlTagOutputter("h1", "h1"));
            exprOutputterMap.set("h2", new GenericHtmlTagOutputter("h2", "h2"));
            exprOutputterMap.set("doc", new GenericHtmlTagOutputter("doc", "div"));
            exprOutputterMap.set("p", new GenericHtmlTagOutputter("p", "p"));
            exprOutputterMap.set("i", new GenericHtmlTagOutputter("i", "i"));
            const outputter = new OutputCtx<string>(defaultHtmlStringOutputter, exprOutputterMap);
            return { str: outputter.output(detRootNode) };
        }

        default:
            throw new LapolError(`Unknown compilation target language ${target}.`);
    }
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
