/** Processing, AKA the "Middle Pass"
 *
 * This pass takes in a DET, returns a possibly modified DET.
 */

import { DetNode } from "../det";
import { processLinebreaks, processParagraphs } from "./paragraph";

const PROCESSING_PASSES: ((node: DetNode) => DetNode)[] = [
    processLinebreaks,
    //processParagraphs
];

export async function processDet(detRootNode: DetNode): Promise<DetNode> {
    let out = detRootNode;

    for (let pass of PROCESSING_PASSES) {
        out = pass(out);
    }

    return out;
}
