import { Data, DetNode, Expr, Str } from "../det";
import { LapolError } from "../errors";

export function outputNodeToHtml(node: DetNode): string {
    if (node instanceof Str) return node.text;
    if (node instanceof Data) throw new LapolError("Cannot output DET node of type Data to HTML.");
    if (node instanceof Expr) {
        if (node.tag === "root") {
            let cs = node
                .unsafeBorrowContents()
                .map((c) => outputNodeToHtml(c))
                .reduce((a, b) => a + b, "");
            // TODO: Use template.
            return `<html><head><meta charset="UTF-8"></head><body>${cs}</body></html>`;
        } else {
            if (node.unsafeBorrowContents().length === 0) return `<${node.tag}/>`;

            let cs = node
                .unsafeBorrowContents()
                .map((c) => outputNodeToHtml(c))
                .reduce((a, b) => a + b, "");
            return `<${node.tag}>${cs}</${node.tag}>`;
        }
    }
    throw new LapolError("Unsupported / Unknown DetNode type");
}
