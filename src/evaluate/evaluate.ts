/** Evaluation, AKA the "Front Pass"
 *
 * This pass takes in the AST (Abstract Syntax Tree), and outputs a DET (Document Expression Tree)
 */

import { strict as assert } from "assert";
import { AstNode, AstNodeKind, AstCommandNode, AstRootNode, AstStrNode } from "../ast";
import { callCommand, Command, CommandKind } from "../command/command";
import { DetNodeKind, DetTag, DetTextStr, DetNodeType, DetRoot } from "../det";
import { AstEvaluationError } from "../errors";
import { loadLapolModAsMap } from "../la_module/mod_utils";
import { Environment, environmentLookup, setupDefaultEnvironment } from "./environment";

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
export async function evaluateAst(node: AstRootNode): Promise<DetNodeType> {
    let env = { contents: new Map(), outerEnv: undefined };
    let defaultEnvItems = await loadLapolModAsMap("../default_lapol_modules/main");
    setupDefaultEnvironment(env, defaultEnvItems);

    let out = evaluateNode(node, env);
    return out;
}

/** Evaluate `node` using environment `env`, returns a `DetNode`.
 *
 * Note this function dispatches to `evaluate*` (e.g. `evaluateRoot`, `evaluateCommand`, etc.).
 */
function evaluateNode(node: AstNode, env: Environment): DetNodeType {
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
            throw new AstEvaluationError("Ast Node Kind Unknown or cannot be directly evaluated.");
    }
}

function evaluateRoot(rootNode: AstRootNode, env: Environment): DetRoot {
    assert(rootNode.kind === AstNodeKind.AstRootNode);
    return {
        kind: DetNodeKind.DetRoot,
        contents: evaluateNodeArray(rootNode.subNodes, env),
    };
}

function evaluateCommand(commandNode: AstCommandNode, env: Environment): DetNodeType {
    assert(commandNode.kind === AstNodeKind.AstCommandNode);

    let command = environmentLookup(env, commandNode.commandName);

    if (command === undefined) {
        throw new AstEvaluationError(
            `Command (name: ${commandNode.commandName}) not in environment.`
        );
    } else if (command.kind !== CommandKind.CommandKind) {
        throw new AstEvaluationError(
            `Value (command name: ${commandNode.commandName}) is not a Command.`
        );
    }

    // TODO commandNode.squareArg;

    // TODO: Allow some commands to defer evaluation of their arguments (e.g. "if")
    // "lazy arguments"
    let evalCurlyArgs: DetNodeType[][] = [];
    for (let curlyArg of commandNode.curlyArgs) {
        evalCurlyArgs.push(evaluateNodeArray(curlyArg, env));
    }
    // TODO Implement

    return callCommand(command, evalCurlyArgs);
}

function evaluateStrNode(strNode: AstStrNode, env: Environment): DetTextStr {
    assert(strNode.kind === AstNodeKind.AstStrNode);
    return { kind: DetNodeKind.DetTextStrKind, text: strNode.content };
}

function evaluateNodeArray(nodeArray: AstNode[], env: Environment): DetNodeType[] {
    let cont = [];
    for (let node of nodeArray) {
        let n = evaluateNode(node, env);
        if (n.kind === DetNodeKind.DetSpecialSpliceIndicator) {
            for (let sn of n.contents) cont.push(sn);
        } else {
            cont.push(n);
        }
    }
    return cont;
}
