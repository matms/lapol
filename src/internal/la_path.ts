import { ParsedPath } from "path";
import * as nodePathRoot from "path";

export class LaPath {
    _pathKind: "windows" | "posix" | undefined;
    _fullPath: string;
    _parsed: ParsedPath;
    _sep: string;

    public constructor(path: string, forcePathKind?: "windows" | "posix" | undefined) {
        let np = getNodePathLib(forcePathKind);
        this._pathKind = forcePathKind;
        this._fullPath = path;
        this._parsed = np.parse(path);
        this._sep = np.sep;
    }

    get fullPath() {
        return this._fullPath;
    }

    get sep() {
        return this._sep;
    }

    get parsed() {
        return this._parsed;
    }

    get pathKind() {
        return this._pathKind;
    }
}

function getNodePathLib(pathKind: "windows" | "posix" | undefined): any {
    if (pathKind === undefined) {
        return nodePathRoot;
    } else if (pathKind === "posix") {
        return nodePathRoot.posix;
    } else if (pathKind === "windows") {
        return nodePathRoot.win32;
    }
}
