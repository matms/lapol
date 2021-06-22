import { LapolError } from "../errors";
import { ExprMeta } from "../expr_meta";
import { LapolModule } from "../module/module";

// TODO: Can I use this for outputters? How to handle different targets?
// Target first or expr first??? Or can I think outside the box here?

export class LapolRegistry {
    public readonly exprMetas: Drawer<ExprMeta>;
    public readonly modules: Drawer<LapolModule>;

    constructor() {
        this.exprMetas = new Drawer();
        this.modules = new Drawer();
    }
}

type NonUndefined<T> = T extends undefined ? never : T;

class Drawer<T> {
    readonly _storage: Map<string, NonUndefined<T>>;

    constructor() {
        this._storage = new Map();
    }

    public has(name: string): boolean {
        return this._storage.has(name);
    }

    public get(name: string): T | undefined {
        return this._storage.get(name);
    }

    public getOrErr(name: string): T {
        const val = this._storage.get(name);
        if (val === undefined) throw new LapolError(`Entry for ${name} missing in Drawer.`);
        return val;
    }

    // TODO: Should we use some kind of `priority` parameter?
    public declare(name: string, content: NonUndefined<T>): void {
        if (this._storage.has(name))
            throw new LapolError(
                `Attempting to declare ${name} in drawer, but there is already another entry with the same name.`
            );
        this._storage.set(name, content);
    }
}
