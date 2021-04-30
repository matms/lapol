import { DetNodeType, DetNodeKind } from "../det";
import { CompileError } from "../errors";

export function outputNodeToHtml(node: DetNodeType): string {
    switch (node.kind) {
        case DetNodeKind.DetTextStrKind: {
            return node.text;
        }
        case DetNodeKind.DetTag: {
            if (node.contents.length === 0) return `<${node.tag}/>`;

            let cs = node.contents.map((c) => outputNodeToHtml(c)).reduce((a, b) => a + b, "");
            return `<${node.tag}>${cs}</${node.tag}>`;
        }
        case DetNodeKind.DetRoot: {
            let cs = node.contents.map((c) => outputNodeToHtml(c)).reduce((a, b) => a + b, "");
            // TODO: Use template.
            return `<html><head><meta charset="UTF-8"></head><body>${cs}</body></html>`;
        }
        default: {
            throw new CompileError(`Cannot compile node of kind ${node.kind} to html.`);
        }
    }
}
