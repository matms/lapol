/** DET = Document Expression Tree
 *
 */

// TODO: Change the way DET works, maybe use objects with certain methods and private attributes?

// Plan:
/* 

Should these be classes with inheritance?

DetNode = Str | Expr | Data

Str <= "DetTextStr"
    - kind = Str
    - text = string
Expr <= "DetTag + DetRoot + etc."
    - kind = Expr
    - tag = string
    - attrs = Map() (or Object?)
    - contents = Node[]
Data <= Miscellaneous Javascript types (we use Data to distinguish objects from the other types).
    - kind = Data
    - data = any
    * Cannot be compiled into final document directly, gives error.
    * Can be used by processing commands.

All will be immutable (HOW TO ENFORCE THIS IN JS? CAN I?)

All will be serializeable (to the extent possible)

*/

// Note: https://stackoverflow.com/questions/56067863/discriminating-a-union-of-classes

/**
 *
 * Warning: DO NOT INHERIT FROM THIS CLASS (If you are an user).
 *
 * Note: These nodes are considered _de facto_ immutable, but they are not frozen. Use internal
 * methods to "safely mutate" (i.e. return a new copy).
 *
 * IMPORTANT: Before using any public function prefixed with unsafe, read their documentation
 * very carefully.
 */
export abstract class DetNode {
    abstract readonly kind: "Str" | "Expr" | "Data";

    // TODO: Consider storing metadata / debug information.
}

export class Str extends DetNode {
    readonly kind = "Str";

    private _text: string;

    constructor(text: string) {
        super();
        this._text = text;
    }

    public get text() {
        return this._text;
    }
}

export class Expr extends DetNode {
    readonly kind = "Expr";

    private _tag: string;
    private _attrs: Map<string, any>; // TODO: Do we want to allow numbers?
    private _contents: DetNode[];

    /**a */
    constructor(tag: string, contents?: DetNode[], attrs?: Map<string, any>) {
        super();
        this._tag = tag;

        if (contents === undefined) this._contents = [];
        else this._contents = contents;

        if (attrs === undefined) this._attrs = new Map();
        else this._attrs = attrs;
    }

    public get tag(): string {
        return this._tag;
    }

    /** The user MUST NOT mutate the returned map under any circumstances. */
    public unsafeBorrowAttrs(): Map<string, any> {
        return this._attrs;
    }

    /** The user MUST NOT mutate the returned array under any circumstances. */
    public unsafeBorrowContents(): DetNode[] {
        return this._contents;
    }

    public contentsLength() {
        return this._contents.length;
    }

    public contentsIter() {
        return this._contents.values();
    }

    public contentsReplace(newContents: DetNode[]): Expr {
        return new Expr(this._tag, newContents, this._attrs);
    }

    public contentsMap(fn: (n: DetNode) => DetNode): Expr {
        return this.contentsReplace(this._contents.map(fn));
    }
}

export class Data extends DetNode {
    readonly kind = "Data";

    private _data: any;

    constructor(data: any) {
        super();
        this._data = data;
    }

    /** The user MUST NOT mutate the returned array under any circumstances. */
    public unsafe_borrow_data(): DetNode[] {
        return this._data;
    }
}
