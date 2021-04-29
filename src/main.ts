import { evaluateAst } from "./evaluate/evaluate";
import { readFileAtOnce, writeFileAtOnce } from "./utils";
import { parse } from "./parse/parse";

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

function test_timings(text: string): number {
    var start_time = Date.now();
    var o = parse(text);
    var now = Date.now();
    return now - start_time;
}

function test_parser(text: string) {
    return parse(text);
}

console.log("Hey!");

var test = readFileAtOnce("test_scratch/test_cmd_0.lap");

var start_time = Date.now();
var parsed = parse(test);
var now = Date.now();

// var timing = 0;

console.log(`Parsing took time(s): ${now - start_time} (milliseconds)`);
console.log(parsed);

// ============================

var estart_time = Date.now();
var evaluated = evaluateAst(parsed).then((val) => {
    var enow = Date.now();
    console.log(`Evaluating took time(s): ${enow - estart_time} (milliseconds)`);
    console.log(val);
    console.log("Awesome!");
});

console.log("Bye? (But maybe wait for promises!)");

// consoleMain();
