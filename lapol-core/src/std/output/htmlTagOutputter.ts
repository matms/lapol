import { getLapolFolder } from "../../internal/globalInit";
import { LtrfNode } from "../../internal/ltrf/ltrf";
import { LtrfNodeOutputter, OutputCtx } from "../../internal/out/common";
import { composeOutput, outputLtrfObj } from "../../internal/out/out";
import { LaPath } from "../../mod";

const DEFAULT_DEPS = [
    [`deps/hello-css/dist/all.css`, `./deps/hello-css-all.css`],
    [`deps-lapol/lapol-default.css`, `./deps/lapol-default.css`],
    [`deps/hello-css/fonts/LICENSE`, `./deps/fonts/LICENSE`],
];

const DEFAULT_FONTS = [
    "libre-baskerville.woff2",
    "libre-baskerville-bold.woff2",
    "libre-baskerville-italic.woff2",
];

export function makeHtmlRootOutputter(): LtrfNodeOutputter {
    return (n: LtrfNode, ctx: OutputCtx) => {
        const lapolFolder = getLapolFolder();

        for (const [src, tgt] of DEFAULT_DEPS) {
            ctx.reqReceiver.requireFile(
                new LaPath(lapolFolder.fullPath + lapolFolder.sep + src),
                tgt
            );
        }
        for (const font of DEFAULT_FONTS) {
            ctx.reqReceiver.requireFile(
                new LaPath(lapolFolder.fullPath + lapolFolder.sep + `deps/hello-css/fonts/${font}`),
                `./deps/fonts/${font}`
            );
        }

        const cs = composeOutput(...n.elems.map((v) => outputLtrfObj(ctx, v)));

        const code =
            `<html><head><meta charset="utf-8">` +
            `<link rel="stylesheet" href="deps/hello-css-all.css">` +
            `<link rel="stylesheet" href="deps/lapol-default.css">` +
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
