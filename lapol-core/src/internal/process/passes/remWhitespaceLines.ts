import { LapolError } from "../../errors";
import { isLtrfNode, isLtrfStr, LtrfNode, LtrfObj } from "../../ltrf/ltrf";
import { isWhitespace } from "../../utils";
import { ProcessingCtx } from "../common";

export function processRemoveWhitespaceLines(_c: ProcessingCtx, root: LtrfNode): LtrfNode {
    return remWhitespace(root);
}

function remWhitespace(n: LtrfNode): LtrfNode {
    return n.flatMapElems((el) => {
        if (isLtrfStr(el)) {
            // Newlines aren't removed because they affect paragraph handling.
            if (el !== "\n" && isWhitespace(el)) return [];
            return [el];
        } else if (isLtrfNode(el)) {
            return [remWhitespace(el)];
        } else {
            throw new LapolError("Should be unreachable");
        }
    });
}
