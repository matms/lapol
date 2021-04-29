import { readFileAtOnce, writeFileAtOnce } from "./la_utils";
import { parse } from "./reader";

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

var test = readFileAtOnce("test_scratch/test_parse_0.lap");

var start_time = Date.now();
var o = parse(test);
var now = Date.now();

// var timing = 0;

console.log(`Parsing took time(s): ${now - start_time} (milliseconds)`);
console.log(o);

console.log("Bye!");

// consoleMain();
