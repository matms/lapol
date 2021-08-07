import { isLtrfStr, LtrfNode, LtrfObj, ltrfObjLift } from "../../ltrf/ltrf";
import { ProcessingCtx } from "../common";

export const BREAK_MARKER_TAG = "__para_br_marker";

export function processLinebreaks(_c: ProcessingCtx, root: LtrfNode): LtrfNode {
    return remLinebreaks(root);
}

function remLinebreaks(n: LtrfNode): LtrfNode {
    const n2 = n.mapElems(ltrfObjLift((s) => s, remLinebreaks));
    if (n2.elems.length <= 1) return n2;

    /** New elements helper */
    const h: Array<LtrfObj | symbol> = [];
    const LINEBREAK_INDICATOR = Symbol("newline");

    n2.elems.forEach((subNode, i, arr) => {
        if (isNewline(subNode)) {
            const nextSubNode = arr[i + 1];
            if (nextSubNode !== undefined && isNewline(nextSubNode)) {
                // If we have already emitted a LINEBREAK_INDICATOR, or if we are at the start
                // of the node elements, either way we need not emit a LINEBREAK_INDICATOR.
                const atStart = h.length === 0;
                const lastElemIsAlreadyLinebreakIndicator = h[h.length - 1] === LINEBREAK_INDICATOR;
                if (!atStart && !lastElemIsAlreadyLinebreakIndicator) h.push(LINEBREAK_INDICATOR);
            } else {
                // Newline not followed by newline should become space.
                h.push(" ");
            }
        } else {
            h.push(subNode);
        }
    });

    // Conversion is safe because h has only LtrfObj or LINEBREAK_INDICATOR symbols,
    // and all of the LINEBREAK_INDICATOR symbols get replaced by LtrfObj here.
    const finalElems = h.map((v) =>
        v === LINEBREAK_INDICATOR ? LtrfNode.make(BREAK_MARKER_TAG, {}, []) : v
    ) as LtrfObj[];

    return n2.withElems(finalElems);
}

function isNewline(o: LtrfObj): boolean {
    return isLtrfStr(o) && o === "\n";
}
