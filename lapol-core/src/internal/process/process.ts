/** Processing, AKA the "Middle Pass"
 *
 * This pass takes in a DET, returns a possibly modified DET.
 */

import { strict as assert } from "assert";
import { FileContext } from "../context/fileContext";
import { LapolContext } from "../context/lapolContext";
import { DetNode, Expr } from "../det";
import { processRemoveWhitespaceLines, processLinebreaks, processParagraphs } from "./paragraph";

const PROCESSING_PASSES: Array<(node: Expr, lctx: LapolContext) => DetNode> = [
    processRemoveWhitespaceLines,
    processLinebreaks,
    processParagraphs,
];

export async function processDet(
    detRootNode: DetNode,
    fctx: FileContext,
    lctx: LapolContext
): Promise<DetNode> {
    let out = detRootNode;

    for (const pass of PROCESSING_PASSES) {
        assert(out instanceof Expr);
        out = pass(out, lctx);
    }

    return out;
}
