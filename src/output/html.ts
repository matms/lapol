import { DetNode, DetNodeKind } from "../det";
import { CompileError } from "../errors";

export function outputNodeToHtml(node: DetNode): string {
    switch (node.kind) {
        case DetNodeKind.DetTextStrKind:
            return node.contents;
        case DetNodeKind.DetTag:
            let cs = node.contents.map((c) => outputNodeToHtml(c)).reduce((a, b) => a + b);
            return `<${node.tag}>${cs}</${node.tag}>`;
        default:
            throw new CompileError(`Cannot compile node of kind ${node.kind} to html.`);
    }
}
