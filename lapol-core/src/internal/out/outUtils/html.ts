import { LtrfStr } from "../../ltrf/ltrf";
import { Output } from "../common";

import { encode as heEncode } from "he";

/** Output an escaped string to HTML. */
export function htmlOutStr(s: LtrfStr): Output {
    return Output.makeCode(heEncode(s, { strict: true }));
}

/** Output an UNESCAPED string to HTML. */
export function htmlOutStrWithoutEscape(s: LtrfStr): Output {
    return Output.makeCode(s);
}
