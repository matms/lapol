import { strict as assert } from "assert";
import { LapolModuleError } from "../errors";
import { LapolModule, LA_MOD_LOADER_FN_NAME, resolveModule } from "./module";
import path from "path";
import { ModuleIdentifier } from "./metadata";
import { ModuleLoader } from "./loader";

/** Singleton Module Manager -> Loads modules */
export class ModuleManager {
    private _currentlyLoadingModules: Map<string, Promise<LapolModule>>;
    private _loadedMods: Map<string, LapolModule>;
    private constructor() {
        this._currentlyLoadingModules = new Map();
        this._loadedMods = new Map();
    }

    private findModulePath(moduleIdentifier: ModuleIdentifier): string {
        if (moduleIdentifier.isStd) {
            return this.findStdModulePath(moduleIdentifier.modName);
        } else return moduleIdentifier.pathStr;
    }

    private findStdModulePath(modName: string): string {
        const o = path.normalize(path.join(__dirname, "/../../std/", modName));
        return o;
    }

    /** INTERNAL USE ONLY
     *
     * Only to be called once, ModuleManager is a Singleton.
     */
    public static _create(): ModuleManager {
        return new ModuleManager();
    }

    private async fromImportedJsFile(
        loadedJsMod: Record<string | number | symbol, unknown>,
        identifier: ModuleIdentifier
    ): Promise<LapolModule> {
        if (
            !Object.prototype.hasOwnProperty.call(loadedJsMod, LA_MOD_LOADER_FN_NAME) ||
            typeof loadedJsMod[LA_MOD_LOADER_FN_NAME] !== "function"
        ) {
            throw new LapolModuleError(`No ${LA_MOD_LOADER_FN_NAME} function in module`);
        }

        // Here we take a leap of faith and assume the user provided a function with the correct
        // arity. If they did not, and error should occur at runtime.
        const moduleLoadFunction = loadedJsMod[LA_MOD_LOADER_FN_NAME] as (
            _: ModuleLoader
        ) => unknown;

        const moduleLoader = ModuleLoader._make(identifier);

        // The user might have provided a promise, or maybe not.
        // Either way, await to be safe (awaiting non promises just resolves immediately)
        // eslint-disable-next-line @typescript-eslint/await-thenable
        await moduleLoadFunction(moduleLoader);

        moduleLoader._afterSelfLoad();

        const rMods = new Map();

        for await (const requiredMod of moduleLoader.requiredModules) {
            rMods.set(requiredMod.fullIdStr, await this.requireModule(requiredMod));
        }

        moduleLoader._afterRequiredLoad(rMods);

        return moduleLoader._finalize();
    }

    /** INTERNAL USE ONLY. Make sure you don't wanna use requireModule instead. */
    public async _loadModule(modId: ModuleIdentifier): Promise<LapolModule> {
        // Check: we aren't trying to load a module that is being loaded
        assert(!this._currentlyLoadingModules.has(modId.fullIdStr));

        const modPath = this.findModulePath(modId);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const importedJsFile = await import(modPath);
        const mod = await this.fromImportedJsFile(importedJsFile, modId);

        // Check: we aren't trying to load a module that has already been loaded.
        assert(this._loadedMods.get(modId.fullIdStr) === undefined);

        this._loadedMods.set(modId.fullIdStr, mod);
        this._currentlyLoadingModules.delete(modId.fullIdStr);
        return mod;
    }

    /** Note: identStr must be trimmed, of the form std#<name>, where <name> is the
     * desired module name. Custom user defined modules will be supported, but aren't yet.
     */
    public async requireModule(modId: ModuleIdentifier): Promise<LapolModule> {
        const m = this._loadedMods.get(modId.fullIdStr);
        if (m !== undefined) {
            ModuleManager.log(`requireModule: using cached module ${modId.fullIdStr}.`);
            return m;
        } else {
            if (this._currentlyLoadingModules.has(modId.fullIdStr)) {
                ModuleManager.log(`requireModule: awaiting module ${modId.fullIdStr}...`);
                return await (this._currentlyLoadingModules.get(
                    modId.fullIdStr
                ) as Promise<LapolModule>);
            } else {
                ModuleManager.log(`requireModule: loading module ${modId.fullIdStr}...`);
                const promise = this._loadModule(modId);
                this._currentlyLoadingModules.set(modId.fullIdStr, promise);
                return await promise;
            }
        }
    }

    /** Return the module identified by `identStr` if it has already been loaded/required
     * before. If it hasn't, then this will throw an error.
     */
    public getLoadedModule(identStr: string): LapolModule {
        const modId = resolveModule(identStr);
        const m = this._loadedMods.get(modId.fullIdStr);
        if (m !== undefined) {
            return m;
        } else {
            throw new LapolModuleError(`Module ${identStr} hasn't been loaded yet!`);
        }
    }

    private static log(str: string): void {
        console.log("[ModuleManager] " + str);
    }
}
