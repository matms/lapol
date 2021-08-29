import { ModuleLoader } from "../mod";

export const mod = { loaderFn: load };

function load(l: ModuleLoader): void {
    l.requireName("std::main::latex_output");

    l.declareInstantiator(() => {
        return {
            moduleName: "std::main::latex_output",
        };
    });

    l.declareTarget("latex");

    l.exportLtrfNodeOutputter("latex", "maketitle", (obj, ctx) => {
        return { code: `\\maketitle\n` };
    });

    throw new Error("LaTeX Output not yet supported.");
}
