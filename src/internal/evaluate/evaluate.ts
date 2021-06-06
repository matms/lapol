/** Evaluation, AKA the "Front Pass"
 *
 * This pass takes in the AST (Abstract Syntax Tree), and outputs a DET (Document Expression Tree)
 */

import { strict as assert } from "assert";
import { AstNode, AstNodeKind, AstRootNode, AstTextNode } from "../ast";
import { InternalLapolContext } from "../context";
import { DetNode, Expr, Str } from "../det";
import { LapolError } from "../errors";
import { Environment } from "./environment";
import { evaluateCommand } from "./evaluate_command";
import { evaluateRoot } from "./root";

// TODO: better solution for passthrough argument lctx?
// Consider: Making evaluator class, storing lctx in environment.

/** An Expr(tag = SPLICE_EXPR) node will be spliced into the surrounding node. That is, the subnodes
 * of this node will become part of the surrounding node's subnodes.
 */
export const SPLICE_EXPR = "splice";

/** Evaluate the Abstract Syntax Tree. Returns a DetNode.
 *
 * Parameter `node` should be the root of the AST.
 *
 * TODO: Should this be async? It seems unnecessary!
 */
export async function evaluateAst(
    lctx: InternalLapolContext,
    node: AstRootNode,
    filePath: string
): Promise<DetNode> {
    return evaluateRoot(lctx, node, filePath);
}

/** Evaluate `node` using environment `env`, returns a `DetNode`.
 *
 * Note this function dispatches to `evaluate*` (e.g. `evaluateRoot`, `evaluateCommand`, etc.).
 */
export function evaluateNode(node: AstNode, lctx: InternalLapolContext, env: Environment): DetNode {
    switch (node.t) {
        case AstNodeKind.AstRootNode:
            throw new LapolError("evaluateRoot should be called directly.");
        case AstNodeKind.AstCommandNode:
            return evaluateCommand(node, lctx, env);
        case AstNodeKind.AstTextNode:
            return evaluateStrNode(node, env);
        default:
            throw new LapolError("Ast Node Kind Unknown or cannot be directly evaluated.");
    }
}

function evaluateStrNode(strNode: AstTextNode, env: Environment): Str {
    assert(strNode.t === AstNodeKind.AstTextNode);
    return new Str(strNode.content);
}

export function evaluateNodeArray(
    nodeArray: AstNode[],
    lctx: InternalLapolContext,
    env: Environment
): DetNode[] {
    const cont = [];
    for (const node of nodeArray) {
        const n = evaluateNode(node, lctx, env);
        if (n instanceof Expr && n.tag === SPLICE_EXPR) {
            for (const sn of n.contentsIter()) cont.push(sn);
        } else {
            cont.push(n);
        }
    }
    return cont;
}
