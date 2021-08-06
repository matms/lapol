import { FileModuleStorage } from "../module/module";
import { LapolContext } from "./lapolContext";

/** @internal Do not use directly. */
export class FileContext {
    public readonly moduleStorage: Map<string, FileModuleStorage>;

    public static make(lctx: LapolContext): FileContext {
        const moduleStorage = new Map();

        for (const [k, v] of lctx.registry.modules._storage) {
            moduleStorage.set(k, v.instantiate());
        }

        return new FileContext(moduleStorage);
    }

    /** @internal Do not use directly. Gets built by compile. Lctx must be completely set up,
     * at least in terms of modules (all modules must be present and initialized).
     */
    constructor(s: Map<string, FileModuleStorage>) {
        this.moduleStorage = s;
    }
}
