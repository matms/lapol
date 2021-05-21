// TODO: Will we allow mutation of Str, Expr and Data?

/** DET = Document Expression Tree
 *
 *
 * ## Plan
 *
 * Should these be classes with inheritance?
 *
 * DetNode = Str | Expr | Data
 *
 * Str <= "DetTextStr"
 *     - kind = Str
 *     - text = string
 * Expr <= "DetTag + DetRoot + etc."
 *     - kind = Expr
 *     - tag = string
 *     - attrs = Map() (or Object?)
 *     - contents = Node[]
 * Data <= Miscellaneous Javascript types (we use Data to distinguish objects from the other types).
 *     - kind = Data
 *     - data = any
 *     * Cannot be compiled into final document directly, gives error.
 *     * Can be used by processing commands.
 *
 *
 * ## Unsure
 *
 * Maybe?
 *
 * All will be immutable (HOW TO ENFORCE THIS IN JS? CAN I?)
 *
 * All will be serializeable (to the extent possible)
 *
 */

/**
 *
 * Warning: DO NOT INHERIT FROM THIS CLASS (If you are an user).
 *
 * Note: These nodes are considered _de facto_ immutable, but they are not frozen. Use internal
 * methods to "safely mutate" (i.e. return a new copy).
 *
 * IMPORTANT: Before using any public function prefixed with unsafe, read its documentation
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

    public get text(): string {
        return this._text;
    }
}

export class Expr extends DetNode {
    readonly kind = "Expr";

    private _tag: string;
    private _attrs: Map<string, any>; // TODO: Do we want to allow numbers?
    private _contents: DetNode[];

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

    public contentsMap(fn: (node: DetNode, index?: number, array?: DetNode[]) => DetNode): Expr {
        return this.contentsReplace(this._contents.map(fn));
    }

    public contentsFilter(fn: (node: DetNode, index?: number, array?: DetNode[]) => boolean): Expr {
        return this.contentsReplace(this._contents.filter(fn));
    }
}

export class Data extends DetNode {
    readonly kind = "Data";

    private _data: any;
    private _dataKind: string;

    constructor(data: any, dataKind: string = "NOT_PROVIDED") {
        super();
        this._data = data;
        this._dataKind = dataKind;
    }

    public get dataKind(): string {
        return this._dataKind;
    }

    /** The user MUST NOT mutate the returned data */
    public unsafe_borrow_data(): any {
        return this._data;
    }
}
