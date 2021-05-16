/** Evaluation, AKA the "Front Pass"
 *
 * This pass takes in the AST (Abstract Syntax Tree), and outputs a DET (Document Expression Tree)
 */

import { strict as assert } from "assert";
import { AstNode, AstNodeKind, AstCommandNode, AstRootNode, AstTextNode } from "../ast";
import { Command } from "../command/command";
import { LapolContext } from "../context";
import { DetNode, Expr, Str } from "../det";
import { LapolError } from "../errors";
import { Environment } from "./environment";
import { evaluateRoot } from "./root";

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

function evaluateCommand(commandNode: AstCommandNode, env: Environment): DetNode {
    assert(commandNode.t === AstNodeKind.AstCommandNode);

    let command = env.lookupCommand(commandNode.commandName);

    if (command === undefined) {
        throw new LapolError(`Command (name: ${commandNode.commandName}) not in environment.`);
    } else if (!(command instanceof Command)) {
        throw new LapolError(`Value (command name: ${commandNode.commandName}) is not a Command.`);
    }

    // TODO commandNode.squareArg;

    // TODO: Allow some commands to defer evaluation of their arguments (e.g. "if")
    // "lazy arguments"
    let evalCurlyArgs: DetNode[][] = [];
    for (let curlyArg of commandNode.curlyArgs) {
        evalCurlyArgs.push(evaluateNodeArray(curlyArg, env));
    }
    // TODO Implement

    let out = command.call(evalCurlyArgs, env);

    if (out === undefined) {
        // Splicing in an empty array means adding nothing to the DET.
        return new Expr("splice", []);
    } else return out;
}

function evaluateStrNode(strNode: AstTextNode, env: Environment): Str {
    assert(strNode.t === AstNodeKind.AstTextNode);
    return new Str(strNode.content);
}

function evaluateNodeArray(nodeArray: AstNode[], env: Environment): DetNode[] {
    let cont = [];
    for (let node of nodeArray) {
        let n = evaluateNode(node, env);
        if (n instanceof Expr && n.tag === "splice") {
            for (let sn of n.contentsIter()) cont.push(sn);
        } else {
            cont.push(n);
        }
    }
    return cont;
}
