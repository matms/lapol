import { LaPath } from "./la_path";
import { render as runRender } from "./compile";
import { LapolModule, loadModule, ModuleDeclaration } from "./module/module";
import { mod as coreMod } from "./../std/core";
import { InternalLapolContext } from "./context";

export class LapolCompilerBuilder {
    private readonly _modules: Array<Promise<LapolModule>>;

    constructor() {
        this._modules = [];
        this.withModule("std::core", coreMod);
    }

    public withModule(name: string, mod: ModuleDeclaration): LapolCompilerBuilder {
        this._modules.push(loadModule(name, mod));

        return this;
    }

    public async build(): Promise<LapolCompiler> {
        const modArray = await Promise.all(this._modules);
        const mods = new Map();
        for (const m of modArray) {
            mods.set(m.identifier.name, m);
        }
        return new LapolCompiler(new InternalLapolContext(mods));
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

    /** Renders a file. TODO. */
    public async render(file: LaPath, target: string): Promise<void> {
        await runRender(this._ctx, file, target);
    }
}
