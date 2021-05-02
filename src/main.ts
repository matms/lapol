import { debugDefaultActions, render } from "./internal/run";

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
            } else render(args[1]);
        } else console.error(`LAPOL ERROR <@ main>: Unknown command ${args[0]}`);
    }
}

consoleMain();
