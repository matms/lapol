import * as fs from "fs";

/** Synchronously read the file with path `file_path`. */
export function readFileAtOnce(file_path: string): string {
    let data = fs.readFileSync(file_path, { encoding: "utf8", flag: "r" });
    return data;
}

/** Synchronously write (override) the file with path `file_path`. */
export function writeFileAtOnce(path: string, data: string) {
    fs.writeFileSync(path, data, { encoding: "utf8" });
}

/** Return true if thing is `null` or `undefined`, false otherwise */
export function isNil(thing: any): boolean {
    return thing === undefined || thing === null;
}
