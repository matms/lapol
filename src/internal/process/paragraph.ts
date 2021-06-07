import { Data, DetNode, Str, Expr } from "../det";
import { LapolError } from "../errors";
import { isWhitespace } from "../utils";

const BREAK_MARKER_TAG = "para-br-marker";
const PARAGRAPH_TAG = "__p";

// TODO: Strip empty lines (whitespace only lines.)
// TODO: Newline should become a space.

export function processLinebreaks(node: DetNode): DetNode {
    if (node instanceof Str) return node;
    if (node instanceof Data) return node;
    if (node instanceof Expr) {
        const nNode = node.contentsMap(processLinebreaks);

        if (nNode.contentsLength() <= 1) return nNode;

        const LINEBREAK_INDICATOR = "n";

        const contHelper: Array<DetNode | "n"> = [];

        for (let i = 0; i < nNode.contentsLength(); i++) {
            const curr = nNode.unsafeBorrowContents()[i];
            if (!isNewline(curr)) contHelper.push(curr);
            else if (isNewline(nNode.unsafeBorrowContents()[i + 1])) {
                if (
                    contHelper[contHelper.length - 1] !== LINEBREAK_INDICATOR &&
                    contHelper[contHelper.length - 1] !== undefined
                    // ^ No break at beginning of contents.
                ) {
                    contHelper.push(LINEBREAK_INDICATOR);
                }
                // Note that if those conditions hold, a space need not be emitted (either we
                // already have a line break, or we are at the start.
                // TODO: Is this right (check "we are at the start").
            } else {
                // Newline not followed by newline should become space.
                contHelper.push(new Str(" "));
                // If a newline isn't treated as a new paragraph, it should be
                // treated as a whitespace.
            }
        }

        const finalContents = contHelper.map((v) =>
            v !== LINEBREAK_INDICATOR ? v : new Expr(BREAK_MARKER_TAG)
        );

        return nNode.contentsReplace(finalContents);
    }
    throw new LapolError("Should be unreachable");
}

export function processParagraphs(node: DetNode): DetNode {
    if (node instanceof Str) return node;
    if (node instanceof Data) return node;
    if (node instanceof Expr) {
        const nNode = node.contentsMap(processParagraphs);

        const outContents: DetNode[] = [];

        let pAccum: DetNode[] = [];

        let numParas = 0;

        for (let i = 0; i < nNode.contentsLength(); i++) {
            const curr = nNode.unsafeBorrowContents()[i];

            if (curr instanceof Expr && curr.tag === BREAK_MARKER_TAG) {
                if (pAccum.length >= 1) {
                    outContents.push(new Expr(PARAGRAPH_TAG, pAccum));
                    numParas++;
                    pAccum = [];
                }
            } else if (curr instanceof Expr && isBlock(curr)) {
                if (pAccum.length >= 1) {
                    outContents.push(new Expr(PARAGRAPH_TAG, pAccum));
                    numParas++;
                    pAccum = [];
                }
                outContents.push(curr);
            } else pAccum.push(curr);
        }

        if (pAccum.length >= 1) {
            // If there will be more than one paragraph, emit a paragraph tag.
            if (numParas >= 1) outContents.push(new Expr(PARAGRAPH_TAG, pAccum));
            // If there would only be a single paragraph, don't emit a paragraph tag.
            else outContents.push(...pAccum); // Extend outContents by pAccum.
        }

        return nNode.contentsReplace(trimParas(outContents));
    }
    throw new LapolError("Should be unreachable");
}

/** Trim paragraph nodes (remove starting and ending whitespace Str nodes),
 * and filter out any paragraphs that become empty as a result (i.e. which were only whitespace
 * before). Non paragraph nodes should be unaffected.
 */
function trimParas(contents: DetNode[]): DetNode[] {
    const trimSingleParaNode = (node: DetNode): DetNode => {
        if (node instanceof Expr && node.tag === PARAGRAPH_TAG) {
            const newCont: DetNode[] = [...node.unsafeBorrowContents()]; // Copy array.
            while (newCont[0] instanceof Str && isWhitespace((newCont[0] as Str).text)) {
                newCont.shift();
            }
            while (
                newCont[newCont.length - 1] instanceof Str &&
                isWhitespace((newCont[newCont.length - 1] as Str).text)
            ) {
                newCont.shift();
            }
            return node.contentsReplace(newCont);
        } else return node;
    };

    const isParaNodeEmpty = (node: DetNode): boolean => {
        if (node instanceof Expr && node.tag === PARAGRAPH_TAG && node.contentsLength() === 0)
            return false;
        else return true;
    };

    return contents.map(trimSingleParaNode).filter(isParaNodeEmpty);
}

function isNewline(node: DetNode): boolean {
    return node instanceof Str && node.text === "\n";
}

function isBlock(node: DetNode): boolean {
    // TODO: Make customizable by user
    // See https://www.w3schools.com/html/html_blocks.asp
    // Also note https://en.wikipedia.org/wiki/Span_and_div
    return node instanceof Expr && (node.tag === "h1" || node.tag === "h2");
}
