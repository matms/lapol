import { strict as assert } from "assert";
import { LapolError } from "./errors";

export interface Identifier {
    absolute: boolean; // Absolute paths start with a colon.
    path: string[];
    name: string;
}

export function parseIdentifier(idStr: string): Identifier {
    assert(idStr !== "");
    const parts = idStr.split(":");
    const name = parts.pop();

    let absolute = false;
    if (parts[0] === "") {
        absolute = true;
        parts.shift();
    }

    if (name === undefined) throw new LapolError(`Malformed identifier "${idStr}"`);
    return { absolute: absolute, path: parts, name: name };
}
