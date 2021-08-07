/** Processing, AKA the "Middle Pass"
 *
 * This pass takes in a DET, returns a possibly modified DET.
 */

import { strict as assert } from "assert";
import { FileContext } from "../context/fileContext";
import { LapolContext } from "../context/lapolContext";
import { DetNode, Expr } from "../det";
import { LapolError } from "../errors";
import { isLtrfNode, isLtrfStr, LtrfNode, LtrfObj } from "../ltrf/ltrf";
import { isWhitespace } from "../utils";
import { processRemoveWhitespaceLines, processLinebreaks, processParagraphs } from "./paragraph";

interface ProcessingCtx {
    lctx: LapolContext;
    fctx: FileContext;
}

type RootProcessingFunction = (c: ProcessingCtx, n: LtrfNode) => LtrfNode;

const PROCESSING_PASSES: RootProcessingFunction[] = [processRoot];

export async function processDet(
    detRootNode: DetNode,
    fctx: FileContext,
    lctx: LapolContext
): Promise<DetNode> {
    throw new LapolError("Deprecated");
}

export function process(lctx: LapolContext, fctx: FileContext, ltrfRootNode: LtrfNode): LtrfNode {
    let out = ltrfRootNode;

    for (const pass of PROCESSING_PASSES) {
        assert(isLtrfNode(out));
        out = pass({ lctx, fctx }, out);
    }

    return out;
}

// TODO: Move to other file.
function processRoot(c: ProcessingCtx, root: LtrfNode): LtrfNode {
    if (root.tag !== "__root") throw new LapolError("Expected __root node.");

    return root.updateElems((sub) => {
        // Check for potential mistakes
        sub.forEach((n) => {
            if (isLtrfStr(n) && !isWhitespace(n))
                // TODO: Warn or Error?
                throw new LapolError(
                    "__root has string that isn't whitespace -- probably a mistake."
                );
            if (isLtrfNode(n) && n.tag !== "__doc")
                // TODO: Warn or Error?
                throw new LapolError("__root has Node that isn't __doc -- probably a mistake.");
        });

        return sub.filter((o) => isLtrfNode(o) && o.tag === "__doc");
    });
}
