import { Command } from "../command/command";
import { Expr } from "../det";
import { ExprMetaDeclaration } from "../expr_meta";
import { Namespace } from "../namespace";
import { NodeOutputter } from "../output/node_outputter";
import { ModuleLoader } from "./loader";

// TODO: Multiple names + "as"?
export interface ModuleIdentifier {
    name: string;
}

export interface ModuleDeclaration {
    loaderFn: ((loader: ModuleLoader) => void) | ((loader: ModuleLoader) => Promise<void>);
}

// Cf. `OutputTarget`
export interface ModuleTarget {
    exprOutputters: Map<string, NodeOutputter<Expr, unknown>>;
}

export const LA_MOD_LOADER_FN_NAME = "load";
export class LapolModule {
    readonly targets: Map<string, ModuleTarget>;
    readonly namespace: Namespace;
    readonly identifier: ModuleIdentifier;
    readonly requiredMods: ModuleIdentifier[];
    readonly exprMetaDeclarations: Map<string, ExprMetaDeclaration>;

    constructor(
        commands: Map<string, Command>,
        targets: Map<string, ModuleTarget>,
        identifier: ModuleIdentifier,
        requiredMods: ModuleIdentifier[],
        exprMetaDeclarations: Map<string, ExprMetaDeclaration>
    ) {
        this.targets = targets;
        this.identifier = identifier;
        this.requiredMods = requiredMods;
        this.exprMetaDeclarations = exprMetaDeclarations;

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

    return moduleLoader._finalize();
}
