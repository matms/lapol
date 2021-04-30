export const commands = {
    hey: hey,
    hey_varargs: [hey_varargs, { varArgs: true }],
    title: title,
    section: section,
};

import { DetNodeKind, DetTextStr, DetNodeType, DetTag } from "../det";

function title(arg1: DetNodeType[]): DetTag {
    return {
        kind: DetNodeKind.DetTag,
        tag: "h1",
        contents: arg1,
    };
}

function section(arg1: DetNodeType[]): DetTag {
    return {
        kind: DetNodeKind.DetTag,
        tag: "h2",
        contents: arg1,
    };
}

function hey(arg1: DetNodeType[]): DetTextStr {
    // console.log("hey from here!");
    return {
        kind: DetNodeKind.DetTextStrKind,
        text: `Hello, ${(arg1[0] as DetTextStr).text}`,
    };
}

function hey_varargs(arg1: DetNodeType[], ..._rest: DetNodeType[]): DetTextStr {
    // console.log("hey from here!");
    return {
        kind: DetNodeKind.DetTextStrKind,
        text: `Hello, ${(arg1[0] as DetTextStr).text}`,
    };
}
