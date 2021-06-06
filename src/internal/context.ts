import { LapolModule } from "./module/module";

/** @internal If you are a LaPoL user (i.e., you aren't writing core LaPoL code), do NOT use this.
 *
 * Instead, use LapolContext
 */
export class InternalLapolContext {
    readonly modules: Map<string, LapolModule>;

    /** @internal Do not use directly. Instead, use `LapolContextBuilder`. */
    public constructor(modules: Map<string, LapolModule>) {
        this.modules = modules;
    }
}
