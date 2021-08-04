import {
    FileModuleStorage,
    LapolModule,
    loadModule,
    ModuleDeclaration,
    ModuleIdentifier,
} from "./module";
import { strict as assert } from "assert";
import { Command, JsFnCommand } from "../command/command";
import { CommandArguments } from "../command/argument";
import { DetNode, Expr } from "../det";
import { LapolError } from "../errors";
import { ExprMeta, ExprMetaCfgDeclaration } from "../expr_meta";
import { LapolRegistry } from "../registry/registry";
import { NodeOutputter } from "../output/nodeOutputter";
import { CommandContext } from "../command/context";

export class ModuleLoader {
    /* eslint-disable  @typescript-eslint/prefer-readonly */

    private _registry: LapolRegistry;

    private _commands: Map<string, Command>;
    private _identifier: ModuleIdentifier;
    private _loadedSubModules: string[];

    private _finalizeActions: Array<() => Promise<void>>;

    private _instantiator: (() => FileModuleStorage) | undefined;

    /* eslint-enable  @typescript-eslint/prefer-readonly */

    private constructor(identifier: ModuleIdentifier, registry: LapolRegistry) {
        this._identifier = identifier;
        this._loadedSubModules = [];
        this._finalizeActions = [];
        this._commands = new Map();
        this._registry = registry;
    }

    /** Internal use --- Module developer MUST NOT CALL!
     *
     * Called to make a new ModuleLoader
     */
    public static _make(identifier: ModuleIdentifier, registry: LapolRegistry): ModuleLoader {
        return new ModuleLoader(identifier, registry);
    }

    /** Internal use --- Module developer MUST NOT CALL!
     *
     * This is called last, after the requiredModules have been loaded. Anything that
     * requires the modules to be loaded should be done here.
     *
     * This returns a list of modules that have been loaded as strings,
     * and adds these modules to the LapolRegistry.
     * Namely, these are the module itself and any submodules requested with `declareSubModule`
     *
     */
    public async _finalize(): Promise<string[]> {
        for (const f of this._finalizeActions) {
            await f();
        }

        // ModuleLoader.log(`_finalize: Finished loading ${this._identifier.name}`);

        if (this._instantiator === undefined) {
            throw new LapolError("Instantiator required.");
        }

        const mod = new LapolModule(
            this._commands,
            this._identifier,
            this._loadedSubModules,
            this._instantiator
        );

        this._registry.modules.declare(mod.identifier.name, mod);

        const out = [mod.identifier.name].concat(...this._loadedSubModules);

        return out;
    }

    /** Returns whether a given target has been requested
     * (see `LapolCompilerBuilder.withTargets()`).
     */
    public hasTarget(targetName: string): boolean {
        return this._registry.targetNames.has(targetName);
    }

    // TODO: what should the type of 'options?' be?
    public exportCommand(
        name: string,
        command: (a: CommandArguments, ctx: CommandContext) => DetNode | undefined,
        options?: Record<string, boolean>
    ): void;
    public exportCommand(name: string, command: Command): void;

    public exportCommand(
        name: string,
        command: Command | ((a: CommandArguments, ctx: CommandContext) => DetNode | undefined),
        options?: Record<string, boolean>
    ): void {
        if (typeof command === "function")
            this._commands.set(name, JsFnCommand.fromJsFunction(command, name, options));
        else if (command instanceof Command) this._commands.set(name, command);
    }

    /** @deprecated Use exportCommand().
     *
     * Export one or more commands.
     *
     * `commands` should be an object "mapping" a command name to a command definition.
     *
     * There are three ways to define a command. You can use a javascript function, an array
     * comprised of a javascript function followed by an object with configurations, or using a
     * Command object directly. The first two are recommended for LAPOL Module development,
     * the last one is mostly for internal use (module developers should refrain from using it).
     *
     * Note this doesn't load the command immediately, it simply enqueues the command for loading.
     */
    public exportCommands(commands: Record<string, unknown>): void {
        this._finalizeActions.push(async () => {
            assert(typeof commands === "object");

            for (const prop of Object.getOwnPropertyNames(commands)) {
                const val = commands[prop];
                if (typeof val === "function") {
                    this._commands.set(
                        prop,
                        JsFnCommand.fromJsFunction(
                            // We assume the user has passed a function with the right shape.
                            // We cannot verify this easily, however.
                            val as (a: CommandArguments) => DetNode | undefined,
                            prop
                        )
                    );
                } else if (Array.isArray(val)) {
                    assert(val.length === 2);
                    this._commands.set(prop, JsFnCommand.fromJsFunction(val[0], prop, val[1]));
                } else if (val instanceof Command) {
                    this._commands.set(prop, val);
                }
            }
        });
    }

    /** Export all commands from a different module. Note that module must be required, see
     * declareRequire().
     */
    public exportAllCommandsFrom(otherModule: string): void {
        throw new Error("Not implemented.");
        /*
        this._finalizeActions.push(() => {
            assert(this._requiredModulesLoaded !== undefined);
            const mod = this._requiredModulesLoaded.get(resolveModule(otherModule).fullIdStr);
            assert(mod !== undefined);
            for (const [k, cmd] of mod.borrowCommands()) {
                this._commands.set(k, cmd);
            }
        });
        */
    }

    public exportExprOutputter(
        target_: string,
        tag: string,
        outputter: NodeOutputter<Expr, string>
    ): void {
        const meta = this._registry.exprMetas.get(tag);
        if (meta === undefined) throw new LapolError(`Expr meta for ${tag} doesn't exist.`);

        meta.declareOutputter(target_, outputter);
    }

    public declareTarget(target: string): void {
        ModuleLoader.log(`WARNING Declared ${target}, but this does nothing (for now).`);
    }

    public declareExprMeta(exprTag: string, decl: ExprMetaCfgDeclaration): void {
        this._registry.exprMetas.declare(exprTag, new ExprMeta(decl));
    }

    /** Declare that a module is required for this module to function. Note that this does not load
     * the module immediately (i.e. we do not await for the module to load)
     */
    public declareSubModule(name: string, mod: ModuleDeclaration): void {
        this._finalizeActions.push(async () => {
            await loadModule(name, mod, this._registry);
            this._loadedSubModules.push(name);
        });
    }

    public requireName(name: string): void {
        if (name !== this._identifier.name)
            throw new LapolError(
                `Module name mismatch. Is ${this._identifier.name}, but required ${name}`
            );
    }

    public declareInstantiator(instantiator: () => FileModuleStorage): void {
        if (this._instantiator !== undefined)
            throw new LapolError("Instantiator redefinition not allowed.");
        this._instantiator = instantiator;
    }

    private static log(str: string): void {
        console.log("[ModuleLoader] " + str);
    }
}
