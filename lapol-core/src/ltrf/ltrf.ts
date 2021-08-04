/** Lapol Text Representation Format */

export type LtrfStr = string;
export type LtrfObj = LtrfNode | LtrfStr;

/** LTRF Node.
 *
 * Direct Mutation is (in general) prohibited. If the user mutates this, buggy behavior may arise.
 */
export interface LtrfNode {
    readonly _tag: string;
    readonly _kv: Readonly<Record<string, LtrfObj>>;
    readonly _sub: readonly LtrfObj[];
}

/** Identity funcion. Provided for user convenience, it is useful when using "lift". */
export function id<T>(o: T): T {
    return o;
}

export function makeLtrfStr(l: string): LtrfStr {
    return l;
}

export function makeLtrfNode(
    tag: string,
    kv: Readonly<Record<string, LtrfObj>>,
    sub: readonly LtrfObj[]
): LtrfNode {
    return {
        _tag: tag,
        _kv: kv,
        _sub: sub,
    };
}

export function isLtrfStr(l: LtrfObj): l is LtrfStr {
    return typeof l === "string";
}

export function isLtrfNode(l: LtrfObj): l is LtrfNode {
    if (typeof l === "string") return false;
    return true;
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

export function str(s: LtrfStr): string {
    return s;
}

export function strOrErr(s: LtrfObj): string {
    if (!isLtrfStr(s)) throw new LtrfError("strOrErr: value is not LtrfStr.");
    return s;
}

export function tag(n: LtrfNode): string {
    return n._tag;
}

export function kv(n: LtrfNode): Readonly<Record<string, LtrfObj>> {
    return n._kv;
}

export function sub(n: LtrfNode): readonly LtrfObj[] {
    return n._sub;
}

export function updateTag(n: LtrfNode, newTag: string): LtrfNode {
    return {
        _tag: newTag,
        _kv: n._kv,
        _sub: n._sub,
    };
}

export function mapTag(n: LtrfNode, f: (old: string) => string): LtrfNode {
    return {
        _tag: f(n._tag),
        _kv: n._kv,
        _sub: n._sub,
    };
}

export function updateKv(n: LtrfNode, newKv: Readonly<Record<string, LtrfObj>>): LtrfNode {
    return {
        _tag: n._tag,
        _kv: newKv,
        _sub: n._sub,
    };
}

export function mapKv(
    n: LtrfNode,
    f: (old: Readonly<Record<string, LtrfObj>>) => Readonly<Record<string, LtrfObj>>
): LtrfNode {
    return {
        _tag: n._tag,
        _kv: f(n._kv),
        _sub: n._sub,
    };
}

export function updateSub(n: LtrfNode, newSub: readonly LtrfObj[]): LtrfNode {
    return {
        _tag: n._tag,
        _kv: n._kv,
        _sub: newSub,
    };
}

export function mapSub(n: LtrfNode, f: (old: readonly LtrfObj[]) => readonly LtrfObj[]): LtrfNode {
    return {
        _tag: n._tag,
        _kv: n._kv,
        _sub: f(n._sub),
    };
}

export class LtrfError extends Error {
    constructor(m: string) {
        super(m);
        Object.setPrototypeOf(this, LtrfError.prototype);
    }
}
