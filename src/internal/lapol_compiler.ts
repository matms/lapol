import { LaPath } from "./la_path";
import { render as runRender } from "./compile";
import { LapolModule, loadModule, ModuleDeclaration } from "./module/module";
import { mod as coreMod } from "./../std/core";
import { InternalLapolContext } from "./context";
import { LapolError } from "./errors";
import { strict as assert } from "assert";
import { NodeOutputter } from "./output/node_outputter";
import { Expr } from "./det";
import { OutputTarget } from "./output/output";
import { string } from "yargs";
import { ExprMeta } from "./expr_meta";
import { LapolRegistry } from "./registry/registry";

export class LapolCompilerBuilder {
    private readonly _modules: Array<Promise<LapolModule>>;
    private readonly _targets: string[];
    private readonly _lapolRegistry: LapolRegistry;

    constructor() {
        this._lapolRegistry = new LapolRegistry();
        this._modules = [];
        this._targets = [];
        this.withModule("std::core", coreMod);
    }

    public withModule(name: string, mod: ModuleDeclaration): LapolCompilerBuilder {
        this._modules.push(loadModule(name, mod, this._lapolRegistry));

        return this;
    }

    public withTargets(targets: string[]): LapolCompilerBuilder {
        this._targets.push(...targets);
        return this;
    }

    public async build(): Promise<LapolCompiler> {
        // TODO: Implement withTargets()

        const modArray = await Promise.all(this._modules); // Note this preserves order.

        for (const m of modArray) {
            this._lapolRegistry.modules.declare(m.identifier.name, m);
        }

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
}
