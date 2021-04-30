import { DetNode, DetNodeKind } from "../det";
import { mapUpdateContents, replaceContents, updateContents } from "../det_utils";
import { ProcessingError } from "../errors";

const BREAK_MARKER = Symbol("TEMP_NEWLINE_MARKER");

// TODO: Strip empty lines (whitespace only lines.)

export function processLinebreaks(node: DetNode): DetNode {
    switch (node.kind) {
        case DetNodeKind.DetTextStrKind:
            return node;
        case DetNodeKind.DetRoot:
        case DetNodeKind.DetTag: {
            node = mapUpdateContents(node, processLinebreaks);

            if (node.contents.length <= 1) return node;

            let out: (DetNode | symbol)[] = [];
            let i = 0;
            for (let i = 0; i < node.contents.length; i++) {
                let curr = node.contents[i];
                if (!isNewline(curr)) out.push(curr);
                else if (
                    isNewline(node.contents[i + 1]) && // Next is newline
                    out[out.length - 1] !== BREAK_MARKER &&
                    out[out.length - 1] !== undefined // No break at beginning of contents.
                ) {
                    out.push(BREAK_MARKER);
                }
            }
            // No break at end of contents.
            if (out[out.length - 1] === BREAK_MARKER) out.pop();
            // Map BREAK_MARKER to BR tag
            return replaceContents(node, out.map(removeBreakMarker));
        }
        default:
            throw new ProcessingError(`processParagraphs: Unsupported node kind ${node.kind}`);
    }
}

function removeBreakMarker(val: DetNode | symbol): DetNode {
    if (typeof val === "symbol") return { kind: DetNodeKind.DetTag, tag: "br", contents: [] };
    return val;
}

export function processParagraphs(node: DetNode): DetNode {
    switch (node.kind) {
        default:
            throw new ProcessingError(`processParagraphs: Unsupported node kind ${node.kind}`);
    }
}

// function isBlock(node: DetNode | symbol): boolean {}

function isNewline(node: DetNode): boolean {
    return node.kind === DetNodeKind.DetTextStrKind && node.text === "\n";
}
