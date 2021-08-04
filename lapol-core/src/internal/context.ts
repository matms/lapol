import { FileModuleStorage } from "./module/module";
import { LapolRegistry } from "./registry/registry";

/** @internal If you are a LaPoL user (i.e., you aren't writing core LaPoL code), do NOT use this.
 *
 * Instead, use LapolContext
 */
export class InternalLapolContext {
    public readonly registry: LapolRegistry;

    /** @internal Do not use directly. Instead, use `LapolContextBuilder`. */
    public constructor(registry: LapolRegistry) {
        this.registry = registry;
    }
}

/** @internal Do not use directly. */
export class InternalFileContext {
    public readonly moduleStorage: Map<string, FileModuleStorage>;

    public static make(lctx: InternalLapolContext): InternalFileContext {
        const moduleStorage = new Map();

        for (const [k, v] of lctx.registry.modules._storage) {
            moduleStorage.set(k, v.instantiate());
        }

        return new InternalFileContext(moduleStorage);
    }

    /** @internal Do not use directly. Gets built by compile. Lctx must be completely set up,
     * at least in terms of modules (all modules must be present and initialized).
     */
    constructor(s: Map<string, FileModuleStorage>) {
        this.moduleStorage = s;
    }
}
