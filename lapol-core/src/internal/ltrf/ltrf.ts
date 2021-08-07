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
    private readonly _kv: Readonly<Record<string, unknown>>;
    private readonly _elems: readonly LtrfObj[];

    private constructor(
        tag: string,
        kv: Readonly<Record<string, unknown>>,
        elems: readonly LtrfObj[]
    ) {
        this._tag = tag;
        this._kv = kv;
        this._elems = elems;
    }

    static make(
        tag: string,
        kv: Readonly<Record<string, unknown>>,
        cont: readonly LtrfObj[]
    ): LtrfNode {
        return new LtrfNode(tag, kv, cont);
    }

    get tag(): string {
        return this._tag;
    }

    get kv(): Readonly<Record<string, unknown>> {
        return this._kv;
    }

    get elems(): readonly LtrfObj[] {
        return this._elems;
    }

    withTag(newTag: string): LtrfNode {
        return LtrfNode.make(newTag, this._kv, this._elems);
    }

    updateTag(f: (old: string) => string): LtrfNode {
        return LtrfNode.make(f(this._tag), this._kv, this._elems);
    }

    withKv(newKv: Readonly<Record<string, unknown>>): LtrfNode {
        return LtrfNode.make(this._tag, newKv, this._elems);
    }

    updateKv(
        f: (old: Readonly<Record<string, unknown>>) => Readonly<Record<string, unknown>>
    ): LtrfNode {
        return LtrfNode.make(this._tag, f(this._kv), this._elems);
    }

    withElems(newElems: readonly LtrfObj[]): LtrfNode {
        return LtrfNode.make(this._tag, this._kv, newElems);
    }

    updateElems(f: (old: readonly LtrfObj[]) => readonly LtrfObj[]): LtrfNode {
        return LtrfNode.make(this._tag, this._kv, f(this._elems));
    }

    mapElems(f: (el: LtrfObj, index: number, array: readonly LtrfObj[]) => LtrfObj): LtrfNode {
        return this.updateElems((elems) => elems.map(f));
    }

    flatMapElems(
        f: (el: LtrfObj, index: number, array: readonly LtrfObj[]) => readonly LtrfObj[]
    ): LtrfNode {
        return this.updateElems((elems) => elems.flatMap(f));
    }

    update(
        ft: (old: string) => string,
        fk: (old: Readonly<Record<string, unknown>>) => Readonly<Record<string, unknown>>,
        fs: (old: readonly LtrfObj[]) => readonly LtrfObj[]
    ): LtrfNode {
        return LtrfNode.make(ft(this._tag), fk(this._kv), fs(this._elems));
    }

    dbgStringify(): string {
        return JSON.stringify(this, null, "  ");
    }
}

/** Identity funcion. Provided for user convenience, it is useful when using "lift". */
export function id<T>(o: T): T {
    return o;
}

export function isLtrfObj(l: unknown): l is LtrfObj {
    return typeof l === "string" || l instanceof LtrfNode;
}

export function isLtrfStr(l: LtrfObj): l is LtrfStr {
    return typeof l === "string";
}

export function isLtrfNode(l: LtrfObj): l is LtrfNode {
    return l instanceof LtrfNode;
}

/** Takes in two functions, one taking in an LtrfString and returning an LtrfObj,
 * another taking in an LtrfNode and returning an LtrfObj.
 *
 * Returns a function taking in an LtrfObj and dispatching to the correct function.
 */
export function ltrfObjLift(
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
