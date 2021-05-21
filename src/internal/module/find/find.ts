import { LapolError } from "../../errors";
import { LaPath } from "../../la_path";
import { jsModFromTs } from "../../shell/compile_ts";
import { canAccess } from "../../utils";

function neighboringJs(inFilePath: LaPath): LaPath {
    const p = inFilePath.parsed;
    const sep = inFilePath.sep;
    return new LaPath(`${p.dir}${sep}${p.name}.js`, inFilePath.pathKind);
}

function neighboringTs(inFilePath: LaPath): LaPath {
    const p = inFilePath.parsed;
    const sep = inFilePath.sep;
    return new LaPath(`${p.dir}${sep}${p.name}.ts`, inFilePath.pathKind);
}

/** Throws an error if cannot find */
export async function procureAnonMod(inFilePath: LaPath): Promise<LaPath> {
    const a = neighboringJs(inFilePath);
    if (await canAccess(a)) {
        return a;
    }
    const b = neighboringTs(inFilePath);
    if (await canAccess(b)) {
        return await jsModFromTs(b);
    }
    throw new LapolError(`Cannot find anonymous module corresponding to ${inFilePath.fullPath}`);
}
