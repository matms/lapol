import { Command } from "../command/command";
import { LapolModule } from "../module/module";

export class Environment {
    private _loadedModules: Map<string, LapolModule>;
    private _variables: Map<string, any>;
    private _outerEnv: Environment | undefined;
    constructor(outerEnv?: Environment | undefined) {
        this._outerEnv = outerEnv;
        this._variables = new Map();
        this._loadedModules = new Map();
    }

    loadModule(name: string, module: LapolModule) {
        this._loadedModules.set(name, module);
    }

    lookupCommand(commandName: string): any {
        if (this._variables.has(commandName)) {
            return this._variables.get(commandName);
        } else {
            let c: Command | undefined = undefined;
            // TODO: Namespaces!
            for (let [modName, mod] of this._loadedModules) {
                let cc = mod.lookupCommand(commandName);
                if (cc !== undefined) c = cc;
            }
            if (c === undefined && this._outerEnv !== undefined) {
                return this._outerEnv.lookupCommand(commandName);
            } else {
                return c;
            }
        }
    }
}
