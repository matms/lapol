import { strict as assert } from "assert";
import { AstNode, AstNodeKind, AstCommandNode, AstRootNode } from "../ast";
import { Command } from "../command/command";
import { InternalLapolContext } from "../context";
import { Expr } from "../det";
import { LapolError } from "../errors";
import { parseIdentifier } from "../identifier";
import { isWhitespace } from "../utils";
import { Environment } from "./environment";
import { evaluateNode } from "./evaluate";

const STD_CORE_MOD = "std::core";
const DEFAULT_USE_FROM_CORE = ["__doc", "__require", "__using", "__using_all"];

function isDocNode(n: AstNode): boolean {
    return n.t === AstNodeKind.AstCommandNode && n.commandName === "__doc";
}

function checkRoot(rootNode: AstRootNode, docIndex: number): void {
    assert(rootNode.t === AstNodeKind.AstRootNode);
    if (
        rootNode.subNodes
            .map((n) => n.t === AstNodeKind.AstTextNode && !isWhitespace(n.content))
            .reduce((a, b) => a || b, false)
    ) {
        console.log(
            "WARNING: Root has direct child node with text. This is probably an error (remember to use __doc)"
        );
    }
    if (docIndex === -1) {
        console.log("WARNING: Root has no __doc child.");
    } else {
        if (
            rootNode.subNodes
                .slice(docIndex + 1)
                .map(isDocNode)
                .reduce((a, b) => a || b, false)
        ) {
            console.log("WARNING: Two __doc nodes as child of root.");
        }
        if (
            rootNode.subNodes
                .slice(docIndex + 1)
                .map((n) => n.t !== AstNodeKind.AstTextNode || !isWhitespace(n.content))
                .reduce((a, b) => a || b, false)
        ) {
            console.log("WARNING: Non whitespace nodes after __doc. This is probably an error.");
        }
    }
}

export function evaluateRoot(
    lctx: InternalLapolContext,
    rootNode: AstRootNode,
    filePath: string
): Expr {
    const t0 = Date.now();

    const env = new Environment();
    setupCoreModule(lctx, env);

    const docIndex = rootNode.subNodes.findIndex(isDocNode);
    checkRoot(rootNode, docIndex);
    const header = rootNode.subNodes
        .slice(0, docIndex)
        .filter((n) => n.t === AstNodeKind.AstCommandNode) as AstCommandNode[];

    header.forEach((n) => evaluateNode(n, lctx, env)); // TODO

    const doc = rootNode.subNodes[docIndex];

    const t1 = Date.now();

    const out = new Expr("root", [evaluateNode(doc, lctx, env)]);

    const t2 = Date.now();
    console.log(
        `<evaluateRoot> eval header: ${t1 - t0}, eval __doc: ${t2 - t1}, cumulative: ${
            t2 - t0
        } (millis)`
    );

    return out;
}

/** Sets up "std::core". Also automatically "uses" the core commands. */
function setupCoreModule(lctx: InternalLapolContext, env: Environment): void {
    function addUsingFromCoreHelper(cmd: string): void {
        env.rootNamespace.addUsing(
            `${cmd}`,
            env.rootNamespace.lookupItem(parseIdentifier(`${STD_CORE_MOD}:${cmd}`)) as Command
        );
    }

    const mod = lctx.modules.get(STD_CORE_MOD);
    if (mod === undefined)
        throw new LapolError(
            `Module ${STD_CORE_MOD} was required: you need to provide it when building LapolContext.`
        );
    env.loadModule(STD_CORE_MOD, mod);

    DEFAULT_USE_FROM_CORE.forEach(addUsingFromCoreHelper);
}
