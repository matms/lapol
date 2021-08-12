import { Command } from "../command/command";
import { Namespace } from "../namespace";
import { LtrfNodeOutputter } from "../out/common";
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

    private readonly _nodeOutputtersByTargetAndTag: Map<string, Map<string, LtrfNodeOutputter>>;

    constructor(
        commands: Map<string, Command>,
        identifier: ModuleIdentifier,
        loadedSubModules: string[],
        instantiate: () => FileModuleStorage,
        nodeOutputtersByTagAndTarget: Map<string, Map<string, LtrfNodeOutputter>>
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
        this._nodeOutputtersByTargetAndTag = nodeOutputtersByTagAndTarget;
    }

    public getLtrfNodeOutputter(
        targetLanguage: string,
        tag: string
    ): LtrfNodeOutputter | undefined {
        const a = this._nodeOutputtersByTargetAndTag.get(targetLanguage);
        if (a === undefined) return undefined;
        const b = a.get(tag);
        return b;
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

    return moduleLoader._finalize();
}
