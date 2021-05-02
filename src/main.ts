import { compile } from "./compile";
import * as nodePath from "path";
import { LapolError } from "./errors";

async function compileDbg(inFilePath: string, outFilePath: string) {
    console.log("\n====== Starting to compile ======\n");

    let o = await compile({
        inputFilePath: inFilePath,
        outputFilePath: outFilePath,
        targetLanguage: "html",
    });

    console.log(`\nFinished compiling '${inFilePath}', outputted to '${outFilePath}'.\n`);

    console.log(o.dbgTimingInfo);

    console.log("Done with compileDbg");
}

async function render(
    filePath: string,
    target: string = "html",
    forcePathKind?: "windows" | "posix" | undefined
) {
    // TODO: Currently, if folder 'out' does not exist, this gives an error. So, create the folder
    // out automatically, if it doesn't exist.
    function outFilePath(inFilePath: string) {
        if (forcePathKind === "windows") {
            let p = nodePath.win32.parse(inFilePath);
            let sep = nodePath.win32.sep;
            return p.root + p.dir + sep + "out" + sep + p.name + "." + target;
        } else if (forcePathKind === "posix") {
            let p = nodePath.posix.parse(inFilePath);
            let sep = nodePath.posix.sep;
            return p.root + p.dir + sep + "out" + sep + p.name + "." + target;
        } else {
            let p = nodePath.parse(inFilePath);
            let sep = nodePath.sep;
            return p.root + p.dir + sep + "out" + sep + p.name + "." + target;
        }
    }

    let ofp = outFilePath(filePath);
    console.log(`Will render ${filePath} to ${ofp}`);
    await compileDbg(filePath, ofp);
    console.log("Done!");
}

function consoleMain() {
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

// What to do if no parameters are passed (this is useful for debugging with vscode)
function debugDefaultActions() {
    console.log("Calling compile");
    render("test_scratch/test_cmd_0.lap", "html", "posix");
    console.log("Called compile, now wait for the promises!");
}

consoleMain();
