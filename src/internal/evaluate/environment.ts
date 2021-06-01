import { Command } from "../command/command";
import { parseIdentifier } from "../identifier";
import { LapolModule } from "../module/module";
import { Namespace, RootNamespace } from "../namespace";

export class Environment {
    // TODO: Is _rootNamespace inside of this a good idea?
    readonly rootNamespace: Namespace;

    private _loadedModules: Map<string, LapolModule>;
    private _variables: Map<string, any>;
    private _outerEnv: Environment | undefined;

    // TODO: Allow outerEnv?
    constructor() {
        this._outerEnv = undefined;
        this._variables = new Map();
        this._loadedModules = new Map();
        this.rootNamespace = new RootNamespace();
    }

    loadModule(name: string, module: LapolModule, as?: string) {
        this._loadedModules.set(name, module);
        if (as === undefined) as = module.metadata.identifier.modName;
        this.rootNamespace.addChildNamespace(as, module.namespace);
    }

    // TODO: Extract parse identifier, rename to lookup in general?
    lookupCommand(commandName: string): Command | undefined {
        return this.rootNamespace.lookupItem(parseIdentifier(commandName));
    }
}
