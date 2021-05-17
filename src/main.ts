import { render } from "./internal/run";
import { init as lapol_rs_init } from "lapol-rs";

export async function consoleMain() {
    console.log("Hello, LaPoL!");
    console.log(process.argv);

    let args = process.argv.slice(2);
    console.log(args);

    if (args.length === 0) {
        console.log("No arguments passed, so not doing anything, I think (?)");
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

lapol_rs_init();

consoleMain();

/*
async function stress() {
    //while (true) {
    // await test_rust();
    await consoleMain();
    //}
}
*/
