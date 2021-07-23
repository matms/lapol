import { ParsedPath } from "path";
import * as nodePathRoot from "path";
import { LapolError } from "./errors";

export class LaPath {
    readonly pathKind: "windows" | "posix" | undefined;
    readonly fullPath: string;
    readonly parsed: ParsedPath;
    readonly sep: string;

    public constructor(path: string, forcePathKind?: "windows" | "posix" | undefined) {
        const np = getNodePathLib(forcePathKind);

        this.pathKind = forcePathKind;
        this.fullPath = np.resolve(path);
        this.parsed = np.parse(this.fullPath);
        this.sep = np.sep;
    }
}

function getNodePathLib(pathKind: "windows" | "posix" | undefined): nodePathRoot.PlatformPath {
    if (pathKind === undefined) {
        return nodePathRoot;
    } else if (pathKind === "posix") {
        return nodePathRoot.posix;
    } else if (pathKind === "windows") {
        return nodePathRoot.win32;
    }
    throw new LapolError("unreachable!");
}
