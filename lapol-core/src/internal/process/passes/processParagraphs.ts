import { LapolError } from "../../errors";
import { isLtrfNode, isLtrfStr, LtrfNode, LtrfObj, ltrfObjLift, LtrfStr } from "../../ltrf/ltrf";
import { isWhitespace } from "../../utils";
import { ProcessingCtx } from "../common";
import { BREAK_MARKER_TAG } from "./processLinebreaks";

export const PARAGRAPH_TAG = "p";

export function processParagraphs(_c: ProcessingCtx, root: LtrfNode): LtrfNode {
    return processParagraphsHelper(root);
}

function processParagraphsHelper(n: LtrfNode): LtrfNode {
    const n2 = n.mapElems(ltrfObjLift((s) => s, processParagraphsHelper));

    const outElems: LtrfObj[] = [];
    let paraAccum: LtrfObj[] = [];
    let numParas = 0;

    n2.elems.forEach((elem, i, arr) => {
        if (isBreakMarker(elem)) {
            if (paraAccum.length >= 1) {
                // TODO: isBlock?
                outElems.push(makePara(paraAccum));
                numParas++;
                paraAccum = [];
            }
        } else if (isBlock(elem)) {
            if (paraAccum.length >= 1) {
                // TODO: isBlock?
                outElems.push(makePara(paraAccum));
                numParas++;
                paraAccum = [];
            }
            outElems.push(elem);
        } else paraAccum.push(elem);
    });

    // If there are still things remaining in the accumulator...
    if (paraAccum.length >= 1) {
        // And there is already a paragraph, make another one.
        if (numParas >= 1) outElems.push(makePara(paraAccum));
        // Else, don't make a paragraph if there is no need.
        else outElems.push(...paraAccum);
    }

    return n2.withElems(trimParas(outElems));
}

/** Trim paragraph nodes (remove starting and ending whitespace Str nodes),
 * and filter out any paragraphs that become empty as a result (i.e. which were only whitespace
 * before). Non paragraph nodes should be unaffected.
 */
function trimParas(n: LtrfObj[]): LtrfObj[] {
    return n.map(trimSingleParaNode).filter(isNotEmptyPara);
}

function trimSingleParaNode(n: LtrfObj): LtrfObj {
    if (isLtrfNode(n) && isPara(n)) {
        const newContents = [...n.elems];
        while (isLtrfStr(newContents[0]) && isWhitespace(newContents[0])) newContents.shift();
        while (
            isLtrfStr(newContents[newContents.length - 1]) &&
            // This has been checked to be string, but typescript cannot infer this.
            isWhitespace(newContents[newContents.length - 1] as LtrfStr)
        )
            newContents.pop();
        return n.withElems(newContents);
    } else return n;
}

function isNotEmptyPara(n: LtrfObj): boolean {
    return !(isLtrfNode(n) && isPara(n) && n.elems.length === 0);
}

function makePara(elems: readonly LtrfObj[]): LtrfNode {
    return LtrfNode.make(PARAGRAPH_TAG, { isBlock: true }, elems);
}

function isPara(n: LtrfObj): boolean {
    return isLtrfNode(n) && n.tag === PARAGRAPH_TAG;
}

function isBreakMarker(n: LtrfObj): boolean {
    return isLtrfNode(n) && n.tag === BREAK_MARKER_TAG;
}

function isBlock(n: LtrfObj): boolean {
    if (isLtrfNode(n)) {
        const isBlock = n.kv.isBlock ?? false;
        if (typeof isBlock !== "boolean")
            throw new LapolError("LtrfNode KV isBlock should be a boolean.");
        return isBlock ?? false;
    } else return false;
}
