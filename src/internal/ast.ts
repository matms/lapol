//! These are _manually_ generated from rust
//! See lapol-parse-rs file ast.rs for details on these types.

export interface AstTextNode {
    t: "AstTextNode";
    content: string;
}

export interface AstCommandNode {
    t: "AstCommandNode";
    commandName: string;
    squareArgs: SquareArg[] | null;
    curlyArgs: AstNode[][];
}

export interface AstRootNode {
    t: "AstRootNode";
    subNodes: AstNode[];
}

export enum AstNodeKind {
    AstStrNode = "AstStrNode",
    AstCommandNode = "AstCommandNode",
    AstRootNode = "AstRootNode",
}

export interface SquareArgVal {
    t: "Val";
    c: SquareEntry;
}

export interface SquareArgKeyVal {
    t: "Val";
    c: SquareEntry[];
}

export interface SquareEntryNum {
    t: "Num";
    c: number;
}

export interface SquareEntryIdent {
    t: "Ident";
    c: string;
}

export interface SquareEntryBool {
    t: "Bool";
    c: boolean;
}

export interface SquareEntryQuotedStr {
    t: "QuotedStr";
    c: string;
}

export interface SquareEntryAstNode {
    t: "AstNode";
    c: AstNode;
}

export type SquareEntry =
    | SquareEntryNum
    | SquareEntryIdent
    | SquareEntryBool
    | SquareEntryQuotedStr
    | SquareEntryAstNode;

export type SquareArg = SquareArgVal | SquareArgKeyVal;

export type AstNode = AstTextNode | AstCommandNode | AstRootNode;
