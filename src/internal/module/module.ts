import { Command } from "../command/command";
import { LapolError } from "../errors";
import { Namespace } from "../namespace";
import { ModuleIdentifier, ModuleMetadata } from "./metadata";

export const LA_MOD_LOADER_FN_NAME = "load";
export class LapolModule {
    readonly namespace: Namespace;
    private _commands: Map<string, Command>;
    private _metadata: ModuleMetadata;

    constructor(commands: Map<string, Command>, metadata: ModuleMetadata) {
        this._commands = commands;
        this._metadata = metadata;
        // TODO: What name to use here?
        // TODO: Need to introduce the concept of parent modules?
        this.namespace = new Namespace(metadata.identifier.modName);
        for (const [n, c] of this._commands) {
            this.namespace.addChildItem(n, c);
        }
    }

    /**
     * @deprecated Use namespaces
     */
    public lookupCommand(commandName: string): Command | undefined {
        return this._commands.get(commandName);
    }

    /**
     * @deprecated Use namespaces
     *
     * WARNING: DO NOT MUTATE THE RETURNED MAP UNDER ANY CIRCUMSTANCES */
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
        pathStr: path,
        fullIdStr: "<module-id>[" + identStr + "]",
    };
}

export function resolveModule(identStr: string): ModuleIdentifier {
    // TODO: If I'm not gonna use :, what should I use?
    const a = identStr.split("/");
    if (a.length === 2) {
        if (a[0] === "std") {
            return { isStd: true, modName: a[1], fullIdStr: "<module-id>[" + identStr + "]" };
        } else throw new LapolError("NOT YET IMPLEMENTED feature - resolveModule");
    } else throw new LapolError("NOT YET IMPLEMENTED feature - resolveModule");
}
