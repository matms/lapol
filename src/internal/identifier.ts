import { strict as assert } from "assert";
import { LapolError } from "./errors";

export interface Identifier {
    absolute: boolean; // Absolute paths start with a colon.
    path: string[];
    name: string;
}

export function parseIdentifier(idStr: string): Identifier {
    assert(idStr !== "");
    const parts = [];
    let acc = "";
    let i = 0;
    while (i < idStr.length) {
        if (idStr[i] === ":" && idStr[i + 1] === ":") {
            acc += "::";
            i += 2;
        } else if (idStr[i] === ":") {
            parts.push(acc);
            acc = "";
            i += 1;
        } else {
            acc += idStr[i];
            i += 1;
        }
    }
    if (acc !== "") parts.push(acc);
    // const parts = idStr.split(":");
    const name = parts.pop();

    let absolute = false;
    if (parts[0] === "") {
        absolute = true;
        parts.shift();
    }

    if (name === undefined) throw new LapolError(`Malformed identifier "${idStr}"`);
    return { absolute: absolute, path: parts, name: name };
}
