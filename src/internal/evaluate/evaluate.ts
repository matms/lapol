/** Evaluation, AKA the "Front Pass"
 *
 * This pass takes in the AST (Abstract Syntax Tree), and outputs a DET (Document Expression Tree)
 */

import { strict as assert } from "assert";
import { AstNode, AstNodeKind, AstRootNode, AstTextNode } from "../ast";
import { LapolContext } from "../context";
import { DetNode, Expr, Str } from "../det";
import { LapolError } from "../errors";
import { Environment } from "./environment";
import { evaluateCommand } from "./evaluate_command";
import { evaluateRoot } from "./root";

/** An Expr(tag = SPLICE_EXPR) node will be spliced into the surrounding node. That is, the subnodes
 * of this node will become part of the surrounding node's subnodes.
 */
export const SPLICE_EXPR = "splice";

/** Evaluate the Abstract Syntax Tree.
 *
 * Parameter `node` should be the root of the AST,
 *
 * Returns (asynchronously) a DetNode.
 *
 * This function is async as it needs to load modules dynamically.
 *
 * TODO: Should default modules be loaded statically?
 */
export async function evaluateAst(
    node: AstRootNode,
    lctx: LapolContext,
    filePath: string
): Promise<DetNode> {
    let out = await evaluateRoot(node, lctx, filePath);
    return out;
}

/** Evaluate `node` using environment `env`, returns a `DetNode`.
 *
 * Note this function dispatches to `evaluate*` (e.g. `evaluateRoot`, `evaluateCommand`, etc.).
 */
export function evaluateNode(node: AstNode, env: Environment): DetNode {
    switch (node.t) {
        case AstNodeKind.AstRootNode:
            throw new LapolError("evaluateRoot should be called directly.");
            break;
        case AstNodeKind.AstCommandNode:
            return evaluateCommand(node, env);
            break;
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

export function evaluateNodeArray(nodeArray: AstNode[], env: Environment): DetNode[] {
    let cont = [];
    for (let node of nodeArray) {
        let n = evaluateNode(node, env);
        if (n instanceof Expr && n.tag === SPLICE_EXPR) {
            for (let sn of n.contentsIter()) cont.push(sn);
        } else {
            cont.push(n);
        }
    }
    return cont;
}
