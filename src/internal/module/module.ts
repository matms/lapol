import { Command } from "../command/command";
import { Namespace } from "../namespace";
import { ModuleLoader } from "./loader";

// TODO: Multiple names + "as"?
export interface ModuleIdentifier {
    name: string;
}

export interface ModuleDeclaration {
    loaderFn: ((loader: ModuleLoader) => void) | ((loader: ModuleLoader) => Promise<void>);
}

export const LA_MOD_LOADER_FN_NAME = "load";
export class LapolModule {
    readonly namespace: Namespace;
    readonly identifier: ModuleIdentifier;
    readonly requiredMods: ModuleIdentifier[];

    constructor(
        commands: Map<string, Command>,
        identifier: ModuleIdentifier,
        requiredMods: ModuleIdentifier[]
    ) {
        this.identifier = identifier;
        this.requiredMods = requiredMods;

        // TODO: What name to use here?
        // TODO: Need to introduce the concept of parent modules?
        this.namespace = new Namespace(this.identifier.name);
        for (const [n, c] of commands) {
            this.namespace.addChildItem(n, c);
        }
    }
}

export async function loadModule(name: string, mod: ModuleDeclaration): Promise<LapolModule> {
    const load = mod.loaderFn;
    const moduleLoader = ModuleLoader._make({ name: name });

    await load(moduleLoader);

    moduleLoader._afterSelfLoad();

    if (moduleLoader.requiredModules.length !== 0) {
        throw new Error("Required modules functionality not yet implemented");
    }

    const rMods = new Map();

    moduleLoader._afterRequiredLoad(rMods);

    return moduleLoader._finalize();
}
