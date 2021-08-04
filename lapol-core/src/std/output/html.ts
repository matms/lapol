import { Expr, Str } from "../../internal/det";
import { NodeOutputter, OutputPass } from "../../internal/output/output";
import { encode as heEncode } from "he";

export class DefaultHtmlStrOutputter extends NodeOutputter<Str, string> {
    nodeKind: "Str" = "Str";
    nodeTag = undefined;

    public output(_ctx: OutputPass<string>, node: Str): string {
        if (node.escape) {
            return heEncode(node.text, { strict: true });
        } else {
            return node.text;
        }
    }
}

export class GenericHtmlTagOutputter extends NodeOutputter<Expr, string> {
    nodeKind: "Expr" = "Expr";
    nodeTag: string;
    htmlTag: string;
    attributes: Array<{ attr: string; val: string }>;

    constructor(
        nodeTag: string,
        htmlTag: string,
        attributes?: Array<{ attr: string; val: string }>
    ) {
        super();
        this.nodeTag = nodeTag;
        this.htmlTag = htmlTag;
        this.attributes = attributes ?? [];
    }

    public output(ctx: OutputPass<string>, node: Expr): string {
        if (node.unsafeBorrowContents().length === 0) return `<${this.htmlTag}/>`;

        const cs = node
            .unsafeBorrowContents()
            .map((c) => ctx.output(c))
            .reduce((a, b) => a + b, "");

        // TODO: Should we escape this?
        const attrEntries = this.attributes.map(({ attr, val }) => `${attr}="${val}"`).join(" ");

        return `<${this.htmlTag} ${attrEntries}>${cs}</${this.htmlTag}>`;
    }
}

export class HtmlRootOutputter extends NodeOutputter<Expr, string> {
    nodeKind: "Expr" = "Expr";
    nodeTag: string = "root";

    public output(ctx: OutputPass<string>, node: Expr): string {
        const cs = node
            .unsafeBorrowContents()
            .map((c) => ctx.output(c))
            .reduce((a, b) => a + b, "");
        // TODO: Use template.

        // TODO: Find deps folder relative to current compile target.
        return (
            `<html><head><meta charset="utf-8">` +
            `<link rel="stylesheet" href="deps/hello-css-all.css">` +
            `</head><body><article class="page">${cs}</article></body></html>`
        );
    }
}
