import { promises as fsp } from "fs";
import * as nodePath from "path";

export async function readFile(filePath: string): Promise<string> {
    return await fsp.readFile(filePath, { encoding: "utf8", flag: "r" });
}

export async function readFileBuffer(filePath: string): Promise<Buffer> {
    return await fsp.readFile(filePath, { encoding: null, flag: "r" });
}

export async function writeFile(filePath: string, data: string) {
    // await fsp.writeFile(filePath, data, { encoding: "utf8" });
    await fsp.writeFile(filePath, data);
}

/** Return true iff `str` is comprised solely of whitespace characters.
 *
 *  Note newline is considered whitespace.
 */
export function isWhitespace(str: string) {
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
        let p = nodePath.win32.parse(inFilePath);
        let sep = nodePath.win32.sep;
        return p.dir + sep + "out" + sep + p.name + "." + targetExt;
    } else if (forcePathKind === "posix") {
        let p = nodePath.posix.parse(inFilePath);
        let sep = nodePath.posix.sep;
        return p.dir + sep + "out" + sep + p.name + "." + targetExt;
    } else {
        let p = nodePath.parse(inFilePath);
        let sep = nodePath.sep;
        return p.dir + sep + "out" + sep + p.name + "." + targetExt;
    }
}

export function anonModPath(inFilePath: string, forcePathKind?: "windows" | "posix" | undefined) {
    if (forcePathKind === "windows") {
        let p = nodePath.win32.parse(inFilePath);
        let sep = nodePath.win32.sep;
        return p.dir + sep + p.name + "." + "js";
    } else if (forcePathKind === "posix") {
        let p = nodePath.posix.parse(inFilePath);
        let sep = nodePath.posix.sep;
        return p.dir + sep + p.name + "." + "js";
    } else {
        let p = nodePath.parse(inFilePath);
        let sep = nodePath.sep;
        return p.dir + sep + p.name + "." + "js";
    }
}
