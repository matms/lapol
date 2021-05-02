/** Evaluation, AKA the "Front Pass"
 *
 * This pass takes in the AST (Abstract Syntax Tree), and outputs a DET (Document Expression Tree)
 */

import { strict as assert } from "assert";
import { AstNode, AstNodeKind, AstCommandNode, AstRootNode, AstStrNode } from "../ast";
import { Command } from "../command/command";
import { DetNode, Expr, Str } from "../det";
import { LapolError } from "../errors";
import { findDefaultModulePath, LapolModule } from "../la_module/module";
import { Environment } from "./environment";

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
export async function evaluateAst(node: AstRootNode): Promise<DetNode> {
    let env = new Environment();
    let defaultModule = await LapolModule.loadModuleFile(findDefaultModulePath("core"));
    env.loadModule("default", defaultModule);

    let out = evaluateNode(node, env);
    return out;
}

/** Evaluate `node` using environment `env`, returns a `DetNode`.
 *
 * Note this function dispatches to `evaluate*` (e.g. `evaluateRoot`, `evaluateCommand`, etc.).
 */
function evaluateNode(node: AstNode, env: Environment): DetNode {
    switch (node.kind) {
        case AstNodeKind.AstRootNode:
            return evaluateRoot(node, env);
            break;
        case AstNodeKind.AstCommandNode:
            return evaluateCommand(node, env);
            break;
        case AstNodeKind.AstStrNode:
            return evaluateStrNode(node, env);
        default:
            throw new LapolError("Ast Node Kind Unknown or cannot be directly evaluated.");
    }
}

function evaluateRoot(rootNode: AstRootNode, env: Environment): Expr {
    assert(rootNode.kind === AstNodeKind.AstRootNode);
    return new Expr("root", evaluateNodeArray(rootNode.subNodes, env));
}

function evaluateCommand(commandNode: AstCommandNode, env: Environment): DetNode {
    assert(commandNode.kind === AstNodeKind.AstCommandNode);

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

    // TODO: Does this work???
    if (out === undefined) return new Expr("splice", []);
    else return out;
}

function evaluateStrNode(strNode: AstStrNode, env: Environment): Str {
    assert(strNode.kind === AstNodeKind.AstStrNode);
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
