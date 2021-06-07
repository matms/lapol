import { LapolModule } from "./module/module";
import { OutputTarget } from "./output/output";

/** @internal If you are a LaPoL user (i.e., you aren't writing core LaPoL code), do NOT use this.
 *
 * Instead, use LapolContext
 */
export class InternalLapolContext {
    readonly modules: Map<string, LapolModule>;

    // TODO: Pass this to outputter and use it.
    readonly targets: Map<string, OutputTarget>;

    /** @internal Do not use directly. Instead, use `LapolContextBuilder`. */
    public constructor(modules: Map<string, LapolModule>, targets: Map<string, OutputTarget>) {
        this.modules = modules;
        this.targets = targets;
    }
}
