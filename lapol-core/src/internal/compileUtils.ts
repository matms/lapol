import { parse_file } from "../../../lapol-rs/pkg/lapol_rs";
import { AstRootNode } from "./ast";
import { LaPath } from "./laPath";
import { strict as assert } from "assert";
import { Output } from "./out/common";
import { OutputRequirementReceiver } from "./out/outRequirements";
import { copyFile, writeFile } from "./utils";

export function _parse(path: LaPath, file: Buffer): AstRootNode {
    const parsed = parse_file(path.fullPath, file) as AstRootNode;
    assert(parsed.t === "AstRootNode");
    return parsed;
}

export async function _finalizeOutput(
    o: Output,
    outputFolder: LaPath,
    outputRelativePath: string,
    outputRequirementReceiver: OutputRequirementReceiver
): Promise<void> {
    const outputFilePath = new LaPath(
        outputFolder.fullPath + outputFolder.sep + outputRelativePath
    );

    await writeFile(outputFilePath, o.code);

    const copyPromises: Array<Promise<void>> = [];
    for (const [tgtDepFileRelPath, srcDepFile] of outputRequirementReceiver.files) {
        const f = async (): Promise<void> => {
            // Checking if the copy was actually needed would be nice, but this is really tricky to
            // synchronize correctly within NodeJs, unless we abandon asynchronous copies.
            // So for now, we'll just always copy.
            try {
                await copyFile(
                    srcDepFile, // source
                    new LaPath(outputFolder.fullPath + outputFolder.sep + tgtDepFileRelPath) // target
                );
            } catch (e) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if (e.code === "EBUSY") {
                    // Either you'd copy over the same file that is already being copied over,
                    // in which case there is no issue, OR you'd copy over a different file,
                    // which would cause issues with the first copy _anyways_, so you'd have a
                    // bigger problem than this EBUSY. In general, as long as you never write
                    // _distinct_ contents to the same file, you're good.
                    //
                    // Unfortunately, avoiding this EBUSY is not trivial at all. The simplest
                    // solution is to do all copies sequentially, which is not great for
                    // performance :(.
                    console.log(
                        `EBUSY Error when copying (probably NOT an issue, you may ignore this).`
                    );
                    console.log(e);
                } else {
                    throw e;
                }
            }
        };

        copyPromises.push(f());
    }

    await Promise.all(copyPromises);
}
