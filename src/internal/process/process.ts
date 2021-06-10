/** Processing, AKA the "Middle Pass"
 *
 * This pass takes in a DET, returns a possibly modified DET.
 */

import { InternalLapolContext } from "../context";
import { DetNode } from "../det";
import { processLinebreaks, processParagraphs } from "./paragraph";

const PROCESSING_PASSES: Array<(node: DetNode, lctx: InternalLapolContext) => DetNode> = [
    processLinebreaks,
    processParagraphs,
];

export async function processDet(
    detRootNode: DetNode,
    lctx: InternalLapolContext
): Promise<DetNode> {
    let out = detRootNode;

    for (const pass of PROCESSING_PASSES) {
        out = pass(out, lctx);
    }

    return out;
}
