import { Data, DetNode, Str, Expr } from "../det";
import { LapolError, ProcessingError } from "../errors";
import { outputNodeToHtml } from "../output/html";

const BREAK_MARKER = Symbol("TEMP_NEWLINE_MARKER");

// TODO: Strip empty lines (whitespace only lines.)

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
            else if (
                isNewline(nNode.unsafeBorrowContents()[i + 1]) &&
                contHelper[contHelper.length - 1] !== LINEBREAK_INDICATOR &&
                contHelper[contHelper.length - 1] !== undefined
                // ^ No break at beginning of contents.
            ) {
                contHelper.push(LINEBREAK_INDICATOR);
            }
        }

        // No break at end of contents
        if (contHelper[contHelper.length - 1] === LINEBREAK_INDICATOR) contHelper.pop();

        let finalContents = contHelper.map((v) => (v !== LINEBREAK_INDICATOR ? v : new Expr("br")));

        return nNode.contentsReplace(finalContents);
    }
    throw new LapolError("Should be unreachable");
}

export function processParagraphs(node: DetNode): DetNode {
    throw new LapolError(`Not yet implemented`);
}

// function isBlock(node: DetNode | symbol): boolean {}

function isNewline(node: DetNode): boolean {
    return node instanceof Str && node.text === "\n";
}
