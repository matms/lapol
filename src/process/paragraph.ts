import { Data, DetNode, Str, Expr } from "../det";
import { LapolError } from "../errors";

const BREAK_MARKER_TAG = "para-br-marker";
const PARAGRAPH_TAG = "p";

// TODO: Strip empty lines (whitespace only lines.)
// TODO: Newline should become a space.

export function processLinebreaks(node: DetNode): DetNode {
    if (node instanceof Str) return node;
    if (node instanceof Data) return node;
    if (node instanceof Expr) {
        let nNode = node.contentsMap(processLinebreaks);

        if (nNode.contentsLength() <= 1) return nNode;

        const LINEBREAK_INDICATOR = "n";

        let contHelper: (DetNode | "n")[] = [];

        for (let i = 0; i < nNode.contentsLength(); i++) {
            let curr = nNode.unsafeBorrowContents()[i];
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

        // No break at end of contents
        if (contHelper[contHelper.length - 1] === LINEBREAK_INDICATOR) contHelper.pop();

        let finalContents = contHelper.map((v) =>
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
        let nNode = node.contentsMap(processParagraphs);

        let outContents: DetNode[] = [];

        let pAccum: DetNode[] = [];

        let numParas = 0;

        for (let i = 0; i < nNode.contentsLength(); i++) {
            let curr = nNode.unsafeBorrowContents()[i];

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

        return nNode.contentsReplace(outContents);
    }
    throw new LapolError("Should be unreachable");
}

// function isBlock(node: DetNode | symbol): boolean {}

function isNewline(node: DetNode): boolean {
    return node instanceof Str && node.text === "\n";
}

function isBlock(node: DetNode): boolean {
    // TODO: Make customizable by user
    return node instanceof Expr && (node.tag === "h1" || node.tag === "h2");
}
