import { LaPath } from "./la_path";
import { render as runRender } from "./compile";

export class LapolContextBuilder {
    constructor() {}

    public async build(): Promise<LapolContext> {
        // TODO: Pass necessary arguments.
        return LapolContext._make();
    }
}

export class LapolContext {
    private constructor() {}

    /** @internal Do not use directly. Instead, use `LapolContextBuilder`. */
    public static _make(): LapolContext {
        return new LapolContext();
    }

    /** Renders a file. TODO. */
    public async render(file: LaPath, target: string): Promise<void> {
        await runRender(file, target);
    }
}
