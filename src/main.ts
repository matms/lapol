import { evaluateAst } from "./evaluate/evaluate";
import { readFileAtOnce, writeFileAtOnce } from "./utils";
import { parse } from "./parse/parse";
import { processDet } from "./process/process";
import { outputDet } from "./output/output";

async function compile(inFilePath: string, outFilePath: string) {
    console.log("Starting to compile...");

    var t1 = Date.now();
    let text = readFileAtOnce(inFilePath); // TODO MAKE ASYNC
    var t2 = Date.now();
    var parsed = await parse(text);
    var t3 = Date.now();
    var evaluated = await evaluateAst(parsed);
    var t4 = Date.now();
    var processed = await processDet(evaluated);
    var t5 = Date.now();
    var output = await outputDet(processed, "html");
    var t6 = Date.now();
    writeFileAtOnce(outFilePath, output.str);
    var t7 = Date.now();
    console.log("====================");

    console.log("Timings (in milliseconds):");
    console.log(`read file in: ${t2 - t1}`);
    console.log(`parse: ${t3 - t2}, cumulative time: ${t3 - t1}`);
    console.log(`evaluate: ${t4 - t3}, cumulative time: ${t4 - t1}`);
    console.log(`process: ${t5 - t4}, cumulative time: ${t5 - t1}`);
    console.log(`output: ${t6 - t5}, cumulative time: ${t6 - t1}`);
    console.log(`write output to file: ${t7 - t6}, cumulative time: ${t7 - t1}`);

    console.log("====================");

    console.log("AST:");
    console.log(parsed);
    console.log("Evaluation output (DET):");
    console.log(evaluated);
    console.log("Processed DET:");
    console.log(processed);
    console.log("Output:");
    console.log(output);

    console.log("Goodbye!");
}

function consoleMain() {
    console.log("Hello, LaPoL!");
    console.log(process.argv);

    let args = process.argv.slice(2);
    console.log(args);

    if (args.length === 0) {
        console.log("No arguments passed, using default debug mode");

        console.log("Opening a file, writing it out.");
        let data = readFileAtOnce("test_scratch/test_read.txt");
        writeFileAtOnce("test_scratch/test_write.txt", data);
    }
}

console.log("Calling compile");

compile("test_scratch/stress_test_0.lap", "test_scratch/testOut.html");

console.log("Called compile, now wait for the promises!");
