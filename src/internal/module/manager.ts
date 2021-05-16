import { strict as assert } from "assert";
import { resolve } from "node:path";
import { LapolError, LapolModuleError } from "../errors";
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
        if (moduleIdentifier.isStd === true) {
            return this.findStdModulePath(moduleIdentifier.modName);
        } else return moduleIdentifier.path;
    }

    private findStdModulePath(modName: string): string {
        let o = path.normalize(__dirname + "/../default_lapol_modules/" + modName);
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
        loadedJsMod: any,
        identifier: ModuleIdentifier,
        modManager: ModuleManager
    ): Promise<LapolModule> {
        if (
            !loadedJsMod.hasOwnProperty(LA_MOD_LOADER_FN_NAME) ||
            typeof loadedJsMod[LA_MOD_LOADER_FN_NAME] !== "function"
        ) {
            throw new LapolModuleError(`No ${LA_MOD_LOADER_FN_NAME} function in module`);
        }

        let moduleLoadFunction = loadedJsMod[LA_MOD_LOADER_FN_NAME] as (_: ModuleLoader) => void;

        let moduleLoader = ModuleLoader._make(identifier);

        await moduleLoadFunction(moduleLoader);

        moduleLoader._afterSelfLoad();

        let rMods = new Map();

        for await (let requiredMod of moduleLoader.requiredModules) {
            rMods.set(requiredMod.fullIdStr, await this.requireModule(requiredMod));
        }

        moduleLoader._afterRequiredLoad(rMods);

        return moduleLoader._finalize();
    }

    /** INTERNAL USE ONLY. Make sure you don't wanna use requireModule instead.*/
    public async _loadModule(modId: ModuleIdentifier): Promise<LapolModule> {
        // Check: we aren't trying to load a module that is being loaded
        assert(!this._currentlyLoadingModules.has(modId.fullIdStr));

        let modPath = this.findModulePath(modId);

        let importedJsFile = await import(modPath);
        let mod = await this.fromImportedJsFile(importedJsFile, modId, this);

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
        let m = this._loadedMods.get(modId.fullIdStr);
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
                let promise = this._loadModule(modId);
                this._currentlyLoadingModules.set(modId.fullIdStr, promise);
                return await promise;
            }
        }
    }

    /** Return the module identified by `identStr` if it has already been loaded/required
     * before. If it hasn't, then this will throw an error.
     */
    public getLoadedModule(identStr: string): LapolModule {
        let modId = resolveModule(identStr);
        let m = this._loadedMods.get(modId.fullIdStr);
        if (m !== undefined) {
            return m;
        } else {
            throw new LapolModuleError(`Module ${identStr} hasn't been loaded yet!`);
        }
    }

    private static log(str: string) {
        console.log("[ModuleManager] " + str);
    }
}
