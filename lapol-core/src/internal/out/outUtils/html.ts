import { LtrfStr } from "../../ltrf/ltrf";
import { Output, OutputCtx } from "../common";

import { encode as heEncode } from "he";

/** Output an escaped string to HTML. */
export function htmlOutStr(s: LtrfStr): Output {
    return { code: heEncode(s, { strict: true }) };
}

/** Output an UNESCAPED string to HTML. */
export function htmlOutStrWithoutEscape(s: LtrfStr): Output {
    return { code: s };
}
