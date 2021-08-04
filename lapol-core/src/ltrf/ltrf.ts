/** Lapol Text Representation Format */

/** An object in the LTRF Tree. Is immutable. */
export type LtrfObj = LtrfNode | LtrfStr;
export type LtrfStr = string;

/** LTRF Node.
 *
 * Direct Mutation is (in general) prohibited. If the user mutates this, buggy behavior may arise.
 */
export class LtrfNode {
    private readonly _tag: string;
    private readonly _kv: Readonly<Record<string, LtrfObj>>;
    private readonly _sub: readonly LtrfObj[];

    private constructor(
        tag: string,
        kv: Readonly<Record<string, LtrfObj>>,
        sub: readonly LtrfObj[]
    ) {
        this._tag = tag;
        this._kv = kv;
        this._sub = sub;
    }

    static make(
        tag: string,
        kv: Readonly<Record<string, LtrfObj>>,
        sub: readonly LtrfObj[]
    ): LtrfNode {
        return new LtrfNode(tag, kv, sub);
    }

    get tag(): string {
        return this._tag;
    }

    get kv(): Readonly<Record<string, LtrfObj>> {
        return this._kv;
    }

    get sub(): readonly LtrfObj[] {
        return this._sub;
    }

    updateTag(newTag: string): LtrfNode {
        return LtrfNode.make(newTag, this._kv, this._sub);
    }

    mapTag(f: (old: string) => string): LtrfNode {
        return LtrfNode.make(f(this._tag), this._kv, this._sub);
    }

    updateKv(newKv: Readonly<Record<string, LtrfObj>>): LtrfNode {
        return LtrfNode.make(this._tag, newKv, this._sub);
    }

    mapKv(
        f: (old: Readonly<Record<string, LtrfObj>>) => Readonly<Record<string, LtrfObj>>
    ): LtrfNode {
        return LtrfNode.make(this._tag, f(this._kv), this._sub);
    }

    updateSub(newSub: readonly LtrfObj[]): LtrfNode {
        return LtrfNode.make(this._tag, this._kv, newSub);
    }

    mapSub(f: (old: readonly LtrfObj[]) => readonly LtrfObj[]): LtrfNode {
        return LtrfNode.make(this._tag, this._kv, f(this._sub));
    }

    update(
        ft: (old: string) => string,
        fk: (old: Readonly<Record<string, LtrfObj>>) => Readonly<Record<string, LtrfObj>>,
        fs: (old: readonly LtrfObj[]) => readonly LtrfObj[]
    ): LtrfNode {
        return LtrfNode.make(ft(this._tag), fk(this._kv), fs(this._sub));
    }

    dbgStringify(): string {
        return JSON.stringify(this, null, "  ");
    }
}

/** Identity funcion. Provided for user convenience, it is useful when using "lift". */
export function id<T>(o: T): T {
    return o;
}

export function isLtrfStr(l: LtrfObj): l is LtrfStr {
    return typeof l === "string";
}

export function isLtrfNode(l: LtrfObj): l is LtrfNode {
    return l instanceof LtrfNode;
}

export function lift(
    fs: (s: LtrfStr) => LtrfObj,
    fn: (n: LtrfNode) => LtrfObj
): (o: LtrfObj) => LtrfObj {
    return (o) => {
        if (isLtrfStr(o)) return fs(o);
        else return fn(o);
    };
}

export class LtrfError extends Error {
    constructor(m: string) {
        super(m);
        Object.setPrototypeOf(this, LtrfError.prototype);
    }
}
