import { LaPath } from "./laPath";
import { _parse, _finalizeOutput } from "./compileUtils";
import { loadModule, ModuleDeclaration } from "./module/module";
import { mod as coreMod } from "../std/core";
import { LapolContext } from "./context/lapolContext";
import { LapolRegistry } from "./registry/registry";
import { LapolError } from "./errors";
import { readFileBuffer } from "./utils";
import { AstRootNode } from "./ast";
import { isLtrfNode, LtrfNode } from "./ltrf/ltrf";
import { FileContext } from "./context/fileContext";
import { evaluatePass } from "./evaluate/evaluate";
import { strict as assert } from "assert";
import { processPass } from "./process/process";
import { DefaultOutputDispatcher } from "./out/dispatcher";
import { OutputRequirementReceiver } from "./out/outRequirements";
import { outputPass } from "./out/out";
import { Output } from "./out/common";

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

        return new LapolCompiler(new LapolContext(this._lapolRegistry), this._outputFolder);
    }
}

export class LapolCompiler {
    private readonly _ctx: LapolContext;
    private readonly _outputFolder: LaPath;

    /** @internal Use LapolCompilerBuilder instead.
     *
     * DO NOT CALL THIS CONSTRUCTOR (except from LapolContextBuilder).
     */
    public constructor(internalCtx: LapolContext, outputFolder: LaPath) {
        this._ctx = internalCtx;
        this._outputFolder = outputFolder;
    }

    /** Renders a file to a given target (e.g. "html"). */
    public async compile(file: LaPath, outRelativePath: string, target: string): Promise<void> {
        // Note: There is still room for optimization here, e.g. by sharing the steps that
        // don't depend on the target language.
        const t0 = Date.now();
        const read = await this.readFile(file);
        const t1 = Date.now();
        const parsed = this.parse(read);
        const t2 = Date.now();
        const evaluated = this.evaluate(parsed);
        const t3 = Date.now();
        const processed = this.process(evaluated);
        const t4 = Date.now();
        const pout = this.prepareOutput(processed, target);
        const t5 = Date.now();
        await this.finalizeOutput(pout, outRelativePath);
        const t6 = Date.now();

        // Change to print timing info.
        // eslint-disable-next-line no-constant-condition
        if (false) {
            console.log(`[TIMING (${file.parsed.base}=>${target})] ${t1 - t0} ms - Read *`);
            console.log(`[TIMING (${file.parsed.base}=>${target})] ${t2 - t1} ms - Parse`);
            console.log(`[TIMING (${file.parsed.base}=>${target})] ${t3 - t2} ms - Evaluate`);
            console.log(`[TIMING (${file.parsed.base}=>${target})] ${t4 - t3} ms - Process`);
            console.log(`[TIMING (${file.parsed.base}=>${target})] ${t5 - t4} ms - Prepare out`);
            console.log(`[TIMING (${file.parsed.base}=>${target})] ${t6 - t5} ms - Finalize out *`);
            console.log(`[TIMING (${file.parsed.base}=>${target})] ${t6 - t0} ms - Cumulative *`);
        }
    }

    private async readFile(path: LaPath): Promise<ReadLapFile> {
        const buffer = await readFileBuffer(path);
        return {
            path,
            buffer,
        };
    }

    private parse(f: ReadLapFile): ParsedLapFile {
        return { path: f.path, root: _parse(f.path, f.buffer) };
    }

    private evaluate(f: ParsedLapFile): EvaluatedLapFile {
        const fctx = FileContext.make(this._ctx);
        const e = evaluatePass(this._ctx, fctx, f.root);
        assert(isLtrfNode(e));
        return { path: f.path, root: e, fctx };
    }

    // TODO: Lang. specific processing needed?
    private process(f: EvaluatedLapFile): ProcessedLapFile {
        const p = processPass(this._ctx, f.fctx, f.root);
        return { path: f.path, root: p, fctx: f.fctx };
    }

    private prepareOutput(f: ProcessedLapFile, targetLanguage: string): PreparedOutputLap {
        const outputDispatcher = DefaultOutputDispatcher.make(this._ctx, targetLanguage);
        const outputRequirementReceiver = OutputRequirementReceiver.make();
        const output = outputPass(
            this._ctx,
            f.fctx,
            targetLanguage,
            outputDispatcher,
            outputRequirementReceiver,
            f.root
        );
        return { inputPath: f.path, output: output, outputRequirements: outputRequirementReceiver };
    }

    private async finalizeOutput(f: PreparedOutputLap, outRelativePath: string): Promise<void> {
        await _finalizeOutput(f.output, this._outputFolder, outRelativePath, f.outputRequirements);
    }
}

interface ReadLapFile {
    path: LaPath;
    buffer: Buffer;
}

interface ParsedLapFile {
    path: LaPath;
    root: AstRootNode;
}

interface EvaluatedLapFile {
    path: LaPath;
    root: LtrfNode;
    fctx: FileContext;
}

interface ProcessedLapFile {
    path: LaPath;
    root: LtrfNode;
    fctx: FileContext;
}

interface PreparedOutputLap {
    inputPath: LaPath;
    output: Output;
    outputRequirements: OutputRequirementReceiver;
}
