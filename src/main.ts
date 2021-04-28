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

console.log(`Hey`);
var before_read = Date.now();
var test = readFileAtOnce("test_scratch/test_parse_0.lap");
var start_time = Date.now();
var o = parse(test);
var now = Date.now();
console.log(`Parsing took time: ${now - start_time} (milliseconds)`);
console.log(
    `Reading File + Parsing took time: ${now - start_time} (milliseconds)`
);
console.log("=======");
console.log(o);
console.log("=======");

// consoleMain();
