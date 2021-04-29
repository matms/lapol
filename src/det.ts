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
    content: string;
}

export interface DetTag {
    kind: DetNodeKind.DetTag;
    tag: string;
    innerContents: DetNode[];
}

export interface DetSpecialSpliceIndicator {
    kind: DetNodeKind.DetSpecialSpliceIndicator;
    contents: DetNode[];
}

// TODO: Allow new DetNode types dynamically?
export type DetNode = DetTextStr | DetTag | DetSpecialSpliceIndicator;
