/** Processing, AKA the "Middle Pass"
 *
 * This pass takes in an LTRF Root Node, returns a possibly modified LTRF Root Node.
 */

import { strict as assert } from "assert";
import { FileContext } from "../context/fileContext";
import { LapolContext } from "../context/lapolContext";
import { isLtrfNode, LtrfNode } from "../ltrf/ltrf";
import { RootProcessingFunction } from "./common";
import { processRoot } from "./passes/processRoot";
import { processRemoveWhitespaceLines } from "./passes/remWhitespaceLines";

const PROCESSING_PASSES: RootProcessingFunction[] = [processRoot, processRemoveWhitespaceLines];

/*

const PROCESSING_PASSES: Array<(node: Expr, lctx: LapolContext) => DetNode> = [
    processRemoveWhitespaceLines,
    processLinebreaks,
    processParagraphs,
];

*/

export function process(lctx: LapolContext, fctx: FileContext, ltrfRootNode: LtrfNode): LtrfNode {
    let out = ltrfRootNode;

    for (const pass of PROCESSING_PASSES) {
        assert(isLtrfNode(out));
        out = pass({ lctx, fctx }, out);
    }

    return out;
}
