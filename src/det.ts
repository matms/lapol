/** DET = Document Expression Tree
 *
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
    contents: DetNode[];
}

/** Special DET Node used to indicate splicing (i.e. the contents should be spread
 * out and become contents of the parent node.) */
export interface DetSpecialSpliceIndicator {
    kind: DetNodeKind.DetSpecialSpliceIndicator;
    contents: DetNode[];
}

export interface DetRoot {
    kind: DetNodeKind.DetRoot;
    contents: DetNode[];
}

// TODO: Allow new DetNode types dynamically?
export type DetNode = DetTextStr | DetTag | DetSpecialSpliceIndicator | DetRoot;
