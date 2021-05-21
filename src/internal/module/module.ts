import { Command } from "../command/command";
import { LapolError } from "../errors";
import { ModuleIdentifier, ModuleMetadata } from "./metadata";

export const LA_MOD_LOADER_FN_NAME = "load";
export class LapolModule {
    private _commands: Map<string, Command>;
    private _metadata: ModuleMetadata;

    constructor(commands: Map<string, Command>, metadata: ModuleMetadata) {
        this._commands = commands;
        this._metadata = metadata;
    }

    public lookupCommand(commandName: string): Command | undefined {
        return this._commands.get(commandName);
    }

    /** WARNING: DO NOT MUTATE THE RETURNED MAP UNDER ANY CIRCUMSTANCES */
    public borrowCommands(): Map<string, Command> {
        return this._commands;
    }

    get metadata(): ModuleMetadata {
        return this._metadata;
    }
}

export function resolveModuleFromPath(path: string, identStr: string): ModuleIdentifier {
    return {
        isStd: false,
        modName: identStr,
        path: path,
        fullIdStr: "<module-id>[" + identStr + "]",
    };
}

export function resolveModule(identStr: string): ModuleIdentifier {
    const a = identStr.split(":");
    if (a.length === 2) {
        if (a[0] === "std") {
            return { isStd: true, modName: a[1], fullIdStr: "<module-id>[" + identStr + "]" };
        } else throw new LapolError("NOT YET IMPLEMENTED feature - resolveModule");
    } else throw new LapolError("NOT YET IMPLEMENTED feature - resolveModule");
}
