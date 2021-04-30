import { triggerAsyncId } from "node:async_hooks";
import { assert } from "node:console";
import {
    DetNode,
    DetNodeKind,
    DetRoot,
    DetSpecialSpliceIndicator,
    DetTag,
    DetTextStr,
} from "./det";
import { LapolError } from "./errors";

/** Immutably update node.contents, returning a new node with newContents in place
 * of contents.
 *
 * Errors out if `node` doesn't have `contents` (e.g. `DetTextStr`).
 */
export function replaceContents<T extends DetNode>(node: T, newContents: DetNode[]): T {
    switch (node.kind) {
        case DetNodeKind.DetRoot: {
            let out: DetRoot = { kind: DetNodeKind.DetRoot, contents: newContents };
            return out as T;
        }
        case DetNodeKind.DetSpecialSpliceIndicator: {
            let out: DetSpecialSpliceIndicator = {
                kind: DetNodeKind.DetSpecialSpliceIndicator,
                contents: newContents,
            };
            return out as T;
        }
        case DetNodeKind.DetTag: {
            let out: DetTag = {
                kind: DetNodeKind.DetTag,
                tag: (node as DetTag).tag,
                contents: newContents,
            };
            return out as T;
        }
        case DetNodeKind.DetTextStrKind: {
            throw new LapolError("TextStr doesn't have a contents attribute.");
        }
    }
}

/** Immutably update node.contents using function `newContentFn`,
 * returning a new node with newContents in place
 * of contents.
 *
 * newContentFn takes in an array of nodes and returns an array of nodes.
 *
 * If the node doesn't have a contents propriety (e.g., `DetTextStr`), return the original node
 * unchanged.
 */
export function updateContents<T extends DetNode>(
    node: T,
    newContentFn: (nodes: DetNode[]) => DetNode[]
): T {
    if (node.kind === DetNodeKind.DetTextStrKind) return node;
    return replaceContents(node, newContentFn((node as { contents: DetNode[] }).contents));
}

/** Immutably update node.contents using function `updateFn`,
 * returning a new node with newContents in place
 * of contents.
 *
 * updateFn takes in a single node and returns a single node.
 *
 * If the node doesn't have a contents propriety (e.g., `DetTextStr`), return the original node
 * unchanged.
 */
export function mapUpdateContents<T extends DetNode>(
    node: T,
    updateFn: (node: DetNode) => DetNode
): T {
    return updateContents(node, (nodes) => nodes.map(updateFn));
}
