/** Processing, AKA the "Middle Pass"
 *
 * This pass takes in an LTRF Root Node, returns a possibly modified LTRF Root Node.
 */

import { strict as assert } from "assert";
import { FileContext } from "../context/fileContext";
import { LapolContext } from "../context/lapolContext";
import { isLtrfNode, LtrfNode } from "../ltrf/ltrf";
import { RootProcessingFunction } from "./common";
import { processLinebreaks } from "./passes/processLinebreaks";
import { processParagraphs } from "./passes/processParagraphs";
import { processRoot } from "./passes/processRoot";
import { processRemoveWhitespaceLines } from "./passes/remWhitespaceLines";

// TODO: How to allow the user to configure extra processing passes?
const PROCESSING_PASSES: RootProcessingFunction[] = [
    processRoot,
    processRemoveWhitespaceLines,
    processLinebreaks,
    processParagraphs,
];

export function processPass(
    lctx: LapolContext,
    fctx: FileContext,
    ltrfRootNode: LtrfNode
): LtrfNode {
    let out = ltrfRootNode;

    for (const pass of PROCESSING_PASSES) {
        assert(isLtrfNode(out));
        out = pass({ lctx, fctx }, out);
    }

    return out;
}
