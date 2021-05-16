import { compile } from "./compile";
import * as nodePath from "path";
import { LapolError } from "./errors";
import { initGlobalLapoLContext } from "./context";
import { outFilePath } from "./utils";

export async function compileDbg(inFilePath: string, outFilePath: string) {
    console.log("\n====== Starting to compile ======\n");

    let lctx = initGlobalLapoLContext();

    let o = await compile(
        {
            inputFilePath: nodePath.resolve(inFilePath),
            outputFilePath: outFilePath,
            targetLanguage: "html",
        },
        lctx
    );

    console.log(
        `\nFinished compiling '${inFilePath}' (${nodePath.resolve(
            inFilePath
        )}), outputted to '${outFilePath}'.\n`
    );

    console.log(o.dbgTimingInfo);

    console.log("Done with compileDbg");
}

export async function render(
    filePath: string,
    target: string = "html",
    forcePathKind?: "windows" | "posix" | undefined
) {
    let ofp = outFilePath(filePath, target, forcePathKind);
    console.log(`Will render ${filePath} to ${ofp}`);
    await compileDbg(filePath, ofp);
    console.log("Done!");
}

// What to do if no parameters are passed (this is useful for debugging with vscode)
export function debugDefaultActions() {
    console.log("Calling compile");
    render("test_scratch/stress_test_0.lap", "html", "posix");
    console.log("Called compile, now wait for the promises!");
}
