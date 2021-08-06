/** NEW EVALUATOR MODULE */

import {
    AstCommandNode,
    AstNode,
    AstNodeKind,
    AstRootNode,
    AstTextNode,
    SquareArg,
    SquareEntry,
} from "../ast";
import { InternalFileContext, InternalLapolContext } from "../context/context";
import { LapolError } from "../errors";
import { LtrfNode, LtrfObj } from "../ltrf/ltrf";
import { Environment } from "./environment";
import { strict as assert } from "assert";
import { EagerCommandArguments } from "../command/argument";
import { CommandContext } from "../command/context";
import { makeEnvironmentWithStdCoreSetup } from "./setup";
import { warnUserOfIssuesWithRootNode } from "./root";

/* eslint-disable @typescript-eslint/array-type */

const ROOT_TAG = "__root";

export function evaluateAstRoot(
    lctx: InternalLapolContext,
    fctx: InternalFileContext,
    astRoot: AstRootNode
): LtrfObj {
    const env = makeEnvironmentWithStdCoreSetup(lctx);
    const o = evaluateRootNode(lctx, fctx, env, astRoot);

    // TODO: Should I keep this restriction?
    if (o.length !== 1) throw new LapolError("RootNode must return a single LtrfObj");
    return o[0];
}

export function _evaluateNode(
    lctx: InternalLapolContext,
    fctx: InternalFileContext,
    env: Environment,
    node: AstNode
): readonly LtrfObj[] {
    switch (node.t) {
        case AstNodeKind.AstTextNode:
            return evaluateTextNode(lctx, fctx, env, node);
        case AstNodeKind.AstCommandNode:
            return evaluateCommandNode(lctx, fctx, env, node);
        case AstNodeKind.AstRootNode:
            // return evaluateRootNode(lctx, fctx, env, node);
            throw new LapolError("Nested root currently unsupported.");
        default:
            throw new LapolError("Unsupported AST Node kind.");
    }
}

function evaluateTextNode(
    _lctx: InternalLapolContext,
    _fctx: InternalFileContext,
    _env: Environment,
    node: AstTextNode
): readonly LtrfObj[] {
    return [node.content];
}

function evaluateCommandNode(
    lctx: InternalLapolContext,
    fctx: InternalFileContext,
    env: Environment,
    node: AstCommandNode
): readonly LtrfObj[] {
    const commandName = node.commandName;
    const command = env.lookupCommand(commandName);

    if (command.argumentEvaluation !== "eager")
        throw new LapolError("Currently, only eager argument evaluation is supported.");

    const { v, kv } = evaluateCommandNodeSquareArgs(lctx, fctx, env, node.squareArgs ?? []);
    const c = evaluateCommandNodeCurlyArgs(lctx, fctx, env, node.curlyArgs);
    const commandArguments = new EagerCommandArguments(kv, v, c);

    return command.call(commandArguments, new CommandContext(lctx, fctx, env, env.rootNamespace));
}

function evaluateCommandNodeSquareArgs(
    lctx: InternalLapolContext,
    fctx: InternalFileContext,
    env: Environment,
    squareArgs: SquareArg[]
): {
    v: Array<number | boolean | LtrfObj>;
    kv: ReadonlyMap<string, number | boolean | LtrfObj>;
} {
    const evaluatedSquareArgsVal: Array<number | boolean | LtrfObj> = [];
    const evaluatedSquareArgsKeyVal: Map<string, number | boolean | LtrfObj> = new Map();

    squareArgs.forEach((squareArgument) => {
        switch (squareArgument.t) {
            case "Val":
                evaluatedSquareArgsVal.push(evaluateSquareEntry(lctx, fctx, env, squareArgument.c));
                break;
            case "KeyVal":
                {
                    const [key, val] = squareArgument.c;
                    const evalKey = evaluateSquareEntry(lctx, fctx, env, key);
                    const evalVal = evaluateSquareEntry(lctx, fctx, env, val);

                    if (typeof evalKey !== "string")
                        throw new LapolError(`Key for Keyword argument must evaluate to string.`);

                    evaluatedSquareArgsKeyVal.set(evalKey, evalVal);
                }
                break;
            default:
                throw new LapolError("Unsupported squareArgument type.");
        }
    });

    return { v: evaluatedSquareArgsVal, kv: evaluatedSquareArgsKeyVal };
}

function evaluateCommandNodeCurlyArgs(
    lctx: InternalLapolContext,
    fctx: InternalFileContext,
    env: Environment,
    curlyArgs: ReadonlyArray<ReadonlyArray<AstNode>>
): ReadonlyArray<ReadonlyArray<LtrfObj>> {
    return curlyArgs.map((singleCurlyArg) =>
        singleCurlyArg.flatMap((subNode) => _evaluateNode(lctx, fctx, env, subNode))
    );
}

function evaluateSquareEntry(
    lctx: InternalLapolContext,
    fctx: InternalFileContext,
    env: Environment,
    v: SquareEntry
): boolean | number | LtrfObj {
    switch (v.t) {
        case "Bool":
        case "Ident":
        case "Num":
        case "QuotedStr": {
            // Note strings are `LtrfObj`s.
            return v.c;
        }
        case "AstNode": {
            assert(v.c.t === "AstCommandNode");
            const o = evaluateCommandNode(lctx, fctx, env, v.c);
            if (o.length !== 1)
                // TODO: Fix this arbitrary restriction.
                throw new LapolError(
                    "evaluateSquareEntry: Square Entries currently only support a single sub node"
                );
            return o[0];
        }
    }
}

function evaluateRootNode(
    lctx: InternalLapolContext,
    fctx: InternalFileContext,
    env: Environment,
    node: AstRootNode
): readonly LtrfObj[] {
    warnUserOfIssuesWithRootNode(node);

    const evalRoot = node.subNodes.flatMap((n) => _evaluateNode(lctx, fctx, env, n));

    return [LtrfNode.make(ROOT_TAG, {}, evalRoot)];
}
