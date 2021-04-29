/** Front Pass, AKA the Evaluation Pass. */

import { strict as assert } from "assert";
import { AstNode, AstNodeKind, AstCommandNode, AstRootNode, AstStrNode } from "./ast";
import { callCommand, Command } from "./command";
import { DetNodeKind, DetTag, DetTextStr, DetNode } from "./det";
import { AstEvaluationError } from "./errors";
import { loadLapolModAsMap } from "./mod_utils";

interface Environment {
    contents: Map<string, any>;
    outerEnv: Environment | undefined;
}

export async function evaluateAst(node: AstRootNode): Promise<DetNode> {
    let env = { contents: new Map(), outerEnv: undefined };
    let defaultEnvItems = await loadLapolModAsMap("./default_commands/testing_commands");
    setupDefaultEnvironment(env, defaultEnvItems);

    let out = evaluateNode(node, env);
    return out;
}

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
            throw new AstEvaluationError("Unknown Node Kind.");
    }
}

function evaluateRoot(rootNode: AstRootNode, env: Environment): DetTag {
    assert(rootNode.kind === AstNodeKind.AstRootNode);
    return {
        kind: DetNodeKind.DetTag,
        tag: "root",
        innerContents: evaluateNodeArray(rootNode.subNodes, env),
    };
}

function evaluateCommand(commandNode: AstCommandNode, env: Environment): DetNode {
    assert(commandNode.kind === AstNodeKind.AstCommandNode);

    let command = environmentLookup(env, commandNode.commandName);

    if (command === undefined) {
        throw new AstEvaluationError(
            `Command (name: ${commandNode.commandName}) not in environment. `
        );
    }

    // TODO commandNode.squareArg;

    let evalCurlyArgs: DetNode[][] = [];
    for (let curlyArg of commandNode.curlyArgs) {
        evalCurlyArgs.push(evaluateNodeArray(curlyArg, env));
    }
    // TODO Implement

    return callCommand(command, evalCurlyArgs);
}

function evaluateStrNode(strNode: AstStrNode, env: Environment): DetTextStr {
    assert(strNode.kind === AstNodeKind.AstStrNode);
    return { kind: DetNodeKind.DetTextStrKind, content: strNode.content };
}

function evaluateNodeArray(nodeArray: AstNode[], env: Environment): DetNode[] {
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

function setupDefaultEnvironment(env: Environment, defaultEnvItems: Map<string, any>) {
    let map = env.contents;

    defaultEnvItems.forEach((val, key) => {
        map.set(key, val);
    });
}

function environmentLookup(env: Environment, key: string): any {
    if (env.contents.has(key)) {
        return env.contents.get(key);
    } else if (env.outerEnv === undefined) {
        return undefined;
    } else {
        return environmentLookup(env.outerEnv, key);
    }
}
