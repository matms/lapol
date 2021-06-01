import { strict as assert } from "assert";
import { Command } from "./command/command";
import { LapolError } from "./errors";
import { Identifier } from "./identifier";

const SUPER_IDENTIFIER = "super";

type Item = Command;

export class Namespace {
    name: string;
    readonly isRoot: boolean = false;
    parent: Namespace | undefined;
    children: Map<string, Namespace | Item>;

    public constructor(name: string) {
        this.name = name;
        this.children = new Map();
    }

    setParent(parent: Namespace): void {
        this.parent = parent;
    }

    public addChildNamespace(as: string, child: Namespace): void {
        assert(!this.children.has(as));
        assert(as !== SUPER_IDENTIFIER);
        assert(child.parent === undefined);
        child.setParent(this);
        this.children.set(as, child);
    }

    public addChildItem(as: string, child: Item): void {
        assert(!this.children.has(as));
        assert(as !== SUPER_IDENTIFIER);
        this.children.set(as, child);
    }

    public addUsing(as: string, child: Namespace | Item): void {
        assert(!this.children.has(as));
        assert(as !== SUPER_IDENTIFIER);
        assert(!(child instanceof Namespace) || child.parent !== undefined);
        this.children.set(as, child);
    }

    public lookup(identifier: Identifier): Item | Namespace | undefined {
        if (this.isRoot || !identifier.absolute) {
            if (identifier.path.length === 0) {
                const thing = this.children.get(identifier.name);
                return thing;
            } else {
                const sub = identifier.path[0];
                let loc;

                if (sub === SUPER_IDENTIFIER) {
                    loc = this.parent;
                } else {
                    loc = this.children.get(sub);
                }

                if (!(loc instanceof Namespace))
                    throw new LapolError(
                        `Tried to lookup namespace with name ${sub} in namespace ${this.name}, found child Item`
                    );
                if (loc === undefined) return undefined;
                const subIdentifier = {
                    absolute: identifier.absolute,
                    path: identifier.path.slice(1),
                    name: identifier.name,
                };
                return loc.lookupItem(subIdentifier);
            }
        } else throw new LapolError("Absolute identifiers must be looked up in root Namespace.");
    }

    public lookupItem(identifier: Identifier): Item | undefined {
        const item = this.lookup(identifier);
        if (item instanceof Namespace)
            throw new LapolError(
                `Tried to lookup item (with name ${identifier.name}) in namespace ${this.name}, found Namespace.`
            );
        return item;
    }
}

export class RootNamespace extends Namespace {
    readonly isRoot: boolean = true;
    constructor() {
        super("__root__");
    }
}
