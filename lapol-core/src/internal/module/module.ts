import { Command } from "../command/command";
import { Namespace } from "../namespace";
import { LapolRegistry } from "../registry/registry";
import { ModuleLoader } from "./loader";

// TODO: Multiple names + "as"?
export interface ModuleIdentifier {
    name: string;
}

export interface ModuleDeclaration {
    loaderFn: ((loader: ModuleLoader) => void) | ((loader: ModuleLoader) => Promise<void>);
}

/** Per file module storage. Used so that a module can store mutable state. Extend this interface!
 */
export interface FileModuleStorage {
    moduleName: string;
}

export const LA_MOD_LOADER_FN_NAME = "load";
export class LapolModule {
    readonly namespace: Namespace;
    readonly identifier: ModuleIdentifier;
    readonly loadedSubModules: string[];

    readonly instantiate: () => FileModuleStorage;

    constructor(
        commands: Map<string, Command>,
        identifier: ModuleIdentifier,
        loadedSubModules: string[],
        instantiate: () => FileModuleStorage
    ) {
        this.identifier = identifier;
        this.loadedSubModules = loadedSubModules;

        // TODO: What name to use here?
        // TODO: Need to introduce the concept of parent modules?
        this.namespace = new Namespace(this.identifier.name);
        for (const [n, c] of commands) {
            this.namespace.addChildItem(n, c);
        }

        this.instantiate = instantiate;
    }
}

/** Returns a list comprised of the module that has been loaded and any submodules */
export async function loadModule(
    name: string,
    mod: ModuleDeclaration,
    registry: LapolRegistry
): Promise<string[]> {
    const load = mod.loaderFn;
    const moduleLoader = ModuleLoader._make({ name: name }, registry);

    await load(moduleLoader);

    return await moduleLoader._finalize();
}
