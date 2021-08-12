import { LtrfNode } from "../../internal/ltrf/ltrf";
import { LtrfNodeOutputter, OutputCtx } from "../../internal/out/common";
import { composeOutput, outputLtrfObj } from "../../internal/out/out";

export function makeHtmlRootOutputter(): LtrfNodeOutputter {
    return (n: LtrfNode, ctx: OutputCtx) => {
        const cs = composeOutput(...n.elems.map((v) => outputLtrfObj(ctx, v)));

        const code =
            `<html><head><meta charset="utf-8">` +
            `<link rel="stylesheet" href="deps/hello-css-all.css">` +
            `</head><body><article class="page">${cs.code}</article></body></html>`;

        return { code };
    };
}

export function makeHtmlTagOutputter(
    htmlTag: string,
    attributes?: Array<{ attr: string; val: string }>
): LtrfNodeOutputter {
    attributes = attributes ?? [];

    // TODO: Do we need to escape this?
    const attrEntries = attributes.map(({ attr, val }) => `${attr}="${val}"`).join(" ");

    return (n: LtrfNode, ctx: OutputCtx) => {
        if (n.elems.length === 0) return { code: `<${htmlTag} ${attrEntries}/>` };

        const cs = composeOutput(...n.elems.map((v) => outputLtrfObj(ctx, v)));

        return { code: `<${htmlTag} ${attrEntries}>${cs.code}</${htmlTag}>` };
    };
}
