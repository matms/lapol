import { ModuleLoader } from "../../mod";

export const mod = { loaderFn: load };

function load(l: ModuleLoader): void {
    throw new Error("LaTeX Output not yet supported.");
}
