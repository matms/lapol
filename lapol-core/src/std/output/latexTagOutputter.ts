import { getLapolFolder } from "../../internal/globalInit";
import { LaPath } from "../../internal/laPath";
import { LtrfNode } from "../../internal/ltrf/ltrf";
import { LtrfNodeOutputter, OutputCtx } from "../../internal/out/common";
import { composeOutput, outputLtrfObj } from "../../internal/out/out";
import { MainFileStore } from "../main_common";

export function makeLatexRootOutputter(): LtrfNodeOutputter {
    return (n: LtrfNode, ctx: OutputCtx) => {
        // TODO: This feels out of place.
        ctx.reqReceiver.requireFile(
            new LaPath(
                getLapolFolder().fullPath + `/../deps-lapol-default/lapol_default_article.cls`
            ),
            `./deps/lapol_default_article.cls`
        );

        ctx.reqReceiver.requireFile(
            new LaPath(getLapolFolder().fullPath + `/../deps-lapol-default/lapol_default.sty`),
            `./deps/lapol_default.sty`
        );
        // ===================================

        const cs = composeOutput(...n.elems.map((v) => outputLtrfObj(ctx, v)));

        const s = ctx.getFileModuleStorage("std::main") as MainFileStore;
        const title = s.title;
        const author = s.author;
        const titleOut = composeOutput(...title.map((v) => outputLtrfObj(ctx, v)));
        const authorOut = composeOutput(...author.map((v) => outputLtrfObj(ctx, v)));
        const titleCmd = `\\title{${titleOut.code}}`;
        const authorCmd = `\\author{${authorOut.code}}`;

        // TODO: Use external template file
        const code =
            `\\documentclass{deps/lapol_default_article}\n` +
            `\\usepackage{deps/lapol_default}\n` +
            `% Debugging help:\n` +
            `% Trick TeXstudio into loading the commands defined in this file.\n` +
            `\\begin{mcommenthack}\n` +
            `  \\input{deps/lapol_default_article.cls}\n` +
            `  \\input{deps/lapol_default.sty}\n` +
            `\\end{mcommenthack}\n` +
            titleCmd +
            authorCmd +
            `\\date{Compiled on \\today}` +
            `\\begin{document}` +
            `${cs.code}` +
            `\\end{document}`;

        return { code };
    };
}

export function makeLatexParaOutputter(): LtrfNodeOutputter {
    return (n: LtrfNode, ctx: OutputCtx) => {
        // if (n.elems.length === 0) return { code: `\\${command}{}` };
        const cs = composeOutput(...n.elems.map((v) => outputLtrfObj(ctx, v)));
        return { code: `\n\n${cs.code}\n\n` };
    };
}

export function makeLatexNoCurlyCommandOutputter(command: string): LtrfNodeOutputter {
    return (n: LtrfNode, ctx: OutputCtx) => {
        return { code: `\\${command}{}` };
    };
}

// TODO: Should I add a newline here anywhere?
export function makeLatexSingleCurlyCommandOutputter(command: string): LtrfNodeOutputter {
    return (n: LtrfNode, ctx: OutputCtx) => {
        // if (n.elems.length === 0) return { code: `\\${command}{}` };
        const cs = composeOutput(...n.elems.map((v) => outputLtrfObj(ctx, v)));
        return { code: `\\${command}{${cs.code}}` };
    };
}

// TODO: Should I add a newline here anywhere?
export function makeLatexBlockOutputter(blockName: string): LtrfNodeOutputter {
    return (n: LtrfNode, ctx: OutputCtx) => {
        const cs = composeOutput(...n.elems.map((v) => outputLtrfObj(ctx, v)));
        return { code: `\\begin{${blockName}}${cs.code}\\end{${blockName}}` };
    };
}
