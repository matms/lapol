import { Command } from "../command/command";
import { parseIdentifier } from "../identifier";
import { LapolModule, ModuleIdentifier } from "../module/module";
import { Namespace, RootNamespace } from "../namespace";

export class Environment {
    readonly rootNamespace: Namespace;
    readonly loadedModules: ModuleIdentifier[];

    constructor() {
        this.loadedModules = [];
        this.rootNamespace = new RootNamespace();
    }

    loadModule(name: string, module: LapolModule, as?: string): void {
        this.loadedModules.push(module.identifier);
        if (as === undefined) as = module.identifier.name;
        this.rootNamespace.addChildNamespace(as, module.namespace);
    }

    // TODO: Extract parse identifier, rename to lookup in general?
    lookupCommand(commandName: string): Command | undefined {
        return this.rootNamespace.lookupItem(parseIdentifier(commandName));
    }
}
