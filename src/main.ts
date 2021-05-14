import { debugDefaultActions, render } from "./internal/run";
import { init as lapol_rs_init, parse_file } from "lapol-rs";
import { readFileBuffer } from "./internal/utils";

export async function consoleMain() {
    console.log("Hello, LaPoL!");
    console.log(process.argv);

    let args = process.argv.slice(2);
    console.log(args);

    if (args.length === 0) {
        console.log("No arguments passed, using default debug mode");

        debugDefaultActions();
    } else {
        if (args[0] === "render") {
            if (args.length !== 2) {
                console.error(`LAPOL ERROR <@ main>: Must indicate exactly one file to render`);
            } else await render(args[1]);
        } else if (args[0] === "profile") {
            if (args.length !== 2) {
                console.error(`LAPOL ERROR <@ main>: Must indicate exactly one file to render`);
            } else {
                while (true) {
                    await render(args[1]);
                }
            }
        } else console.error(`LAPOL ERROR <@ main>: Unknown command ${args[0]}`);
    }
}

async function test_rust() {
    let path = "X:\\programming\\programming\\LaPoL Project\\lapol\\test_scratch\\parse.lap";

    let tr = Date.now();
    let f = await readFileBuffer(path);
    let tr2 = Date.now();

    console.log(`NOTE: Reading buffer for rust took time ${tr2 - tr} millis.`);

    let t1 = Date.now();
    let out = parse_file(path, f);
    let t2 = Date.now();

    console.log(`NOTE: Rust parser Took time ${t2 - t1} millis`);

    console.log(out);

    console.log("Bye!");
}

lapol_rs_init();

async function stress() {
    //while (true) {
    // await test_rust();
    await consoleMain();
    //}
}

stress();
