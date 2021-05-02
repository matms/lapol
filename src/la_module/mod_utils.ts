import { strict as assert } from "assert";
import { Command, CommandKind } from "../command/command";
import { functionToCommand } from "../command/function_to_command";
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

    static async loadModuleFile(modPath: string): Promise<LapolModule> {
        let mod = new LapolModule();
        let map = mod._commands;

        let l_mod = await import(modPath);

        if (!l_mod.hasOwnProperty(LA_MOD_EXPORT_COMMAND_NAME)) {
            throw new LapolModuleError(`No ${LA_MOD_EXPORT_COMMAND_NAME} propriety in module`);
        }

        for (let prop of Object.getOwnPropertyNames(l_mod[LA_MOD_EXPORT_COMMAND_NAME])) {
            let val = l_mod[LA_MOD_EXPORT_COMMAND_NAME][prop];
            if (typeof val === "function") {
                map.set(prop, functionToCommand(val, prop));
            } else if (Array.isArray(val)) {
                assert(val.length === 2);
                map.set(prop, functionToCommand(val[0], prop, val[1]));
            } else if (typeof val === "object" && val.kind === CommandKind.CommandKind) {
                map.set(prop, l_mod.val);
            }
        }

        return mod;
    }
}
