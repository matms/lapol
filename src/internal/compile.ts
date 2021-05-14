import { parse_file } from "lapol-rs";
import { strict as assert } from "assert";
import { AstRootNode } from "./ast";
import { DetNode } from "./det";
import { evaluateAst } from "./evaluate/evaluate";
import { outputDet, OutputData } from "./output/output";
import { processDet } from "./process/process";
import { readFile, readFileBuffer, writeFile } from "./utils";

export interface CompileInput {
    inputFilePath: string;
    outputFilePath: string;
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

export async function compile(c: CompileInput): Promise<CompileOutput> {
    let t1 = Date.now();
    let text_buf = await readFileBuffer(c.inputFilePath);
    let t2 = Date.now();
    let parsed = parse_file(c.inputFilePath, text_buf) as AstRootNode;
    assert(parsed.t === "AstRootNode");
    let t3 = Date.now();
    let evaluated = await evaluateAst(parsed);
    let t4 = Date.now();
    let processed = await processDet(evaluated);
    let t5 = Date.now();
    let output = await outputDet(processed, c.targetLanguage);
    let t6 = Date.now();
    await writeFile(c.outputFilePath, output.str);
    let t7 = Date.now();

    let dbgTimingInfo =
        `COMPILATION TIMINGS (All in milliseconds)\n` +
        `Read file in: ${t2 - t1} | Cumulative time: ${t2 - t1}\n` +
        `Parsing: ${t3 - t2} | Cumulative time: ${t3 - t1}\n` +
        `Evaluating: ${t4 - t3} | Cumulative time: ${t4 - t1}\n` +
        `Processing: ${t5 - t4} | Cumulative time: ${t5 - t1}\n` +
        `Outputting: ${t6 - t5} | cumulative time: ${t6 - t1}\n` +
        `Write to file: ${t7 - t6} | cumulative time: ${t7 - t1}\n`;

    return {
        dbgTimingInfo: dbgTimingInfo,
        dbgInputText: text_buf,
        dbgParsed: parsed,
        dbgEvaluated: evaluated,
        dbgProcessed: processed,
        dbgOutputted: output,
    };
}
