import { AstRootNode } from "./ast";
import { DetNode } from "./det";
import { evaluateAst } from "./evaluate/evaluate";
import { outputDet, OutputData } from "./output/output";
import { parse } from "./parse/parse";
import { processDet } from "./process/process";
import { readFile, writeFile } from "./utils";

export interface CompileInput {
    inputFilePath: string;
    outputFilePath: string;
    targetLanguage: string;
}

export interface CompileOutput {
    dbgTimingInfo: string;
    dbgInputText: string;
    dbgParsed: AstRootNode;
    dbgEvaluated: DetNode;
    dbgProcessed: DetNode;
    dbgOutputted: OutputData;
}

export async function compile(c: CompileInput): Promise<CompileOutput> {
    var t1 = Date.now();
    let text = await readFile(c.inputFilePath);
    var t2 = Date.now();
    var parsed = await parse(text);
    var t3 = Date.now();
    var evaluated = await evaluateAst(parsed);
    var t4 = Date.now();
    var processed = await processDet(evaluated);
    var t5 = Date.now();
    var output = await outputDet(processed, c.targetLanguage);
    var t6 = Date.now();
    await writeFile(c.outputFilePath, output.str);
    var t7 = Date.now();

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
        dbgInputText: text,
        dbgParsed: parsed,
        dbgEvaluated: evaluated,
        dbgProcessed: processed,
        dbgOutputted: output,
    };
}
