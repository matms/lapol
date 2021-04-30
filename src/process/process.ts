/** Processing, AKA the "Middle Pass"
 *
 * This pass takes in a DET, returns a possibly modified DET.
 */

import { DetNode } from "../det";

export async function processDet(detRootNode: DetNode): Promise<DetNode> {
    // For now, do nothing.
    return detRootNode;
}
