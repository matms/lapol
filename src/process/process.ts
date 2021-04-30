/** Processing, AKA the "Middle Pass"
 *
 * This pass takes in a DET, returns a possibly modified DET.
 */

import { DetNodeType } from "../det";
import { processLinebreaks, processParagraphs } from "./paragraph";

const PROCESSING_PASSES: ((node: DetNodeType) => DetNodeType)[] = [
    processLinebreaks,
    //processParagraphs
];

export async function processDet(detRootNode: DetNodeType): Promise<DetNodeType> {
    let out = detRootNode;

    for (let pass of PROCESSING_PASSES) {
        out = pass(out);
    }

    return out;
}
