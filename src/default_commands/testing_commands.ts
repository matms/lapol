export const define = {
    hey: hey,
};

import { DetNodeKind, DetTextStr } from "../det";

function hey(): DetTextStr {
    console.log("hey from here!");
    return { kind: DetNodeKind.DetTextStrKind, content: "hello from hey function!" };
}
