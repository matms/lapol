import { parse_file } from "lapol-rs";
import { strict as assert } from "assert";
import { AstRootNode } from "./ast";
import { evaluatePass } from "./evaluate/evaluate";
import { processPass } from "./process/process";
import { readFileBuffer, writeFile } from "./utils";
import { LaPath } from "./laPath";
import { FileContext } from "./context/fileContext";
import { LapolContext } from "./context/lapolContext";
import { isLtrfNode, LtrfObj } from "./ltrf/ltrf";
import { outputPass } from "./out/out";
import { Output } from "./out/common";
import { makeOutputDispatcher } from "./out/dispatcher";

export interface CompileInput {
    inputFilePath: LaPath;
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
    const output = outputPass(lctx, fctx, c.targetLanguage, outputDispatcher, processed);
    const t6 = Date.now();
    await writeFile(c.outputFilePath, output.code);
    const t7 = Date.now();

    const dbgTimingInfo =
        `COMPILATION TIMINGS (All in milliseconds)\n` +
        `Read file in: ${t2 - t1} | Cumulative time: ${t2 - t1}\n` +
        `Parsing: ${t3 - t2} | Cumulative time: ${t3 - t1}\n` +
        `Evaluating: ${t4 - t3} | Cumulative time: ${t4 - t1}\n` +
        `Processing: ${t5 - t4} | Cumulative time: ${t5 - t1}\n` +
        `Outputting: ${t6 - t5} | cumulative time: ${t6 - t1}\n` +
        `Write to file: ${t7 - t6} | cumulative time: ${t7 - t1}\n`;

    return {
        dbgTimingInfo: dbgTimingInfo,
        dbgInputText: textBuf,
        dbgParsed: parsed,
        dbgEvaluated: evaluated,
        dbgProcessed: processed,
        dbgOutputted: output,
    };
}

const COMPILE_DBG_PRINT = false;

export async function render(
    lctx: LapolContext,
    filePath: LaPath,
    outPath: LaPath,
    target: string = "html"
): Promise<void> {
    const inPath = filePath;

    if (COMPILE_DBG_PRINT) console.log("\n====== Starting to compile LaPoL file ======\n");

    const o = await compile(lctx, {
        inputFilePath: inPath,
        outputFilePath: outPath,
        targetLanguage: "html",
    });

    if (COMPILE_DBG_PRINT) {
        console.log(`\nTiming info ('${inPath.fullPath}' to '${outPath.fullPath}').\n`);
        console.log(o.dbgTimingInfo);
        console.log(`\nFinished compiling ('${inPath.fullPath}' to '${outPath.fullPath}').\n`);
    }
}
