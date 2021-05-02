export enum AstNodeKind {
    AstStrNode = "AstStrNode",
    AstCommandNode = "AstCommandNode",
    AstRootNode = "AstRootNode",
}

export interface AstStrNode {
    kind: AstNodeKind.AstStrNode;
    content: string;
    sourceStartCol: number; // The first column is 1.
    sourceStartLine: number; // The first line is 1.
}

export interface AstCommandNode {
    kind: AstNodeKind.AstCommandNode;
    commandName: string;
    squareArg: AstNode[] | undefined;
    curlyArgs: AstNode[][];
}

export interface AstRootNode {
    kind: AstNodeKind.AstRootNode;
    subNodes: AstNode[];
}

export type AstNode = AstStrNode | AstCommandNode | AstRootNode;
