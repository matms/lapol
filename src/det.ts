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

export enum DetNodeKind {
    DetTextStrKind = "DetTextStr",
    DetTag = "DetTag",
    DetSpecialSpliceIndicator = "DetSpecialSpliceIndicator",
    DetRoot = "DetRoot",
}

export interface DetTextStr {
    kind: DetNodeKind.DetTextStrKind;
    text: string;
}

export interface DetTag {
    kind: DetNodeKind.DetTag;
    tag: string;
    contents: DetNodeType[];
}

/** Special DET Node used to indicate splicing (i.e. the contents should be spread
 * out and become contents of the parent node.) */
export interface DetSpecialSpliceIndicator {
    kind: DetNodeKind.DetSpecialSpliceIndicator;
    contents: DetNodeType[];
}

export interface DetRoot {
    kind: DetNodeKind.DetRoot;
    contents: DetNodeType[];
}

// TODO: Allow new DetNode types dynamically?
export type DetNodeType = DetTextStr | DetTag | DetSpecialSpliceIndicator | DetRoot;
