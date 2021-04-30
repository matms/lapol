export const commands = {
    hey: hey,
    hey_varargs: [hey_varargs, { varArgs: true }],
    title: title,
    section: section,
};

import { DetNodeKind, DetTextStr, DetNode, DetTag } from "../det";

function title(arg1: DetNode[]): DetTag {
    return {
        kind: DetNodeKind.DetTag,
        tag: "h1",
        contents: arg1,
    };
}

function section(arg1: DetNode[]): DetTag {
    return {
        kind: DetNodeKind.DetTag,
        tag: "h2",
        contents: arg1,
    };
}

function hey(arg1: DetNode[]): DetTextStr {
    // console.log("hey from here!");
    return {
        kind: DetNodeKind.DetTextStrKind,
        text: `Hello, ${(arg1[0] as DetTextStr).text}`,
    };
}

function hey_varargs(arg1: DetNode[], ..._rest: DetNode[]): DetTextStr {
    // console.log("hey from here!");
    return {
        kind: DetNodeKind.DetTextStrKind,
        text: `Hello, ${(arg1[0] as DetTextStr).text}`,
    };
}
