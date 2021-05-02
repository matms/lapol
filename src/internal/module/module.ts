import { strict as assert } from "assert";
import path from "path";
import { Command, JsFnCommand } from "../command/command";
import { LapolModuleError } from "../errors";
import { ModuleLoader } from "./mod_utils";

const LA_MOD_LOADER_FN_NAME = "load";
export class LapolModule {
    private _commands: Map<string, Command>;
    private constructor() {
        this._commands = new Map();
    }

    public lookupCommand(commandName: string): Command | undefined {
        return this._commands.get(commandName);
    }

    private static _loadModule(loadedMod: any): LapolModule {
        let mod = new LapolModule();
        let map = mod._commands;

        if (
            !loadedMod.hasOwnProperty(LA_MOD_LOADER_FN_NAME) ||
            typeof loadedMod[LA_MOD_LOADER_FN_NAME] !== "function"
        ) {
            throw new LapolModuleError(`No ${LA_MOD_LOADER_FN_NAME} function in module`);
        }

        let module_loader = new ModuleLoader(map);

        (loadedMod[LA_MOD_LOADER_FN_NAME] as (_: ModuleLoader) => void)(module_loader);

        return mod;
    }

    static async loadModuleFile(modPath: string): Promise<LapolModule> {
        let loaded_mod_file = await import(modPath);
        return this._loadModule(loaded_mod_file);
    }

    static loadModuleFileSync(modPath: string): LapolModule {
        let loaded_mod_file = require(modPath);
        return this._loadModule(loaded_mod_file);
    }
}

export function findModulePath(moduleIdentifier: string): string {
    // TODO: If default module with name doesn't exist, look for custom modules
    // (or maybe look for custom modules first).

    // TODO: Allow module namespacing.
    return findDefaultModulePath(moduleIdentifier);
}

export function findDefaultModulePath(moduleIdentifier: string): string {
    let o = path.normalize(__dirname + "/../default_lapol_modules/" + moduleIdentifier);
    return o;
}
