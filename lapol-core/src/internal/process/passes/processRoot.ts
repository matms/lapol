import { LapolError } from "../../errors";
import { isLtrfNode, isLtrfStr, LtrfNode } from "../../ltrf/ltrf";
import { isWhitespace } from "../../utils";
import { ProcessingCtx } from "../common";

// TODO: Move to other file.
export function processRoot(_c: ProcessingCtx, root: LtrfNode): LtrfNode {
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
