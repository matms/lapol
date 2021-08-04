import { LaPath } from "./la_path";
import { render as runRender } from "./compile";
import { loadModule, ModuleDeclaration } from "./module/module";
import { mod as coreMod } from "../std/core";
import { InternalLapolContext } from "./context";
import { LapolRegistry } from "./registry/registry";
import { getLapolFolder } from "./global_init";
import { copyFile } from "./utils";
import { LapolError } from "./errors";

export class LapolCompilerBuilder {
    private readonly _thunks: Array<() => void> = [];

    private readonly _modules: Array<Promise<string[]>> = [];
    private readonly _lapolRegistry: LapolRegistry;

    private _outputFolder: LaPath | undefined;

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

    public toFolder(outputFolder: LaPath): LapolCompilerBuilder {
        this._outputFolder = outputFolder;
        return this;
    }

    public async build(): Promise<LapolCompiler> {
        if (this._outputFolder === undefined)
            throw new LapolError("LapolCompilerBuilder: Output folder not set");

        // Running the thunks right now (instead of immediately after creating them)
        // guarantees that the modules will
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

        /*
        console.log(
            `[LapolCompilerBuilder] Loaded modules: ${Array.from(
                loadedModules.values()
            ).toString()}`
        );
        */

        return new LapolCompiler(new InternalLapolContext(this._lapolRegistry), this._outputFolder);
    }
}

export class LapolCompiler {
    private readonly _ctx: InternalLapolContext;
    private readonly _outputFolder: LaPath;

    /** @internal Use LapolCompilerBuilder instead.
     *
     * DO NOT CALL THIS CONSTRUCTOR (except from LapolContextBuilder).
     */
    public constructor(internalCtx: InternalLapolContext, outputFolder: LaPath) {
        this._ctx = internalCtx;
        this._outputFolder = outputFolder;
    }

    /** Renders a file to a given target (e.g. "html"). */
    public async render(file: LaPath, outRelativePath: string, target: string): Promise<void> {
        await runRender(
            this._ctx,
            file,
            new LaPath(this._outputFolder.fullPath + this._outputFolder.sep + outRelativePath),
            target
        );
    }

    // TODO: Make this customizable
    public async outputDependencies(): Promise<void> {
        await copyFile(
            new LaPath(getLapolFolder().fullPath + `/../deps/hello-css/dist/all.css`), // source
            new LaPath(this._outputFolder.fullPath + `/deps/hello-css-all.css`) // target
        );

        // Fonts
        const DEFAULT_FONTS = [
            "libre-baskerville.woff2",
            "libre-baskerville-bold.woff2",
            "libre-baskerville-italic.woff2",
        ];
        for (const font of DEFAULT_FONTS) {
            await copyFile(
                new LaPath(getLapolFolder().fullPath + `/../deps/hello-css/fonts/${font}`),
                new LaPath(this._outputFolder.fullPath + `/deps/fonts/${font}`) // target
            );
        }

        // Copy Font Licence Information
        await copyFile(
            new LaPath(getLapolFolder().fullPath + `/../deps/hello-css/fonts/LICENSE`),
            new LaPath(this._outputFolder.fullPath + `/deps/fonts/LICENSE`) // target
        );
    }
}
