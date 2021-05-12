import { promises as fsp } from "fs";

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
