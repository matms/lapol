import { promises as fsp } from "fs";
import mkdirp from "mkdirp";
import * as nodePath from "path";
import { LaPath } from "./la_path";

/** WARNING: Promises are truthy, I think. MAKE SURE TO AWAIT THIS! */
export async function canAccess(filePath: LaPath): Promise<boolean> {
    try {
        await fsp.access(filePath.fullPath);
        return true;
    } catch (error) {
        return false;
    }
}

export async function readFile(filePath: LaPath): Promise<string> {
    return await fsp.readFile(filePath.fullPath, { encoding: "utf8", flag: "r" });
}

export async function readFileBuffer(filePath: LaPath): Promise<Buffer> {
    return await fsp.readFile(filePath.fullPath, { encoding: null, flag: "r" });
}

export async function writeFile(filePath: LaPath, data: string): Promise<void> {
    await mkdirp(filePath.parsed.dir);
    // await fsp.writeFile(filePath, data, { encoding: "utf8" });
    await fsp.writeFile(filePath.fullPath, data);
}

/** Return true iff `str` is comprised solely of whitespace characters.
 *
 *  Note newline is considered whitespace.
 */
export function isWhitespace(str: string): boolean {
    return str.trim() === "";
    // https://stackoverflow.com/questions/1496826/check-if-a-single-character-is-a-whitespace
}

// TODO: Currently, if folder 'out' does not exist, this gives an error. So, create the folder
// out automatically, if it doesn't exist.
export function outFilePath(
    inFilePath: string,
    targetExt: string,
    forcePathKind?: "windows" | "posix" | undefined
) {
    if (forcePathKind === "windows") {
        const p = nodePath.win32.parse(inFilePath);
        const sep = nodePath.win32.sep;
        return p.dir + sep + "out" + sep + p.name + "." + targetExt;
    } else if (forcePathKind === "posix") {
        const p = nodePath.posix.parse(inFilePath);
        const sep = nodePath.posix.sep;
        return p.dir + sep + "out" + sep + p.name + "." + targetExt;
    } else {
        const p = nodePath.parse(inFilePath);
        const sep = nodePath.sep;
        return p.dir + sep + "out" + sep + p.name + "." + targetExt;
    }
}
