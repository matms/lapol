import { strict as assert } from "assert";
import { AstNode, AstNodeKind, AstRootNode } from "../ast";
import { isWhitespace } from "../utils";

function isDocNode(n: AstNode): boolean {
    return n.t === AstNodeKind.AstCommandNode && n.commandName === "__doc";
}

export function warnUserOfIssuesWithRootNode(rootNode: AstRootNode): void {
    const docIndex = rootNode.subNodes.findIndex(isDocNode);

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
