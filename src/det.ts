/** DET = Document Expression Tree
 *
 */

export enum DetNodeKind {
    DetTextStrKind = "DetTextStrKind",
    DetTag = "DetTag",
    DetSpecialSpliceIndicator = "DetSpecialSpliceIndicator",
}

export interface DetTextStr {
    kind: DetNodeKind.DetTextStrKind;
    contents: string;
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

// TODO: Allow new DetNode types dynamically?
export type DetNode = DetTextStr | DetTag | DetSpecialSpliceIndicator;
