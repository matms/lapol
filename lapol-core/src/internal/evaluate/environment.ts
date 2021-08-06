import { Command } from "../command/command";
import { LapolError } from "../errors";
import { parseIdentifier } from "../identifier";
import { LapolModule, ModuleIdentifier } from "../module/module";
import { RootNamespace } from "../namespace";

export class Environment {
    readonly rootNamespace: RootNamespace;
    readonly loadedModules: ModuleIdentifier[];

    constructor() {
        this.loadedModules = [];
        this.rootNamespace = new RootNamespace();
    }

    /** MUTATES this environment to contain the new module. */
    loadModule(module: LapolModule, as?: string): void {
        this.loadedModules.push(module.identifier);
        if (as === undefined) as = module.identifier.name;
        this.rootNamespace.rootAddChildNamespace(as, module.namespace);
    }

    lookupCommand(commandName: string): Command {
        const o = this.rootNamespace.lookupItem(parseIdentifier(commandName));
        if (o === undefined) throw new LapolError(`Command ${commandName} not in Environment.`);
        return o;
    }
}
