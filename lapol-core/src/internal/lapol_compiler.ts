import { LaPath } from "./la_path";
import { render as runRender } from "./compile";
import { LapolModule, loadModule, ModuleDeclaration } from "./module/module";
import { mod as coreMod } from "./../std/core";
import { InternalLapolContext } from "./context";
import { LapolRegistry } from "./registry/registry";
import { getLapolFolder } from "./global_init";
import { copyFile } from "./utils";

export class LapolCompilerBuilder {
    private readonly _thunks: Array<() => void> = [];

    private readonly _modules: Array<Promise<string[]>> = [];
    private readonly _lapolRegistry: LapolRegistry;

    constructor() {
        this._lapolRegistry = new LapolRegistry();
        this.withModule("std::core", coreMod);
    }

    public withModule(name: string, mod: ModuleDeclaration): LapolCompilerBuilder {
        this._thunks.push(() => {
            this._modules.push(loadModule(name, mod, this._lapolRegistry));
        });

        return this;
    }

    public withTargets(...targets: string[]): LapolCompilerBuilder {
        targets.forEach((t) => this._lapolRegistry.targetNames.add(t));
        return this;
    }

    public async build(): Promise<LapolCompiler> {
        // Running the thunks right now (instead of immediately) guarantees that the modules will
        // observe the correct value of `this._lapolRegistry.targetNames` when loading.
        //
        // This allows the user to call `withTargets` and `withModule` in any order.
        for (const thunk of this._thunks) {
            thunk();
        }

        const modArrayNested = await Promise.all(this._modules); // Note this preserves order.

        // Includes submodules.
        const loadedModules: Set<string> = new Set();

        modArrayNested.forEach((x) => x.forEach((m) => loadedModules.add(m)));

        console.log(
            `[LapolCompilerBuilder] Loaded modules: ${Array.from(
                loadedModules.values()
            ).toString()}`
        );

        return new LapolCompiler(new InternalLapolContext(this._lapolRegistry));
    }
}

export class LapolCompiler {
    private readonly _ctx: InternalLapolContext;

    /** @internal Use LapolCompilerBuilder instead.
     *
     * DO NOT CALL THIS CONSTRUCTOR (except from LapolContextBuilder).
     */
    public constructor(internalCtx: InternalLapolContext) {
        this._ctx = internalCtx;
    }

    /** Renders a file to a given target (e.g. "html"). */
    public async render(file: LaPath, target: string): Promise<void> {
        await runRender(this._ctx, file, target);
    }

    // TODO: Make this customizable
    public async outputDependencies(file: LaPath): Promise<void> {
        await copyFile(
            new LaPath(getLapolFolder().fullPath + `/../hello-css/dist/all.css`), // source
            new LaPath(file.parsed.dir + `/out/hello-css-all.css`) // target
        );
    }
}
