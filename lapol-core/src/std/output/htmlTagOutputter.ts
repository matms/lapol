import { LtrfNode } from "../../internal/ltrf/ltrf";
import { LtrfNodeOutputter, Output, OutputCtx } from "../../internal/out/common";
import { composeOutputs, outputLtrfObj } from "../../internal/out/out";

export function makeHtmlRootOutputter(): LtrfNodeOutputter {
    return (n: LtrfNode, ctx: OutputCtx) => {
        const cs = composeOutputs(...n.elems.map((v) => outputLtrfObj(ctx, v)));

        return cs.mapCode(
            (inner) =>
                `<html><head><meta charset="utf-8">` +
                `<link rel="stylesheet" href="deps/hello-css-all.css">` +
                `</head><body><article class="page">${inner}</article></body></html>`
        );
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
        if (n.elems.length === 0) return Output.makeCode(`<${htmlTag} ${attrEntries}/>`);

        const cs = composeOutputs(...n.elems.map((v) => outputLtrfObj(ctx, v)));

        return cs.mapCode((inner) => `<${htmlTag} ${attrEntries}>${inner}</${htmlTag}>`);
    };
}
