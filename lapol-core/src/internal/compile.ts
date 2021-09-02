import { parse_file } from "lapol-rs";
import { strict as assert } from "assert";
import { AstRootNode } from "./ast";
import { evaluatePass } from "./evaluate/evaluate";
import { processPass } from "./process/process";
import { copyFile, readFileBuffer, writeFile } from "./utils";
import { LaPath } from "./laPath";
import { FileContext } from "./context/fileContext";
import { LapolContext } from "./context/lapolContext";
import { isLtrfNode, LtrfObj } from "./ltrf/ltrf";
import { outputPass } from "./out/out";
import { Output } from "./out/common";
import { makeOutputDispatcher } from "./out/dispatcher";
import { OutputRequirementReceiver } from "./out/outRequirements";

const COMPILE_DBG_PRINT = true;
export interface CompileInput {
    inputFilePath: LaPath;
    outputFolder: LaPath;
    outRelativePath: string;
    outputFilePath: LaPath;
    targetLanguage: string;
}

export interface CompileOutput {
    dbgTimingInfo: string;
    dbgInputText: Buffer;
    dbgParsed: AstRootNode;
    dbgEvaluated: LtrfObj;
    dbgProcessed: LtrfObj;
    dbgOutputted: Output;
}

async function compile(lctx: LapolContext, c: CompileInput): Promise<CompileOutput> {
    const t1 = Date.now();
    const textBuf = await readFileBuffer(c.inputFilePath);
    const t2 = Date.now();
    const parsed = parse_file(c.inputFilePath.fullPath, textBuf) as AstRootNode;
    assert(parsed.t === "AstRootNode");
    const t3 = Date.now();

    const fctx = FileContext.make(lctx);

    const evaluated = evaluatePass(lctx, fctx, parsed);

    assert(isLtrfNode(evaluated));

    const t4 = Date.now();
    const processed = processPass(lctx, fctx, evaluated);
    const t5 = Date.now();

    const outputDispatcher = makeOutputDispatcher(lctx, c.targetLanguage);
    const outputRequirementReceiver = OutputRequirementReceiver.make();
    const output = outputPass(
        lctx,
        fctx,
        c.targetLanguage,
        outputDispatcher,
        outputRequirementReceiver,
        processed
    );

    const t6 = Date.now();
    await writeFile(c.outputFilePath, output.code);
    const t7 = Date.now();

    const copyPromises: Array<Promise<void>> = [];
    for (const [tgtDepFileRelPath, srcDepFile] of outputRequirementReceiver.files) {
        const f = async (): Promise<void> => {
            // Checking if the copy was actually needed would be nice, but this is really tricky to
            // synchronize correctly within NodeJs, unless we abandon asynchronous copies.
            // So for now, we'll just always copy.
            try {
                await copyFile(
                    srcDepFile, // source
                    new LaPath(c.outputFolder.fullPath + c.outputFolder.sep + tgtDepFileRelPath) // target
                );
            } catch (e) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if (e.code === "EBUSY") {
                    if (COMPILE_DBG_PRINT) {
                        // Either you'd copy over the same file that is already being copied over,
                        // in which case there is no issue, OR you'd copy over a different file,
                        // which would cause issues with the first copy _anyways_, so you'd have a
                        // bigger problem than this EBUSY. In general, as long as you never write
                        // _distinct_ contents to the same file, you're good.
                        //
                        // Unfortunately, avoiding this EBUSY is not trivial at all. The simplest
                        // solution is to do all copies sequentially, which is not great for
                        // performance :(.
                        console.log(`EBUSY Error when copying (this is probably NOT an issue).`);
                        console.log(e);
                    }
                } else {
                    throw e;
                }
            }
        };

        copyPromises.push(f());
    }
    /*
    for (const p of copyPromises) {
        await p;
    }
    */
    await Promise.all(copyPromises);
    const t8 = Date.now();

    const dbgTimingInfo =
        `COMPILATION TIMINGS (All in milliseconds)\n` +
        `Read file in: ${t2 - t1} | Cumulative time: ${t2 - t1}\n` +
        `Parsing: ${t3 - t2} | Cumulative time: ${t3 - t1}\n` +
        `Evaluating: ${t4 - t3} | Cumulative time: ${t4 - t1}\n` +
        `Processing: ${t5 - t4} | Cumulative time: ${t5 - t1}\n` +
        `Outputting: ${t6 - t5} | cumulative time: ${t6 - t1}\n` +
        `Write to file: ${t7 - t6} | cumulative time: ${t7 - t1}\n` +
        `Copy dependencies: ${t8 - t7} | cumulative time: ${t8 - t1}\n`;

    return {
        dbgTimingInfo: dbgTimingInfo,
        dbgInputText: textBuf,
        dbgParsed: parsed,
        dbgEvaluated: evaluated,
        dbgProcessed: processed,
        dbgOutputted: output,
    };
}

export async function render(
    lctx: LapolContext,
    filePath: LaPath,
    outFolder: LaPath,
    outRelativePath: string,
    target: string = "html"
): Promise<void> {
    const inPath = filePath;

    if (COMPILE_DBG_PRINT) console.log("\n====== Starting to compile LaPoL file ======\n");

    const compileInput = {
        inputFilePath: inPath,
        outputFolder: outFolder,
        outRelativePath: outRelativePath,
        outputFilePath: new LaPath(outFolder.fullPath + outFolder.sep + outRelativePath),
        targetLanguage: target,
    };

    const o = await compile(lctx, compileInput);

    if (COMPILE_DBG_PRINT) {
        console.log(
            `\nTiming info ('${inPath.fullPath}' to '${compileInput.outputFilePath.fullPath}').\n`
        );
        console.log(o.dbgTimingInfo);
        console.log(
            `\nFinished compiling ('${inPath.fullPath}' to '${compileInput.outputFilePath.fullPath}').\n`
        );
    }
}
