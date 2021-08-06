/** Processing, AKA the "Middle Pass"
 *
 * This pass takes in a DET, returns a possibly modified DET.
 */

import { strict as assert } from "assert";
import { InternalFileContext, InternalLapolContext } from "../context/context";
import { DetNode, Expr } from "../det";
import { processRemoveWhitespaceLines, processLinebreaks, processParagraphs } from "./paragraph";

const PROCESSING_PASSES: Array<(node: Expr, lctx: InternalLapolContext) => DetNode> = [
    processRemoveWhitespaceLines,
    processLinebreaks,
    processParagraphs,
];

export async function processDet(
    detRootNode: DetNode,
    fctx: InternalFileContext,
    lctx: InternalLapolContext
): Promise<DetNode> {
    let out = detRootNode;

    for (const pass of PROCESSING_PASSES) {
        assert(out instanceof Expr);
        out = pass(out, lctx);
    }

    return out;
}
