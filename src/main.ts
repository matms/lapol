import { compile } from "./compile";

async function compileA(inFilePath: string, outFilePath: string) {
    console.log("Starting to compile...");

    let o = await compile({
        inputFilePath: inFilePath,
        outputFilePath: outFilePath,
        targetLanguage: "html",
    });

    console.log(`Finished compiling '${inFilePath}', outputted to '${outFilePath}'.`);

    console.log(o.dbgTimingInfo);

    console.log("Bye!");
}

function consoleMain() {
    console.log("Hello, LaPoL!");
    console.log(process.argv);

    let args = process.argv.slice(2);
    console.log(args);

    if (args.length === 0) {
        console.log("No arguments passed, using default debug mode");
    }
}

console.log("Calling compile");

compileA("test_scratch/stress_test_0.lap", "test_scratch/testOut.html");

console.log("Called compile, now wait for the promises!");
