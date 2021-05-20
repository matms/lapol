import { LapolError } from "../../errors";
import { LaPath } from "../../la_path";
import { jsModFromTs } from "../../shell/compile_ts";
import { canAccess } from "../../utils";

function neighboringJs(inFilePath: LaPath): LaPath {
    let p = inFilePath.parsed;
    let sep = inFilePath.sep;
    return new LaPath(`${p.dir}${sep}${p.name}.js`, inFilePath.pathKind);
}

function neighboringTs(inFilePath: LaPath): LaPath {
    let p = inFilePath.parsed;
    let sep = inFilePath.sep;
    return new LaPath(`${p.dir}${sep}${p.name}.ts`, inFilePath.pathKind);
}

/** Throws an error if cannot find */
export async function procureAnonMod(inFilePath: LaPath): Promise<LaPath> {
    let a = neighboringJs(inFilePath);
    if (await canAccess(a)) {
        return a;
    }
    let b = neighboringTs(inFilePath);
    if (await canAccess(b)) {
        return await jsModFromTs(b);
    }
    throw new LapolError(`Cannot find anonymous module corresponding to ${inFilePath.fullPath}`);
}
