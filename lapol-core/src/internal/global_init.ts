import { LapolError } from "./errors";
import { LaPath } from "./la_path";

let lapolFolder: LaPath | undefined;

export function setLapolFolder(folder: LaPath): void {
    lapolFolder = folder;
}

export function getLapolFolder(): LaPath {
    if (lapolFolder === undefined) throw new LapolError("lapolFolder not configured");
    return lapolFolder;
}
