import { strict as assert } from "assert";
import path from "path";
import { Command, JsFnCommand } from "../command/command";
import { LapolModuleError } from "../errors";

const LA_MOD_EXPORT_COMMAND_NAME = "commands";
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

        if (!loadedMod.hasOwnProperty(LA_MOD_EXPORT_COMMAND_NAME)) {
            throw new LapolModuleError(`No ${LA_MOD_EXPORT_COMMAND_NAME} propriety in module`);
        }

        for (let prop of Object.getOwnPropertyNames(loadedMod[LA_MOD_EXPORT_COMMAND_NAME])) {
            let val = loadedMod[LA_MOD_EXPORT_COMMAND_NAME][prop];
            if (typeof val === "function") {
                map.set(prop, JsFnCommand.fromJsFunction(val, prop));
            } else if (Array.isArray(val)) {
                assert(val.length === 2);
                map.set(prop, JsFnCommand.fromJsFunction(val[0], prop, val[1]));
            } else if (val instanceof Command) {
                map.set(prop, val);
            }
        }

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
