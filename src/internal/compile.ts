import { parse_file } from "lapol-rs";
import { strict as assert } from "assert";
import { AstRootNode } from "./ast";
import { DetNode } from "./det";
import { evaluateAst } from "./evaluate/evaluate";
import { outputDet, OutputData } from "./output/output";
import { processDet } from "./process/process";
import { outFilePath, readFileBuffer, writeFile } from "./utils";
import { initInternalLapoLContext, InternalLapolContext } from "./internal_context";
import { LaPath } from "./la_path";

export interface CompileInput {
    inputFilePath: LaPath;
    outputFilePath: LaPath;
    targetLanguage: string;
}

export interface CompileOutput {
    dbgTimingInfo: string;
    dbgInputText: Buffer;
    dbgParsed: AstRootNode;
    dbgEvaluated: DetNode;
    dbgProcessed: DetNode;
    dbgOutputted: OutputData;
}

async function compile(c: CompileInput, lctx: InternalLapolContext): Promise<CompileOutput> {
    const t1 = Date.now();
    const textBuf = await readFileBuffer(c.inputFilePath);
    const t2 = Date.now();
    const parsed = parse_file(c.inputFilePath.fullPath, textBuf) as AstRootNode;
    assert(parsed.t === "AstRootNode");
    const t3 = Date.now();
    const evaluated = await evaluateAst(parsed, lctx, c.inputFilePath.fullPath);
    const t4 = Date.now();
    const processed = await processDet(evaluated);
    const t5 = Date.now();
    const output = await outputDet(processed, c.targetLanguage);
    const t6 = Date.now();
    await writeFile(c.outputFilePath, output.str);
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

const COMPILE_DBG_PRINT = true;

export async function render(filePath: LaPath, target: string = "html"): Promise<void> {
    const inPath = filePath;
    const outPath = outFilePath(filePath, target);

    if (COMPILE_DBG_PRINT) console.log("\n====== Starting to compile LaPoL file ======\n");

    const lctx = initInternalLapoLContext();
    const o = await compile(
        {
            inputFilePath: inPath,
            outputFilePath: outPath,
            targetLanguage: "html",
        },
        lctx
    );

    if (COMPILE_DBG_PRINT) {
        console.log(`\nTiming info ('${inPath.fullPath}' to '${outPath.fullPath}').\n`);
        console.log(o.dbgTimingInfo);
        console.log(`\nFinished compiling ('${inPath.fullPath}' to '${outPath.fullPath}').\n`);
    }
}
