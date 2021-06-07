import { LaPath } from "./la_path";
import { render as runRender } from "./compile";
import { LapolModule, loadModule, ModuleDeclaration, ModuleTarget } from "./module/module";
import { mod as coreMod } from "./../std/core";
import { InternalLapolContext } from "./context";
import { LapolError } from "./errors";
import { strict as assert } from "assert";
import { NodeOutputter } from "./output/node_outputter";
import { Expr } from "./det";
import { OutputTarget } from "./output/output";

export class LapolCompilerBuilder {
    private readonly _modules: Array<Promise<LapolModule>>;
    private readonly _targets: string[];

    constructor() {
        this._modules = [];
        this._targets = [];
        this.withModule("std::core", coreMod);
    }

    public withModule(name: string, mod: ModuleDeclaration): LapolCompilerBuilder {
        this._modules.push(loadModule(name, mod));

        return this;
    }

    public withTargets(targets: string[]): LapolCompilerBuilder {
        this._targets.push(...targets);
        return this;
    }

    public async build(): Promise<LapolCompiler> {
        // TODO: Implement withTargets()

        const modArray = await Promise.all(this._modules); // Note this preserves order.
        const mods = new Map();

        const targets: Map<string, OutputTarget> = new Map();
        for (const target of this._targets) {
            targets.set(target, { exprOutputters: new Map() });
        }

        for (const m of modArray) {
            mods.set(m.identifier.name, m);

            for (const target of this._targets) {
                if (m.targets.has(target)) {
                    this._addModuleTargetOutputters(targets, target, m);
                }
            }
        }

        return new LapolCompiler(new InternalLapolContext(mods, targets));
    }

    private _addModuleTargetOutputters(
        targets: Map<string, OutputTarget>,
        target: string,
        m: LapolModule
    ): void {
        const targetData = targets.get(target);
        assert(targetData !== undefined);
        const moduleTarget = m.targets.get(target) as ModuleTarget;

        for (const [tag, outputter] of moduleTarget.exprOutputters) {
            if (targetData.exprOutputters.has(tag)) {
                console.log(
                    `WARNING: Expr Outputter redefinition (for ${tag}). ` +
                        `Likely, two outputters for the same tag were defined by two different ` +
                        `modules.Overriding old outputter with outputter from ${m.identifier.name}.`
                );
            }
            targetData.exprOutputters.set(tag, outputter);
        }
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
