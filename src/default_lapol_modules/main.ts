export const commands = {
    hey: hey,
};

import { DetNodeKind, DetTextStr, DetNode } from "../det";

function hey(arg1: DetNode[]): DetTextStr {
    console.log("hey from here!");
    return {
        kind: DetNodeKind.DetTextStrKind,
        content: `Hello, ${(arg1[0] as DetTextStr).content}`,
    };
}
