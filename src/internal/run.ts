import { compile } from "./compile";
import { initInternalLapoLContext } from "./internal_context";
import { outFilePath } from "./utils";
import { LaPath } from "./la_path";

export async function compileDbg(inFilePath: LaPath, outFilePath: LaPath): Promise<void> {
    console.log("\n====== Starting to compile ======\n");

    const lctx = initInternalLapoLContext();

    const o = await compile(
        {
            inputFilePath: inFilePath,
            outputFilePath: outFilePath,
            targetLanguage: "html",
        },
        lctx
    );

    console.log(
        `\nFinished compiling '${inFilePath.fullPath}', outputted to '${outFilePath.fullPath}'.\n`
    );

    console.log(o.dbgTimingInfo);

    console.log("Done with compileDbg");
}

export async function render(filePath: LaPath, target: string = "html"): Promise<void> {
    const ofp = outFilePath(filePath, target);
    console.log(`Will render ${filePath.fullPath} to ${ofp.fullPath}`);
    await compileDbg(filePath, ofp);
    console.log("Done!");
}
