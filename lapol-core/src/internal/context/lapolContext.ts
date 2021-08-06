import { LapolRegistry } from "../registry/registry";

/** @internal If you are a LaPoL user (i.e., you aren't writing core LaPoL code), do NOT use this.
 *
 * Instead, use LapolContext
 */

export class LapolContext {
    public readonly registry: LapolRegistry;

    /** @internal Do not use directly. Instead, use `LapolContextBuilder`. */
    public constructor(registry: LapolRegistry) {
        this.registry = registry;
    }
}
