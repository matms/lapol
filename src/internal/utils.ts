import { promises as fsp } from "fs";
import mkdirp from "mkdirp";
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
    // Create the directory which will contain this file, if it doesn't already exist
    await mkdirp(filePath.parsed.dir);

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

export function outFilePath(inFilePath: LaPath, targetExt: string): LaPath {
    const p = inFilePath.parsed;
    const sep = inFilePath.sep;
    return new LaPath(p.dir + sep + "out" + sep + p.name + "." + targetExt, inFilePath.pathKind);
}
